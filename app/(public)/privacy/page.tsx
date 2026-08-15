export const metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "公開前に運営連絡先を設定してください";

  return <main className="policy-page shell">
    <h1>プライバシーポリシー</h1>
    <p className="policy-updated">最終更新日：2026年8月15日</p>

    <section><h2>収集する情報</h2><p>希望図書の申請時に、学校メールアドレス、所属学科、学年、書籍情報を収集します。氏名、個人住所、電話番号は収集しません。</p></section>
    <section><h2>利用目的</h2><p>申請者への確認連絡、図書の受け渡し、重複投稿と大量投稿の防止、サービス運営上の問い合わせ対応に使用します。</p></section>
    <section><h2>公開する情報</h2><p>書籍情報、所属学科、学年を公開します。学校メールアドレスは公開しません。</p></section>
    <section><h2>閲覧できる人</h2><p>学校メールアドレスを含む非公開情報は、運営者として登録された担当者だけが閲覧します。</p></section>
    <section><h2>保存期間</h2><p>学校メールアドレスなどの非公開情報は、支援完了または申請の非公開から1年以内に削除します。ただし、法令上の保存義務がある場合を除きます。</p></section>
    <section><h2>外部サービス</h2><p>データの保存と認証にSupabase、サイトの配信にVercelを利用する予定です。各サービスのサーバーで情報が処理される場合があります。</p></section>
    <section><h2>削除・訂正の依頼</h2><p>申請内容の訂正や削除を希望する場合は、申請時の学校メールアドレスから運営窓口へご連絡ください。</p><p><strong>運営窓口：</strong>{contact}</p></section>
  </main>;
}
