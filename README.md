# KOSEN BOOKS — 木更津高専生向け図書支援MVP

木更津高専生が学習・研究・制作に必要な本を申請し、その希望図書をすぐに公開できるMVPです。運営者は公開・非公開・支援済みの状態を管理できます。

## できること

- 学生：書籍情報、読みたい理由、所属、学校メールを申請
- 公開ページ：投稿直後から希望図書を一覧表示
- 運営者：管理キーで申請一覧を開き、状態を変更
- プライバシー：氏名・メールアドレスを公開せず、個人住所は収集しない
- デモモード：Supabase未設定でも投稿・即時公開・状態変更をメモリ上で確認可能（サーバー再起動でリセット）
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

デモモードの管理キー：`demo-admin`

## Supabaseの設定

1. Supabaseで新しいプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. `.env.example` を `.env.local` にコピーし、Project Settings > API の値を設定します。
4. `ADMIN_ACCESS_KEY` を長いランダムな値に変更します。
5. 開発サーバーを再起動します。

`SUPABASE_SERVICE_ROLE_KEY` と `ADMIN_ACCESS_KEY` はサーバー専用です。`NEXT_PUBLIC_` を付けたり、Gitへコミットしたりしないでください。

## 画面とAPI

| パス | 用途 |
| --- | --- |
| `/` | 投稿済み希望図書の公開一覧 |
| `/request` | 学生向け申請フォーム |
| `/admin` | 運営者向け管理画面 |
| `POST /api/requests` | 申請を `approved` で保存し、そのまま公開 |
| `GET /api/admin` | 管理キーで全申請を取得 |
| `PATCH /api/admin` | 申請状態を更新 |

新規申請は `approved`（公開中）として保存されます。管理用に `pending`（保留）、`rejected`（非公開）、`fulfilled`（支援済み）へ変更できます。

## Vercelへの配置

GitHubへリポジトリを作成し、VercelでImportしてください。VercelのProject Settings > Environment Variablesに `.env.local` と同じ4項目を登録してからデプロイします。本番公開前に、管理画面をSupabase Authなどの正式な認証へ置き換えることを推奨します。

## 本番運用前の確認事項

- 学校または受取協力者と、図書の受取・本人確認・引渡し手順を合意する
- プライバシーポリシー、利用規約、問い合わせ先、削除依頼窓口を用意する
- 学校メールのドメイン制限やワンタイム認証を追加する
- 管理操作の監査記録と、申請者への状態通知を追加する
- 書籍URLから価格を自動取得せず、公開前に運営が価格と在庫を確認する

## 技術構成

Next.js（App Router）+ React + TypeScript + Tailwind CSS + Supabase。標準のNext.jsプロジェクトとして、VercelへそのままImportできます。`sites:dev` / `sites:build` ではCloudflare互換のvinextプレビューも利用できます。
