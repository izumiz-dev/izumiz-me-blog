# デザインシステム — y2k / Frutiger Aero × 無骨クローム

このブログの視覚言語をまとめたドキュメント。新しい UI を足すとき、upstream を
取り込むとき、既存パーツを直すときに、ここに書かれたトークンとルールに従えば
一貫性が保たれる。

---

## 1. デザイン哲学

### コンセプト

**「濡れたガラスと空」の Frutiger Aero を主軸に、ゆるふわに寄せず無骨なメカ／
クローム／ガンメタルを効かせた y2k」**。2000年代前半の Mac OS X Aqua・Web 2.0 の
光沢に、工業的なヘアライン・金属フレーム・ビス（リベット）を混ぜた世界観。

y2k には「ゆるふわ Aero（水滴・虹・パステル）」と「メタリック／メカ／工業」の
両面がある。このブログは後者を軸に、前者の空グラデ背景と光沢を土台として使う。

### 3つの原則

1. **signature 背景で世界観を敷く** — 全ページ共通で「空色グラデ + 浮遊する光の泡 +
   うっすらテック grid」を `body` に固定表示する。これがこのブログの一番の見せ場で、
   中央の白い紙面（記事本文）の外側に常に透けて見える。ライト/ダーク両対応。

2. **クロームで額装する** — タイトル・ナビ・カード・画像・埋め込みなど、まとまった
   要素はすべて「クロームの縁 + 内側ハイライト + 柔らかい影」で額装し、紙面から
   少し浮かせる。装飾は増やさず、同じ額装トークンを使い回す。

3. **無骨さは締めで出す** — 角丸は緩ピル(999px)を使わず 6px に締める。金属の
   ガンメタル slab、ヘアライン、ビス（リベット）で工業感を足す。ただし過剰に
   飾らない（Chanel の「鏡の前で一つ外す」— signature 以外は静かに保つ）。

### やっていい / ダメ

| やっていい                                                     | ダメ                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| 既存トークン（`--radius`, `--chrome-*`, `--aqua-*`）の使い回し | 新しい配色・角丸値・影を勝手に増やす                     |
| クローム縁 + inset ハイライト + 影の額装                       | 装飾的な「左バー（縦ライン）」— AIっぽく見えるため不採用 |
| 見出しに丸ゴシック、本文はゴシック                             | 本文フォントを凝った display 体にする                    |
| lime を植物/自然のワンポイントに少量                           | lime を主役級に多用する                                  |
| ライト/ダーク両方を必ず書く                                    | 片方だけ実装して放置する                                 |

---

## 2. デザイントークン

すべて `src/layouts/my-variables.css`（chrome/aqua/lime/radius/font-round）と
`src/layouts/global.css`（bg/fg/font-sans/font-mono）で定義。ライトは `:root`、
ダークは `@media (prefers-color-scheme: dark)` で上書き。

### 角丸

| トークン         | 値    | 用途                                   |
| ---------------- | ----- | -------------------------------------- |
| `--radius`       | `6px` | 標準の額装・ボタン・カード。無骨さの要 |
| `--radius-tight` | `4px` | タグ、検索結果行など小さい要素         |

緩ピル（`9999px`）は使わない（締まりが出ないため）。丸くしたい円ボタンはビス等の
装飾要素のみ。

### フォント

| トークン       | スタック                                    | 用途                                          |
| -------------- | ------------------------------------------- | --------------------------------------------- |
| `--font-round` | `Hiragino Maru Gothic ProN` → sans fallback | 見出し(h1〜h4)、`.post-title`、サイトタイトル |
| `--font-sans`  | `Hiragino Sans` → system                    | 本文・UI 全般                                 |
| `--font-mono`  | `SFMono-Regular` → mono                     | コード                                        |

### クローム（シルバー／ダークはガンメタル）

