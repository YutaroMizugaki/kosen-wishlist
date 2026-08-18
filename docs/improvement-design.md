# KOSEN BOOKS 改善設計書

本書は KOSEN BOOKS MVP（Next.js 16 App Router + React 19 + TypeScript + Supabase）の
現状コードを精査し、発見した改善点と、その設計方針・実装方針をまとめたものです。
本書は設計提案であり、この時点でアプリ本体のコードは変更していません。

対象コミット時点のディレクトリ構成（主要部）:

- `app/(public)/page.tsx` … 公開一覧（`force-dynamic`）
- `app/(public)/request/page.tsx` … 学生の申請フォーム（クライアント）
- `app/admin/page.tsx` … 管理画面（Supabase Auth）
- `app/api/requests/route.ts` … 申請の受付・検証・保存
- `app/api/admin/route.ts` … 管理者用の取得・状態更新
- `app/api/books/lookup/route.ts` … openBD による書誌取得
- `lib/*` … `supabase.ts` / `requests.ts` / `demo-store.ts` / `isbn.ts` / `types.ts` / `admin-auth.ts` / `sample-data.ts`
- `supabase/schema.sql` … スキーマ・RLS・権限

---

## 1. 現状の評価サマリ

MVP としては、公開・申請・管理の一連の流れが動作し、RLS と列権限で個人情報
（`contact_email`）を非公開にするなどセキュリティ面の基本設計は良好です。一方で、
「本番運用の安全性」「品質保証（テスト・CI）」「不正・スパム対策」に、MVP を超えて
継続運用するうえで優先度の高いギャップがあります。

改善点の一覧（優先度は P0=最優先 〜 P3=任意）:

| # | 優先 | 分類 | 概要 |
| --- | --- | --- | --- |
| 1 | P0 | 運用安全性 | 環境変数の誤設定で本番が無言でデモモード（メモリ保存・再起動で消失）に落ちる |
| 2 | P0 | 品質保証 | 自動テストが皆無・CI 未整備（`isbn.ts` の検証・価格計算などが未テスト） |
| 3 | P1 | UX 不具合 | openBD 未収録の本は申請フォームを送信できない（フィールドが表示されない） |
| 4 | P1 | 不正対策 | レート制限が自己申告メール依存で回避容易・学校メール検証なし・即時公開 |
| 5 | P1 | 保守性 | 学科／学年／分野の定数がクライアントとサーバで二重定義（ドリフト源） |
| 6 | P2 | 性能 | 公開一覧が `force-dynamic` で毎回 DB 参照（キャッシュ余地あり） |
| 7 | P2 | 運用 | 管理操作の監査ログ・申請者への状態通知・`admin_note` 入力 UI が未実装 |
| 8 | P2 | セキュリティ | セキュリティヘッダ未設定・公開される外部 URL の扱い |
| 9 | P2 | 可観測性 | 構造化ログ・エラー監視・基本メトリクスが無い |
| 10 | P3 | コード品質 | 極端に長い JSX 行・管理画面の取得処理の重複など |

---

## 2. 各改善の詳細設計

### 2.1 [P0] 本番デモモード誤起動の防止 / 環境変数の検証

**問題**: `lib/supabase.ts` の `isDemoMode()` は `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` が未設定なら常に true を返します。デモモードでは
`lib/demo-store.ts` が `globalThis` 上のメモリ配列に保存するため、**本番で環境変数を
設定し忘れる／タイポすると、エラーにならず「投稿は成功したように見えるがサーバ再起動で
全消失」** という最悪の事故が起きえます。しかも表示上は正常なので発見が遅れます。

**設計方針**:

- 明示的な実行モードを環境変数で宣言する。例: `APP_MODE=production | demo`
  （未指定時は現行どおり env 有無から推定して後方互換を維持）。
- 起動時（またはリクエスト時の最初の1回）に検証するガードを追加する。擬似コード:

  ```ts
  // lib/env.ts（新規案）
  export function assertRuntimeConfig() {
    const isProd = process.env.APP_MODE === "production"
      || process.env.VERCEL_ENV === "production";
    if (isProd && isDemoMode()) {
      throw new Error(
        "本番モードですが Supabase 環境変数が未設定です。デモモードでの起動を中止します。"
      );
    }
  }
  ```

