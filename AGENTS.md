# AGENTS.md

このファイルは、このリポジトリで作業するすべての AI エージェント（Claude Code、
Gemini CLI、ZCode、Cursor 等）が共通で読むプロジェクト指示書です。各エージェント
固有のファイル（`GEMINI.md`, `CLAUDE.md` 等）はこのファイルを参照します。

## プロジェクト概要

**Astro** + **React** で構築された静的ブログサイト。Headless CMS として **Notion**
を利用し、Notion API 経由でコンテンツ（記事、ギャラリー、本の感想）を取得して
静的にレンダリングする。`astro-notion-blog` のフォーク派生。

## 主要技術

- **フレームワーク:** [Astro](https://astro.build/)（静的サイトジェネレーター）
- **UIライブラリ:** [React](https://reactjs.org/)
- **CMS:** [Notion](https://www.notion.so/)（via `@notionhq/client` v5）
- **言語:** TypeScript
- **ビルドツール/タスクランナー:** [Nx](https://nx.dev/)（コンテンツ取得タスクの
  キャッシュ/オーケストレーションに使用）
- **パッケージマネージャ:** pnpm（`pnpm-lock.yaml` のみ管理。npm/yarn は使わない）

## アーキテクチャとデータフロー

1. **コンテンツ管理:** すべてのブログ記事・ギャラリーアイテム・本の感想は
   Notion データベースで管理される。
2. **コンテンツ取得（ビルド時）:**
   - `scripts/blog-contents-cache.cjs`: Notion からページリストを取得するメインスクリプト。
   - `scripts/retrieve-block-children.cjs`: 各ページのブロック（コンテンツ）を取得。
   - データはローカル（`tmp/`）にキャッシュされ、ビルド性能向上と Notion API
     レート制限回避を図る。
3. **静的生成:** Astro はキャッシュ（未キャッシュ時は取得）を読み込み、静的
   HTML/CSS/JS を生成する。
4. **インテグレーション:** `src/integrations/` 内のカスタムインテグレーションが、
   画像（カバー、アイキャッチ、アイコン、表紙）を `public/` にダウンロードし、
   期限切れになる Notion S3 URL のホットリンクを回避する。

## 主要ファイルとディレクトリ

- `astro.config.mjs`: Astro 設定。画像ダウンロード用カスタムインテグレーションを含む。
- `package.json`: スクリプトと依存関係。
- `src/server-constants.ts`: 設定定数と環境変数のマッピング。
- `src/lib/notion/client.ts`: Notion API と対話するコアロジック（DB/ブロック/ページ取得）。
- `scripts/`: Notion コンテンツの事前取得・キャッシュを行う Node.js スクリプト。
- `src/pages/`: Astro ルーティング（例: `posts/[slug].astro`, `gallery/index.astro`,
  `book-reviews/[slug].astro`）。
- `src/components/`: Astro / React コンポーネント。
- `src/layouts/`: ページレイアウト（`Layout.astro`）とグローバルスタイル。

## コンテンツソースの抽象化

`src/lib/notion/client.ts` は `ContentSource`（`'blog' | 'gallery' | 'bookReview'`）
で3つの Notion DB を切り替える。DB 定義は `CONTENT_SOURCES` マップで一元管理し、
各取得関数は `source` 引数（デフォルト `'blog'`）を取る。

### Book Review DB のプロパティ

将来的に別リポジトリの読書進捗管理アプリと DB を共有する前提で設計。
ブログは `Published=true` かつ `Date <= now` のレコードのみを表示する。

| プロパティ名    | Notion 型    | 用途                             |
| --------------- | ------------ | -------------------------------- |
| `Page`          | title        | 本のタイトル                     |
| `Slug`          | rich_text    | 詳細ページ URL                   |
| `Date`          | date         | 公開日／フィルタ・ソート基準     |
| `Published`     | checkbox     | ブログ公開制御                   |
| `FeaturedImage` | files        | 表紙画像                         |
| `Author`        | rich_text    | 著者                             |
| `Publisher`     | rich_text    | 出版社                           |
| `ReadingStatus` | select       | 読了／読書中                     |
| `Rating`        | number       | 星評価（1〜5）                   |
| `Tags`          | multi_select | ジャンル分類                     |
| `Excerpt`       | rich_text    | 一覧要約／OGP description        |
| `Rank`          | number       | 既存互換（未使用でも存在させる） |

## 環境変数

`src/server-constants.ts` の要件に基づき `.env` ファイルを作成すること。
主な変数:

- `NOTION_API_SECRET`: Notion インテグレーションのトークン。
- `DATABASE_ID`: ブログ記事用の Notion データベース ID。
- `GALLERY_ID`: （オプション）ギャラリー用の Notion データベース ID。
- `BOOK_REVIEW_ID`: （オプション）本の感想用の Notion データベース ID。
- `PUBLIC_GA_TRACKING_ID`: （オプション）Google Analytics ID。

## コマンド

| コマンド            | 説明                                                              |
| :------------------ | :---------------------------------------------------------------- |
| `pnpm dev`          | ローカルの Astro 開発サーバーを起動する。                         |
| `pnpm build`        | 静的サイトをビルドする。                                          |
| `pnpm build:cached` | **CI 推奨。** `cache:fetch` を実行してから `build` する。         |
| `pnpm cache:fetch`  | Notion からすべてのコンテンツを取得し、ローカルにキャッシュする。 |
| `pnpm cache:purge`  | ローカルキャッシュ（`tmp/`）と Nx キャッシュを削除する。          |
| `pnpm lint`         | ESLint を実行する。                                               |
| `pnpm format`       | Prettier を実行する。                                             |

## 開発規約

- **スタイル:** CSS Modules（`*.module.css`）または `src/layouts/` 内のグローバル
  スタイルを使用する。
- **コンポーネント:** インタラクティブな要素には React コンポーネント、構造・
  レイアウトには Astro コンポーネントを使用する。
- **Notion API:** Notion 関連のロジックは `src/lib/notion/` にカプセル化する。
- **画像処理:** 画像は永続性を確保するため、ビルド時にカスタムインテグレーション
  （`src/integrations/`）でダウンロードする。
- **パッケージマネージャ:** 常に pnpm を使う。`package-lock.json` は復活させない。
- **コミットメッセージ:** Conventional Commits（`feat:`, `fix:`, `style:`, `chore:`,
  `refactor:` 等）を日本語で書く（既存履歴に倣う）。

## デザイン（必読）

ビジュアルの一貫性を保つため、UI を追加・変更する場合は必ず **[DESIGN.md](./DESIGN.md)**
を参照すること。デザイントークン（`--radius`, `--chrome-*`, `--aqua-*`, `--lime`）、
額装レシピ、コンポーネント別ルール、ライト/ダーク両対応の品質フロアが定義されている。

要約:

- **概念:** y2k / Frutiger Aero × 無骨クローム。
- **3 原則:** signature 背景で世界観を敷く / クロームで額装する / 無骨さは締めで出す。
- **やってはいけない:** 新しい配色・角丸・影を勝手に増やす、装飾的な左バーを付ける、
  signature 背景をベタ塗りで隠す、片方（ライト/ダーク）だけ実装して放置する。

## 作業時の注意

- **upstream マージ:** `otoyo/astro-notion-blog` を定期的に取り込む。コンフリクト時は
  スタイル・独自 UI・ツールチェイン（B）は自分優先、Notion API 関連（A）は upstream 優先、
  独自機能と API 移行の両立（C）は手動統合する。
- **push は指示があるまで行わない。** コミットは作ってよいがリモートへの反映は
  （必要なら）ユーザーの明示的な指示を待つ。
- **品質確認:** 変更後は `pnpm lint` / `pnpm build` を通し、`pnpm preview`
  （dist 配信）で chrome-devtools 等を使いライト/ダーク/モバイルを目視確認する。