| トークン              | ライト                  | ダーク                  | 用途                     |
| --------------------- | ----------------------- | ----------------------- | ------------------------ |
| `--chrome-bright`     | `#fdfefe`               | `#3a3f4d`               | クローム最上部ハイライト |
| `--chrome-mid`        | `#d8dde6`               | `#252836`               | クローム中間             |
| `--chrome-shade`      | `#a7afbe`               | `#13151d`               | クローム下部の陰         |
| `--chrome-rim`        | `rgba(255,255,255,.75)` | `rgba(255,255,255,.14)` | inset 上ハイライト       |
| `--chrome-rim-bottom` | `rgba(0,0,0,.1)`        | `rgba(0,0,0,.5)`        | inset 下の陰             |
| `--chrome-border`     | `#b8c0cf`               | `rgba(255,255,255,.12)` | 額装の 1px 縁            |
| `--chrome-gradient`   | 上記4色の縦グラデ       | 同                      | 金属面の塗り             |

### Aqua（アクティブ／カレント状態のアクセント）

| トークン          | ライト            | ダーク    |
| ----------------- | ----------------- | --------- |
| `--aqua-bright`   | `#6fb5ff`         | `#82c5ff` |
| `--aqua-mid`      | `#2b7fe0`         | `#3b8de0` |
| `--aqua-shade`    | `#1b5fb0`         | `#1f4b90` |
| `--aqua-gradient` | 上記3色の縦グラデ | 同        |

### Lime（Frutiger の自然=植物/水のワンポイント。少量のみ）

| トークン      | ライト    | ダーク    |
| ------------- | --------- | --------- |
| `--lime`      | `#8fdc4e` | `#a3e86b` |
| `--lime-deep` | `#5bb524` | `#6bcc2e` |

### ガンメタル slab（サイトタイトル用、CSS 内リテラル）

`linear-gradient(180deg, #4a5063, #2b3040 48%, #13161f 52%, #252a38)`
（ダークは若干明るい `#5a6178 / #353a4c / #1a1d28 / #2e3343`）

---

## 3. signature 背景（`src/layouts/global.css`）

`body` に `background-attachment: fixed` で以下を重ねる:

- **ライト**: 空色グラデ `#c3e0f5 → #d9eef9 → #eaf4fa`（下方向）＋ 白い光の泡
  （`radial-gradient` を数カ所）＋ lime のごく淡い泡1つ ＋ テック grid
  （縦横 `repeating-linear-gradient`、44px 間隔、`rgba(30,60,110,.03〜.045)`）。
- **ダーク**: 暗色グラデ `#05070f → #0b0e1a → #0f1424` ＋ 青/lime の淡い泡 ＋
  青グローのテック grid。

中央の記事本文の紙面（`div.content`）は `--my-fr-color`（ライト ≒ 白 `#fcfcfc` /
ダーク `#15192b`）で不透明に塗り、可読性を確保する。**背景を紙面の外側で見せる**のが
基本構造。`main` などに独自のベタ塗り背景を足して signature を覆い隠さないこと
（過去に薄紫や黒でこれをやって「浮く」不具合が出た → コミット `f3635fe` / `1d273b0`）。

---

## 4. 額装レシピ（共通パターン）

まとまった要素を紙面から浮かせる標準の額装。**この3点セットを使い回す**:

```css
border-radius: var(--radius);
border: 1px solid var(--chrome-border);
box-shadow:
  inset 0 1px 0 var(--chrome-rim),
  /* 上辺の光沢 */ 0 3px 12px rgba(20, 40, 80, 0.12); /* 柔らかい影（ライト） */
overflow: hidden; /* 角丸を中身にも効かせる */
```

ダークは影を `0 3px 14px rgba(0, 0, 0, 0.35)` に差し替える（`@media` で）。

画像・動画・CodePen・回路シミュレータ埋め込みはこのレシピをそのまま適用済み。

---

## 5. コンポーネント別ルール

### サイトタイトル（`layout.css` `main header h1`）

- 外枠 `h1` = クローム slab（`--chrome-gradient` + 4px パディング + 角丸
  `calc(var(--radius)+4px)`）、`::before`/`::after` で両端にビス（リベット、
  径5pxの radial-gradient）。
- 内側 `h1 a` = ガンメタル slab（上記リテラル）にテキスト。丸ゴシック800。
- テキストは**蛍光灯風のちらつき演出**あり（`title-tube-boot` 起動時 + `title-tube-idle`
  32sで稀にチラつく、`brightness`ではなく `text-shadow` の発光グローと色で表現、
  `prefers-reduced-motion` で無効化）。コミット `f4dbc92`。

### ナビ（`layout.css` `.nav-link`）

