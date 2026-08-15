import type { PublicBookRequest } from "../../lib/types";

export function BookCard({ request }: { request: PublicBookRequest }) {
  const isFulfilled = request.status === "fulfilled";

  return (
    <article className="book-card">
      <div className="card-content">
        <div className="card-topline">
          <span className="category">{request.category}・{request.department} {request.grade}</span>
          <span className={isFulfilled ? "status fulfilled" : "status"}>
            {isFulfilled ? "支援済み" : "募集中"}
          </span>
        </div>
        <h3>{request.title}</h3>
        <p className="author">{request.author}</p>
        <p className="reason">{request.reason}</p>
        <div className="card-footer">
          <strong>¥{request.price.toLocaleString("ja-JP")}</strong>
          {isFulfilled ? (
            <span className="completed-label">ご支援ありがとうございました</span>
          ) : (
            <a href={request.book_url} target="_blank" rel="noreferrer">この本を支援する</a>
          )}
        </div>
      </div>
    </article>
  );
}