- Vercel の本番デプロイでは `APP_MODE=production` を必須にし、`assertRuntimeConfig()` を
  `instrumentation.ts`（Next.js の起動フック）で呼び出して早期失敗させる。
- 併せて、デモモード時は公開ページ・管理ログイン画面に「デモ表示中（データは保存されません）」
  のバナーを常時表示し、誤認を防ぐ。

**影響範囲**: `lib/supabase.ts`、新規 `lib/env.ts`・`instrumentation.ts`、`.env.example`、
`README.md`。アプリのロジックは非破壊（既存デモ動作は維持）。

### 2.2 [P0] 自動テストと CI の導入

**問題**: `package.json` にテストスクリプトが無く、テストコードも存在しません。特に
純粋関数である `lib/isbn.ts`（ISBN-10/13 のチェックディジット、ISBN-13 変換）と
`app/api/books/lookup/route.ts` の `getTaxIncludedPrice`（税区分コードから税込計算）、
`inferCategory`（分野推定）はロジックが複雑で、リグレッションの温床になりやすい。
`.github/` も無く CI が存在しません。

**設計方針**:

- 単体テスト: Node 標準の `node:test` + `tsx`、または Vitest を導入。まず高価値な純粋関数から。
  - `lib/isbn.ts`: 正常系（ISBN-10→13 変換、`X` チェックディジット）と異常系（桁数不足・
    不正チェックディジット・全角混入）。
  - `getTaxIncludedPrice`: 税抜コードは ×1.1、税込コードはそのまま、JPY 以外は無視、
    複数価格から適切に選択。
  - `inferCategory`: 代表的なタイトルの分類。
- API テスト: `app/api/requests/route.ts` の `POST` を、デモモードで直接 import して
  検証境界（ISBN 必須・価格範囲・学科リスト・レート制限 429・重複 409）を網羅。
- CI: `.github/workflows/ci.yml` を追加し、PR で `npm ci` → `npm run lint` →
  `npm run build` →（追加後の）`npm test` を実行。
- `package.json` に `test` スクリプトを再追加（過去に削除されている点に注意）。

**影響範囲**: `package.json`、`tests/`（新規）、`.github/workflows/ci.yml`（新規）。
アプリ本体は非破壊。

### 2.3 [P1] openBD 未収録の書籍が申請できない UX 不具合

**問題**: `app/(public)/request/page.tsx` では、書籍入力欄の表示条件が
`showBookFields = lookupState === "success" || lookupState === "error"` です。openBD が
**404（書誌が見つからない）** を返した場合、`lookupState` は `"error"` ではなく別分岐で
`lookupMessage` を出しつつフィールドは表示されず、送信ボタンも `!showBookFields` で無効の
まま。結果として **openBD に無い本（自費出版・洋書・新刊など）は一切申請できません。**

（注: fetch 例外・502 の `catch` では `lookupState="error"` になり手入力可能。問題は
主に 404 経路と「取得前に手入力したい」ケース。）

**設計方針**:

- 「見つからなかった／自分で入力する」導線を追加。404 応答時も手入力フィールドを表示して
  submit を許可する（`showBookFields` の条件に 404/手動入力フラグを含める）。
- 「ISBN から取得せず手入力で申請」ボタンを常設し、ISBN を必須のまま（サーバ側は ISBN 検証を
  維持）ユーザーが書名・著者などを自力入力できるようにする。
- サーバ側 (`POST /api/requests`) の検証は現状維持でよい（ISBN 妥当性は保つ）。

**影響範囲**: `app/(public)/request/page.tsx` のみ（表示条件と導線）。API 非変更。

### 2.4 [P1] スパム・不正対策の強化

**問題**: `app/api/requests/route.ts` のレート制限は `contact_email` 単位（24h で
`MAX_SUBMISSIONS_PER_DAY` 件）ですが、**メールは自己申告で未検証**のため、値を変えるだけで
回避できます。学校ドメイン制限も無く、申請は即 `approved` で**公開前モデレーションが無い**ため、
公開ページに不適切な内容やスパム URL が即時掲載されるリスクがあります。README も
「学校メールのドメイン制限やワンタイム認証」を本番前 TODO として挙げています。

