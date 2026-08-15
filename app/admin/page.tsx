"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { BookRequest, RequestStatus } from "../../lib/types";

const labels: Record<RequestStatus, string> = { pending: "確認待ち", approved: "公開中", rejected: "却下", fulfilled: "支援済み" };

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | "all">("approved");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const visible = useMemo(() => filter === "all" ? requests : requests.filter((item) => item.status === filter), [requests, filter]);
  const counts = useMemo(() => Object.fromEntries(Object.keys(labels).map((status) => [status, requests.filter((item) => item.status === status).length])), [requests]);

  async function login(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/admin", { headers: { "x-admin-key": key } });
    const body = await response.json() as { data?: BookRequest[]; error?: string };
    setLoading(false);
    if (!response.ok) return setError(body.error || "認証できませんでした。");
    setAuthenticated(true);
    setRequests(body.data || []);
  }

  async function updateStatus(id: string, status: RequestStatus) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-key": key }, body: JSON.stringify({ id, status }) });
    if (!response.ok) return setError("更新できませんでした。");
    setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }

  if (!authenticated) {
    return (
      <div className="admin-surface">
        <AdminBar />
        <main className="admin-login">
          <div className="login-card">
            <p className="admin-label">管理者専用</p><h1>ログイン</h1>
            <p>申請の公開状態と支援状況を管理します。</p>
            <form onSubmit={login}><label className="field"><span>管理キー</span><input type="password" value={key} onChange={(event) => setKey(event.target.value)} required placeholder="管理キーを入力" /></label><button className="admin-button" disabled={loading}>{loading ? "確認中…" : "ログイン"}</button></form>
            <small>デモ環境の管理キーは README に記載しています。</small>
            {error && <p className="form-message error" role="alert">{error}</p>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-surface">
      <AdminBar />
      <main className="admin-page admin-container">
        <div className="admin-heading"><div><p className="admin-label">図書希望</p><h1>申請管理</h1></div><p>{requests.length}件の申請</p></div>
        <div className="admin-stats">{(Object.keys(labels) as RequestStatus[]).map((status) => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}><span>{labels[status]}</span><strong>{counts[status] || 0}</strong></button>)}<button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}><span>すべて</span><strong>{requests.length}</strong></button></div>
        <div className="admin-list">
          {visible.map((request) => (
            <article className="admin-item" key={request.id}>
              <div className="admin-item-main"><div className="card-topline"><span className="category">{request.category}</span><span className={`status ${request.status}`}>{labels[request.status]}</span></div><h2>{request.title}</h2><p className="author">{request.author} · ¥{request.price.toLocaleString("ja-JP")}</p><p className="reason">{request.reason}</p><p className="private-meta">{request.department} {request.grade} / <span>{request.contact_email || "連絡先非表示"}</span></p></div>
              <div className="admin-actions"><a href={request.book_url} target="_blank" rel="noreferrer">書籍ページを確認</a><select aria-label={`${request.title}の状態`} value={request.status} onChange={(event) => updateStatus(request.id, event.target.value as RequestStatus)}><option value="pending">確認待ち</option><option value="approved">承認・公開</option><option value="rejected">却下</option><option value="fulfilled">支援済み</option></select></div>
            </article>
          ))}
          {visible.length === 0 && <div className="empty-state">該当する申請はありません。</div>}
        </div>
      </main>
    </div>
  );
}

function AdminBar() {
  return <header className="admin-bar"><strong>KOSEN BOOKS 管理</strong><Link href="/">公開ページを表示</Link></header>;
}
