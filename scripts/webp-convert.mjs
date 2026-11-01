#!/usr/bin/env node
/**
 * webp-convert.mjs — ビルド後処理として dist 内の画像を WebP 化し、
 * レスポンシブ表示用の幅バリアントと srcset を生成する。
 *
 * 設計:
 * - 対象は dist 配下の .png / .jpg / .jpeg。Notion からコピーされた本文画像や
 *   カバー画像がここに集まる（最大で数 MB の PNG スクリーンショットを含む）。
 * - 変換には既存の依存関係である sharp を使う。品質は 85、effort は 4
 *   （ビルド時間の増加を抑えるため）。
 * - 変換に成功したファイルは元ファイルを削除し、dist 内のテキストファイル
 *   （HTML / XML / JSON / CSS / JS など）に含まれる参照を .webp へ書き換える。
 *   参照はルート相対パスと URL エンコード済みパスの両形式を置換するため、
 *   絶対 URL（独自ドメイン付き）内のパスも追随する。
 * - レスポンシブ対応: 変換した画像について、元幅より小さい幅のバリアント
 *   （480 / 800 / 1200 / 1600px、ファイル名は `<name>-<幅>w.webp`）を生成し、
 *   HTML 内の <img> に srcset と sizes を付与する。sizes は記事本文カラムの
 *   最大幅（PostBody の max-width: 840px）に合わせる。カバー画像等の
 *   <link rel="preload" as="image"> にも imagesrcset / imagesizes を付与し、
 *   プリロードが表示サイズに合ったバリアントを選ぶようにする。
 *   srcset を既に持つ <img> は変更しない。バリアント生成に失敗した幅は
 *   その幅だけ諦め、残りで srcset を組む。
 * - 除外:
 *   - dist/og/ 配下: OG 画像はクローラー側の対応状況を優先し元の形式を保つ。
 *   - dist 直下のファイル: ファビコン等のサイト共通素材は対象外。
 *   - 8KB 未満: 削減効果が乏しいため対象外。
 * - 変換に失敗した画像は元ファイルを残し、参照も書き換えない（警告のみ）。
 *   1枚の失敗でビルド全体を落とさない。
 *
 * 使い方: node scripts/webp-convert.mjs [distDir]（既定: dist）
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIST_DIR = process.argv[2] ?? 'dist';
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const TEXT_EXTENSIONS = new Set([
  '.html',
  '.xml',
  '.json',
  '.txt',
  '.css',
  '.js',
  '.mjs',
  '.webmanifest',
  '.svg',
]);
const MIN_BYTES = 8192;
const WEBP_OPTIONS = { quality: 85, effort: 4 };
const CONCURRENCY = 8;
const VARIANT_WIDTHS = [480, 800, 1200, 1600];
const SRCSET_SIZES = '(max-width: 840px) 100vw, 840px';

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isExcluded(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  if (normalized.startsWith('og/')) return true;
  if (!normalized.includes('/')) return true; // dist 直下（アイコン等）
  return false;
}

async function convertOne(file) {
  const stat = await fs.stat(file);
  if (stat.size < MIN_BYTES) return null;
  const output = file.replace(/\.(png|jpe?g)$/i, '.webp');
  let sourceWidth = null;
  try {
    const metadata = await sharp(file).metadata();
    sourceWidth = metadata.width ?? null;
    await sharp(file).webp(WEBP_OPTIONS).toFile(output);
  } catch (error) {
    console.warn(`[webp] skip (convert failed): ${file}: ${error.message}`);
    return null;
  }
  const outStat = await fs.stat(output);
  await fs.unlink(file);

  // 元幅より小さい幅のバリアントを生成する。
  const variants = [];
  if (sourceWidth) {
    for (const width of VARIANT_WIDTHS) {
      if (width >= sourceWidth) continue;
      const variantFile = output.replace(/\.webp$/i, `-${width}w.webp`);
      try {
        await sharp(output)
          .resize({ width })
          .webp(WEBP_OPTIONS)
          .toFile(variantFile);
        variants.push({ file: variantFile, width });
      } catch (error) {
        console.warn(
          `[webp] skip variant ${width}w: ${output}: ${error.message}`
        );
      }
    }
  }
  return {
    from: file,
    to: output,
    before: stat.size,
    after: outStat.size,
    sourceWidth,
    variants,
  };
}

function buildSrcset(entry, encode) {
  const parts = entry.variants.map((v) => `${encode(v.rel)} ${v.width}w`);
  if (entry.sourceWidth) {
    parts.push(`${encode(entry.toRel)} ${entry.sourceWidth}w`);
  }
  return parts.join(', ');
}

function injectSrcset(html, srcsetByPath) {
  const lookup = (rawSrc) => {
    if (srcsetByPath.has(rawSrc)) {
      return buildSrcset(srcsetByPath.get(rawSrc), (s) => s);
    }
    const decoded = decodeURI(rawSrc);
    if (srcsetByPath.has(decoded)) {
      const entry = srcsetByPath.get(decoded);
      return buildSrcset(entry, (s) => encodeURI(s));
    }
    return null;
  };

  let updated = html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bsrcset\s*=/i.test(tag)) return tag;
    const match = tag.match(/\bsrc\s*=\s*"([^"]+)"/i);
    if (!match) return tag;
    const srcset = lookup(match[1]);
    if (!srcset) return tag;
    return tag.replace(
      match[0],
      `${match[0]} srcset="${srcset}" sizes="${SRCSET_SIZES}"`
    );
  });

  updated = updated.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel\s*=\s*"preload"/i.test(tag)) return tag;
    if (!/\bas\s*=\s*"image"/i.test(tag)) return tag;
    if (/\bimagesrcset\s*=/i.test(tag)) return tag;
    const match = tag.match(/\bhref\s*=\s*"([^"]+)"/i);
    if (!match) return tag;
    const srcset = lookup(match[1]);
    if (!srcset) return tag;
    return tag.replace(
      match[0],
      `${match[0]} imagesrcset="${srcset}" imagesizes="${SRCSET_SIZES}"`
    );
  });

  return updated;
}

async function main() {
  const dist = path.resolve(DIST_DIR);
  const allFiles = await walk(dist);
  const images = allFiles.filter((file) => {
    const relative = path.relative(dist, file);
    return (
      IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()) &&
      !isExcluded(relative)
    );
  });

  const results = [];
  for (let i = 0; i < images.length; i += CONCURRENCY) {
    const chunk = await Promise.all(
      images.slice(i, i + CONCURRENCY).map(convertOne)
    );
    results.push(...chunk.filter(Boolean));
  }

  if (results.length === 0) {
    console.log('[webp] no images converted');
    return;
  }

  // 参照の書き換え: 相対パス（/ 区切り）と URL エンコード形式の両方を置換する。
  const replacements = [];
  const srcsetByPath = new Map();
  for (const result of results) {
    const fromRel =
      '/' + path.relative(dist, result.from).split(path.sep).join('/');
    const toRel =
      '/' + path.relative(dist, result.to).split(path.sep).join('/');
    replacements.push([fromRel, toRel], [encodeURI(fromRel), encodeURI(toRel)]);
    if (result.variants.length > 0) {
      srcsetByPath.set(toRel, {
        toRel,
        sourceWidth: result.sourceWidth,
        variants: result.variants.map((v) => ({
          rel: '/' + path.relative(dist, v.file).split(path.sep).join('/'),
          width: v.width,
        })),
      });
    }
  }
  replacements.sort((a, b) => b[0].length - a[0].length);

  const textFiles = allFiles.filter((file) =>
    TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())
  );
  let rewritten = 0;
  let srcsetInjected = 0;
  for (const file of textFiles) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;
    for (const [from, to] of replacements) {
      if (updated.includes(from)) updated = updated.split(from).join(to);
    }
    if (file.toLowerCase().endsWith('.html') && srcsetByPath.size > 0) {
      const withSrcset = injectSrcset(updated, srcsetByPath);
      if (withSrcset !== updated) {
        srcsetInjected += (withSrcset.match(/srcset=|imagesrcset=/g) ?? [])
          .length;
        updated = withSrcset;
      }
    }
    if (updated !== original) {
      await fs.writeFile(file, updated);
      rewritten++;
    }
  }

  const before = results.reduce((sum, r) => sum + r.before, 0);
  const after = results.reduce((sum, r) => sum + r.after, 0);
  const variantCount = results.reduce((sum, r) => sum + r.variants.length, 0);
  const mib = (n) => (n / 1048576).toFixed(1);
  console.log(
    `[webp] converted ${results.length} images: ${mib(before)} MiB -> ${mib(after)} MiB ` +
      `(${(((before - after) / before) * 100).toFixed(1)}% saved), generated ${variantCount} variants, ` +
      `injected ${srcsetInjected} srcset attributes, rewrote references in ${rewritten} files`
  );
}

main().catch((error) => {
  console.error('[webp] failed:', error);
  process.exitCode = 1;
});