**設計方針（段階導入）**:

1. 学校メールのドメイン許可リスト（例 `@*.kosen-ac.jp` 等）を環境変数 `ALLOWED_EMAIL_DOMAINS`
   で設定し、サーバ側で検証。
2. メール OTP（ワンタイム）による本人確認、または Supabase Auth のマジックリンクで
   「学生本人であること」を確認してから申請を受理する方式を検討。
3. レート制限の多層化: 送信元 IP（`x-forwarded-for`）＋メールの複合キーにし、
   Supabase 上のカウンタ／KV で集計。
4. 公開前モデレーションの選択肢: `SUBMISSION_MODE=auto|review` を導入し、`review` の場合は
   新規申請を `pending` で保存 → 管理者承認で `approved`。既存の `pending` 状態と RLS を活用
   できる（現状 `pending` はほぼ使われていない）。
5. 簡易な不適切語フィルタ／URL ドメイン制限（下記 2.8 と連携）。

**影響範囲**: `app/api/requests/route.ts`、`lib/`（検証ユーティリティ）、`.env.example`、
必要に応じ `supabase/schema.sql`（カウンタ用途）。UI に確認ステップが増える。

### 2.5 [P1] 学科／学年／分野の定数の一元化

**問題**: 学科・学年・分野のリストが、クライアント (`app/(public)/request/page.tsx` の
`<select>`) とサーバ (`app/api/requests/route.ts` 冒頭の `departments/grades/categories`)、
さらに `inferCategory`（lookup）で**別々に定義**されています。片方だけ更新すると検証不整合
（クライアントで選べてもサーバで 400）を招きます。

**設計方針**:

- `lib/constants.ts` に単一の真実として定義し、クライアント・サーバの双方が import。

  ```ts
  export const DEPARTMENTS = [...] as const;
  export const GRADES = [...] as const;
  export const CATEGORIES = [...] as const;
  export type Department = typeof DEPARTMENTS[number];
  ```

- `<select>` はこの配列から生成し、サーバ検証も同配列の `includes` を使う。

**影響範囲**: `app/(public)/request/page.tsx`、`app/api/requests/route.ts`、
`app/api/books/lookup/route.ts`、新規 `lib/constants.ts`。挙動は同一（リファクタ）。

### 2.6 [P2] 公開一覧のキャッシュ/性能

**問題**: `app/(public)/page.tsx` は `export const dynamic = "force-dynamic"` のため、
アクセスのたびに Supabase へ問い合わせます。公開一覧は更新頻度が低く読み取り主体なので、
キャッシュ余地があります。

**設計方針**:

- `force-dynamic` をやめ、`export const revalidate = 60`（ISR）等に切替、または
  申請・状態更新時に `revalidatePath('/')` でオンデマンド再検証。
- デモモードは `force-dynamic` を維持（メモリ状態を即時反映するため）。モードで分岐する。

**影響範囲**: `app/(public)/page.tsx`、状態変更 API に `revalidatePath` を追加。

### 2.7 [P2] 監査ログ・状態通知・`admin_note` 入力 UI

**問題**:

- `admin_note` はスキーマと `PATCH /api/admin` にあるが、`app/admin/page.tsx` に入力 UI が無い
  （現状は状態変更のみ）。機能ギャップ。
- 管理操作の監査ログが無く、申請者への状態通知も無い（README の本番前 TODO）。

**設計方針**:

- 管理画面に `admin_note` の編集欄を追加し、PATCH に含める。
- `admin_audit_log` テーブル（誰が・いつ・どの申請を・どの状態に）を追加し、PATCH 時に記録。
- 状態変更時に申請者へメール通知（Supabase Functions / 外部メール）を任意機能として追加。

**影響範囲**: `app/admin/page.tsx`、`app/api/admin/route.ts`、`supabase/schema.sql`。

### 2.8 [P2] セキュリティヘッダと公開外部 URL の扱い

**問題**:

