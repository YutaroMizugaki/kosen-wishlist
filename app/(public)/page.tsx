import { BookCard } from "../components/book-card";
import { getPublicRequests } from "../../lib/requests";

export const metadata = {
  title: "みんなの希望図書",
  description: "木更津高専生の学びたい気持ちと、図書の支援をつなぐ場所です。",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const requests = await getPublicRequests();
  const supported = requests.filter((request) => request.status === "fulfilled").length;
  const waiting = requests.filter((request) => request.status === "approved").length;

  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <h1>木更津高専生の希望図書</h1>
          <p className="lead">学習や制作に必要な本を掲載しています。</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/request">図書を申請する</a>
          </div>
        </div>
      </section>

      <section className="books-section shell" id="books">
        <div className="section-heading">
          <h2>学生の希望図書</h2>
          <p>{requests.length}件公開中・{waiting}件募集中・{supported}件支援済み</p>
        </div>
        {requests.length > 0 ? <div className="book-grid">{requests.map((request) => <BookCard key={request.id} request={request} />)}</div> : <div className="empty-state">現在、公開中の希望図書はありません。</div>}
      </section>

      <section className="how-it-works shell">
        <h2>利用方法</h2>
        <p>学生が本を申請すると、希望図書としてすぐに公開されます。支援者は書籍ページから本を選び、受け取りは学校・運営窓口を通じて行います。</p>
      </section>
    </main>
  );
}