- クロームの角タブ（`--chrome-gradient`, 角丸 `--radius`）、ホバーで光沢スイープ
  （`::before` が左→右へ流れる）。`.active` は `--aqua-gradient`。

### 記事カード（`blog.module.css` `.postCard`）

- 常時ガラスパネル（半透明白グラデ + `--chrome-border` + inset 上ハイライト）。
  ホバーで浮く（`translateY(-1px)` + Aqua 寄りの縁と影）。左バー装飾は付けない。

### タグ（`notion-color.css` `.tag.{color}`）

- 9色 + default のグロスチップ。角丸 `--radius-tight`(4px)。各色は縦グラデ +
  縁 + inset 光沢。ライト/ダーク両定義あり。**Notion の色を潰さず反映する**。

### Callout（`Callout.astro` + `notion-color.css` `.{color}-background`）

- 枠 = `--chrome-border` + 上辺ヘアライン（`::before` の白グラデ横線）。
- 背景 = Notion の色に対応した**ガラス質**（`.{color}-background` を縦グラデ +
  inset ハイライト + 半透明に。9色 × ライト/ダーク）。`!important` は色指定に必要。
- 左バーは付けない。

### 引用（`Quote.astro`）

- 伝統的な左罫線は残すが色を `--aqua-mid` に寄せる（カード/Calloutの装飾左バーとは別物）。

### Bookmark（`Bookmark.astro`）

- メタルフレームのガラスカード（額装レシピ + サムネ境界に `--chrome-border`）。
  ホバーで Aqua 寄りに。

### 画像（`Image.astro`）

- 額装レシピを適用。**縦長画像は `max-height: min(70vh, 640px)` で頭打ち**にして
  画面占有を防ぐ（幅は intrinsic 比から calc で逆算、横長は実質無影響）。
  intrinsic サイズ取得失敗時は `.image-frame--fallback` で `object-fit: contain`。

### 埋め込み各種

- **YouTube動画（`Video.astro`）/ CodePen / 回路シミュレータ**: 額装レシピを適用。
- **Bluesky（`BlueskyEmbed.astro`）**: 中身は別オリジンの iframe で**内部スタイルは
  変更不可**。外側にグレー寄りのクロームマット（`--chrome-mid`〜`--chrome-shade`の
  グラデ + 8px パディング + 縁 + 影）を敷いて「額装された1枚のカード」として馴染ませる。
- **Tweet / Instagram / TikTok / Pinterest**: プラットフォーム純正ウィジェットが
  自前でスタイリングするため触らない（二重枠を避ける）。

### ページネーション（`Pagination.astro`）

- クロームの角キー（角丸 `--radius`）。`.is-current` は `--aqua-gradient`。

### 検索（`SearchButton.astro` / `SearchModal.astro`）

- ボタン = クローム角ボタン。モーダル = frosted glass（`backdrop-filter`）+ aqua rim +
  クローム縁。選択行は Aqua ハイライト。

### ギャラリー（`gallery/index.astro` / `GalleryImage.astro`）

- 通常ページと同じ signature 背景・タイトル・ナビを使う（**独自の黒背景は禁止**、
  過去に固定黒背景で浮いた → コミット `1d273b0`）。サムネイルは正方形クロップ +
  額装レシピの角丸/縁。

---

## 6. 必ず守る品質フロア

- **ライト/ダーク両対応**を必ず書く（片方だけにしない）。
- `prefers-reduced-motion: reduce` でアニメーション（蛍光灯・光沢スイープ等）を無効化。
- キーボードフォーカスの可視化を保つ。
- モバイル幅（〜375px）で崩れ・横スクロールを出さない。
- 変更後は `pnpm lint` / `pnpm build` を通し、`pnpm preview`（dist配信）で
  chrome-devtools 等を使いライト/ダーク/モバイルを目視確認する。

---

## 7. 関連コミット（経緯）

- `ec2191e` y2k デザインを無骨クローム × Frutiger Aero に深化（全体トーン確立）
- `f4dbc92` サイトタイトルの蛍光灯ちらつき演出
- `f3635fe` `main` の薄紫ベタ塗り背景を除去し signature を全体に見せる
- `7d4d54d` 記事内の画像・embed にクローム額装
- `1d273b0` gallery ページの黒背景ハードコード撤廃