- `next.config.ts` は空で、CSP や `X-Content-Type-Options` などのセキュリティヘッダが未設定。
- `book_url` は `http(s)://` の形式のみ検証。公開一覧・管理画面から任意ドメインへリンクされる
  ため、フィッシング等の悪性 URL が載る余地がある（リンクには `rel="noreferrer"` あり）。

**設計方針**:

- `next.config.ts` の `headers()` で CSP（`connect-src` に `api.openbd.jp`・Supabase を許可）、
  `X-Content-Type-Options: nosniff`、`Referrer-Policy`、`X-Frame-Options` を付与。
- 公開リンクは `rel="noopener noreferrer"` を徹底。必要ならドメイン許可リスト（書店・出版社等）
  を導入し、範囲外 URL は管理者確認を必須にする。

**影響範囲**: `next.config.ts`、リンク描画箇所（`book-card` / 管理画面 / lookup 結果）。

### 2.9 [P2] 可観測性（ロギング / エラー監視）

**問題**: `console.error` が一部にある程度で、構造化ログ・エラー監視・基本メトリクスが無い。
本番障害（openBD 障害、Supabase 認証失敗の多発等）の検知が難しい。

**設計方針**:

- エラー監視（例: Sentry）を導入し、API ルートと `app/admin` のクライアントエラーを収集。
- API の失敗レスポンスに相関 ID を付与し、サーバログと突合可能にする。
- openBD 呼び出しの失敗率・レイテンシを最小限メトリクス化。

**影響範囲**: 各 API ルート、`app` 全体の error boundary、依存追加。

### 2.10 [P3] コード品質・可読性

**問題・設計方針**:

- `app/(public)/request/page.tsx`・`app/admin/page.tsx` に非常に長い 1 行 JSX が多く、
  レビュー性が低い。コンポーネント分割と整形を推奨。
- `app/admin/page.tsx` の `restoreSession()` は `loadRequests()` とほぼ同じ fetch を重複実装。
  共通化して重複を解消。
- `getTaxIncludedPrice` の税抜 `PriceType` コード配列や `inferCategory` の正規表現は、
  定数化・コメント化で意図を明確にする。

**影響範囲**: 該当ファイルのリファクタのみ（挙動不変）。テスト（2.2）を先に入れると安全。

---

## 3. スコープ外 / 非対応（今回は提案しない）

- 多言語対応（i18n）: 対象が木更津高専生で日本語固定のため優先度低。
- 決済・在庫連携: MVP の運用方針（書店ページ参照）で十分。
- デモモードと本番の完全な機能同等化: デモは動作確認用途に限定で可。

---

## 4. 実装ロードマップ（依存関係ベース、暦日での見積もりはしない）

- フェーズ A（安全性の底上げ・独立実装可）: 2.1 本番セーフガード、2.2 テスト+CI。
  他の変更のリグレッション検知基盤になるため最初に着手。
- フェーズ B（ユーザー影響大・小変更）: 2.3 申請 UX 不具合、2.5 定数一元化。
  2.5 は 2.4 の検証強化の前提になるため先行。
- フェーズ C（不正対策・運用）: 2.4 スパム対策（1→2→3→4 の順で段階導入）、2.7 監査/通知。
- フェーズ D（性能・堅牢化）: 2.6 キャッシュ、2.8 セキュリティヘッダ、2.9 可観測性。
- フェーズ E（仕上げ）: 2.10 リファクタ（テスト整備後に安全に実施）。

各フェーズは独立した PR に分割し、`npm run lint` / `npm run build` /（整備後の）`npm test` を
必須ゲートにする。

---

## 5. リスクと留意点

- 2.4 の本人確認・モデレーション導入は申請フローに摩擦を足すため、運用方針（即時公開の価値と
  不正リスクの許容度）と合意のうえで `SUBMISSION_MODE` を選択する。
- 2.1 の本番ガードは、既存デモ運用を壊さないよう「本番宣言時のみ失敗」させ、デフォルトは後方互換。
- 2.6 のキャッシュ化は、状態変更の反映遅延と表裏一体。`revalidatePath` によるオンデマンド
  再検証を併用して整合性を保つ。
- どの改善もアプリの公開・申請・管理という中核フローの後方互換を維持する前提で設計する。
