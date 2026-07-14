# プロジェクトコンテキスト: izumiz-me-blog

## 概要

このプロジェクトは、**Astro** と **React** を使用し、Headless CMSとして **Notion** を利用した静的ブログサイトです。Notion APIを通じてコンテンツ（記事、ギャラリーアイテム、本の感想）を取得し、静的にレンダリングします。

このプロジェクトは `astro-notion-blog` のフォーク、またはその派生です。

## 主要技術

- **フレームワーク:** [Astro](https://astro.build/) (静的サイトジェネレーター)
- **UIライブラリ:** [React](https://reactjs.org/)
- **CMS:** [Notion](https://www.notion.so/) (via `@notionhq/client`)
- **言語:** TypeScript
- **ビルドツール/タスクランナー:** [Nx](https://nx.dev/) (コンテンツ取得タスクのキャッシュ/オーケストレーションに使用)
- **パッケージマネージャー:** pnpm (`pnpm-lock.yaml` より推測)

## アーキテクチャとデータフロー

1.  **コンテンツ管理:** すべてのブログ記事とギャラリーアイテムは Notion データベースで管理されます。
2.  **コンテンツ取得 (ビルド時):**
    - `scripts/blog-contents-cache.cjs`: Notion からページリストを取得するメインスクリプト。
    - `scripts/retrieve-block-children.cjs`: 各ページの特定のブロック（コンテンツ）を取得します。
    - データはローカル（おそらく `tmp/`）にキャッシュされ、ビルドパフォーマンスの向上と Notion API レート制限の回避を図ります。
3.  **静的生成:** Astro はキャッシュされたデータ（キャッシュがない場合は取得）を読み込み、静的な HTML/CSS/JS を生成します。
4.  **インテグレーション:**
    - `src/integrations/` 内のカスタムインテグレーションが、画像（カバー、アイキャッチ画像、アイコン）を `public/` にダウンロードし、期限切れになる Notion S3 URL のホットリンクを回避します。

## 主要ファイルとディレクトリ

- `astro.config.mjs`: Astro 設定ファイル。画像ダウンロード用のカスタムインテグレーションを含みます。
- `package.json`: プロジェクトのスクリプトと依存関係。
- `src/server-constants.ts`: 設定定数と環境変数のマッピング。
- `src/lib/notion/client.ts`: Notion API と対話するためのコアロジック（データベース、ブロック、ページの取得）。
- `scripts/`: Notion コンテンツの事前取得とキャッシュを行う Node.js スクリプト。
- `src/pages/`: Astro ルーティング（例: `posts/[slug].astro`, `gallery/index.astro`）。
- `src/components/`: Astro および React コンポーネント。
- `src/layouts/`: ページレイアウト (`Layout.astro`)。

## セットアップと使用方法

### 環境変数

`src/server-constants.ts` の要件に基づいて `.env` ファイルを作成してください。主な変数は以下の通りです：

- `NOTION_API_SECRET`: Notion インテグレーションのトークン。
- `DATABASE_ID`: ブログ記事用の Notion データベース ID。
- `GALLERY_ID`: （オプション）ギャラリー用の Notion データベース ID。
- `BOOK_REVIEW_ID`: （オプション）本の感想用の Notion データベース ID。
- `PUBLIC_GA_TRACKING_ID`: （オプション）Google Analytics ID。

### コンテンツソースの抽象化

`src/lib/notion/client.ts` は `ContentSource`（`'blog' | 'gallery' | 'bookReview'`）で3つの Notion DB を切り替える。DB定義は `CONTENT_SOURCES` マップで一元管理し、各取得関数は `source` 引数（デフォルト `'blog'`）を取る。

### Book Review DB のプロパティ

将来的に別リポジトリの読書進捗管理アプリと DB を共有する前提で設計。ブログは `Published=true` かつ `Date <= now` のレコードのみを表示する。

| プロパティ名    | Notion型     | 用途                             |
| --------------- | ------------ | -------------------------------- |
| `Page`          | title        | 本のタイトル                     |
| `Slug`          | rich_text    | 詳細ページURL                    |
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

### コマンド

| コマンド            | 説明                                                                    |
| :------------------ | :---------------------------------------------------------------------- |
| `pnpm dev`          | ローカルの Astro 開発サーバーを起動します。                             |
| `pnpm build`        | 静的サイトをビルドします。                                              |
| `pnpm build:cached` | **CI推奨。** `cache:fetch` を実行してから `build` します。              |
| `pnpm cache:fetch`  | Notion からすべてのコンテンツを取得し、ローカルにキャッシュします。     |
| `pnpm cache:purge`  | ローカルキャッシュ（`tmp/` ディレクトリ）と Nx キャッシュを削除します。 |
| `pnpm lint`         | ESLint を実行します。                                                   |
| `pnpm format`       | Prettier を実行します。                                                 |

### 開発規約

- **スタイル:** CSS Modules (`*.module.css`) または `src/layouts/` 内のグローバルスタイルを使用します。
- **コンポーネント:** インタラクティブな要素には React コンポーネントを使用し、構造やレイアウトには Astro コンポーネントを使用します。
- **Notion API:** Notion 関連のロジックは `src/lib/notion/` にカプセル化されています。
- **画像処理:** 画像は永続性を確保するため、ビルド時にカスタムインテグレーション（`src/integrations/`）によってダウンロードされます。
