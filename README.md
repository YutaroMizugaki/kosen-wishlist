# KOSEN BOOKS — 木更津高専生向け図書支援MVP

木更津高専生が学習・研究・制作に必要な本を申請し、その希望図書をすぐに公開できるMVPです。運営者は公開・非公開・支援済みの状態を管理できます。

## できること

- 学生：ISBN-10・13から書籍情報を自動入力し、ISBN-13へ統一して申請
- 公開ページ：投稿直後から希望図書を一覧表示
- 運営者：Supabase Authでログインし、申請の公開状態を変更
- プライバシー：氏名・メールアドレスを公開せず、個人住所は収集しない
- スパム対策：同一メールからの投稿を24時間あたり3件に制限
- 重複防止：ISBNを13桁へ統一し、公開中・確認待ち・支援済みの重複を拒否（非公開後は再申請可能）
- デモモード：Supabase未設定でも公開一覧と投稿をメモリ上で確認可能（サーバー再起動でリセット）
- 低速回線対応：公開ページは画像・Webフォント・リンク先の先読みを使わない軽量表示
- 管理画面：公開サイトとは別レイアウトの独立した業務画面

## ローカル起動

Node.js 22.13以上を用意し、次を実行します。

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。Supabaseをまだ設定しない場合、`.env.local` は作らなくてもデモ表示できます。

デモモードでは管理画面は利用できません。管理画面の確認にはSupabaseの設定が必要です。

## Supabaseの設定

1. Supabaseで新しいプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. `.env.example` を `.env.local` にコピーし、Project Settings > API の値を設定します。
4. `NEXT_PUBLIC_CONTACT_EMAIL` を実際の削除依頼・問い合わせ窓口に変更します。
5. 必要に応じて `MAX_SUBMISSIONS_PER_DAY` を変更します。
6. 開発サーバーを再起動します。

`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用です。`NEXT_PUBLIC_` を付けたり、Gitへコミットしたりしないでください。

### 最初の管理者を登録する

1. Supabase Dashboardの Authentication > Users で、管理者のメールアドレスとパスワードを登録します。
2. SQL Editorで次を実行し、そのユーザーを管理者として許可します。

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = '管理者のメールアドレス';
```

管理画面は、Supabaseで本人確認に成功し、かつ `admin_users` に登録されているユーザーだけが利用できます。

## 画面とAPI

| パス | 用途 |
| --- | --- |
| `/` | 投稿済み希望図書の公開一覧 |
| `/request` | 学生向け申請フォーム |
| `/privacy` | プライバシーポリシー |
| `/admin` | 運営者向け管理画面 |
| `GET /api/books/lookup` | ISBNからopenBDの書誌情報を取得 |
| `POST /api/requests` | 申請を `approved` で保存し、そのまま公開 |
| `GET /api/admin` | 管理者のアクセストークンで全申請を取得 |
| `PATCH /api/admin` | 管理者のアクセストークンで申請状態を更新 |

新規申請は `approved`（公開中）として保存されます。管理用に `pending`（保留）、`rejected`（非公開）、`fulfilled`（支援済み）へ変更できます。

## Vercelへの配置

GitHubリポジトリをVercelでImportし、Project Settings > Environment Variablesに `.env.local` と同じ項目を登録してからデプロイします。

## 本番運用前の確認事項

- 学校または受取協力者と、図書の受取・本人確認・引渡し手順を合意する
- プライバシーポリシーの保存期間と問い合わせ先を運営方針に合わせて確定する
- 学校メールのドメイン制限やワンタイム認証を追加する
- 管理操作の監査記録と、申請者への状態通知を追加する
- 自動取得した参考価格と、支援時点の販売価格・在庫を運営が確認する

## 技術構成

Next.js（App Router）+ React + TypeScript + Tailwind CSS + Supabase。標準のNext.jsプロジェクトとして、VercelへそのままImportできます。`sites:dev` / `sites:build` ではCloudflare互換のvinextプレビューも利用できます。
