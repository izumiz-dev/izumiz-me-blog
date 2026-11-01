#!/usr/bin/env node
/**
 * webp-convert.mjs — ビルド後処理として dist 内の画像を WebP 化する。
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
  try {
    await sharp(file).webp(WEBP_OPTIONS).toFile(output);
  } catch (error) {
    console.warn(`[webp] skip (convert failed): ${file}: ${error.message}`);
    return null;
  }
  const outStat = await fs.stat(output);
  await fs.unlink(file);
  return { from: file, to: output, before: stat.size, after: outStat.size };
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
  for (const { from, to } of results) {
    const fromRel = '/' + path.relative(dist, from).split(path.sep).join('/');
    const toRel = '/' + path.relative(dist, to).split(path.sep).join('/');
    replacements.push([fromRel, toRel], [encodeURI(fromRel), encodeURI(toRel)]);
  }
  replacements.sort((a, b) => b[0].length - a[0].length);

  const textFiles = allFiles.filter((file) =>
    TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())
  );
  let rewritten = 0;
  for (const file of textFiles) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;
    for (const [from, to] of replacements) {
      if (updated.includes(from)) updated = updated.split(from).join(to);
    }
    if (updated !== original) {
      await fs.writeFile(file, updated);
      rewritten++;
    }
  }

  const before = results.reduce((sum, r) => sum + r.before, 0);
  const after = results.reduce((sum, r) => sum + r.after, 0);
  const mib = (n) => (n / 1048576).toFixed(1);
  console.log(
    `[webp] converted ${results.length} images: ${mib(before)} MiB -> ${mib(after)} MiB ` +
      `(${(((before - after) / before) * 100).toFixed(1)}% saved), rewrote references in ${rewritten} files`
  );
}

main().catch((error) => {
  console.error('[webp] failed:', error);
  process.exitCode = 1;
});
