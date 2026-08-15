"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "../../lib/supabase";
import type { BookRequest, RequestStatus } from "../../lib/types";

const labels: Record<RequestStatus, string> = {
  pending: "確認待ち", approved: "公開中", rejected: "非公開", fulfilled: "支援済み",
};

export default function AdminPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [token, setToken] = useState<string | null>(null);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [filter, setFilter] = useState<RequestStatus | "all">("approved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests(accessToken: string) {
    setLoading(true); setError("");
    const response = await fetch("/api/admin", {
      cache: "no-store",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json() as { data?: BookRequest[]; error?: string };
    setLoading(false);
    if (!response.ok) {
      setToken(null);
      setError(body.error || "管理画面を開けませんでした。");
      return;
    }
    setToken(accessToken);
    setRequests(body.data || []);
  }

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!supabase) {
        await Promise.resolve();
        if (active) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch("/api/admin", {
        cache: "no-store",
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const body = await response.json() as { data?: BookRequest[]; error?: string };
      if (!active) return;
      setLoading(false);
      if (!response.ok) {
        setToken(null);
        setError(body.error || "管理画面を開けませんでした。");
        return;
      }
      setToken(accessToken);
      setRequests(body.data || []);
    }

    void restoreSession();
    return () => { active = false; };
  }, [supabase]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return setError("Supabaseの環境変数が設定されていません。");
    const form = new FormData(event.currentTarget);
    setLoading(true); setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") || ""), password: String(form.get("password") || ""),
    });
    if (loginError || !data.session) { setLoading(false); return setError("メールアドレスまたはパスワードが正しくありません。"); }
    await loadRequests(data.session.access_token);
  }

  async function logout() {
    await supabase?.auth.signOut();
    setToken(null); setRequests([]); setError("");
  }

  async function updateStatus(id: string, status: RequestStatus) {
    if (!token) return;
    setError("");
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) return setError(body.error || "更新できませんでした。");
    setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }

  const visible = filter === "all" ? requests : requests.filter((item) => item.status === filter);
  const counts = Object.fromEntries(Object.keys(labels).map((status) => [status, requests.filter((item) => item.status === status).length]));

  if (!token) {
    return <div className="admin-surface"><AdminBar />
      <main className="admin-login"><div className="login-card">
        <p className="admin-label">管理者専用</p><h1>ログイン</h1>
        <p>Supabaseで登録した管理者アカウントを使用します。</p>
        <form onSubmit={login}>
          <label className="field"><span>メールアドレス</span><input name="email" type="email" autoComplete="username" required /></label>
          <label className="field"><span>パスワード</span><input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="admin-button" disabled={loading}>{loading ? "確認中…" : "ログイン"}</button>
        </form>
        {error && <p className="form-message error" role="alert">{error}</p>}
      </div></main>
    </div>;
  }

  return <div className="admin-surface"><AdminBar onLogout={logout} />
    <main className="admin-page admin-container">
      <div className="admin-heading"><div><p className="admin-label">図書希望</p><h1>申請管理</h1></div><p>{requests.length}件</p></div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="admin-stats">
        {(Object.keys(labels) as RequestStatus[]).map((status) => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}><span>{labels[status]}</span><strong>{counts[status] || 0}</strong></button>)}
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}><span>すべて</span><strong>{requests.length}</strong></button>
      </div>
      <div className="admin-list">
        {visible.map((request) => <article className="admin-item" key={request.id}>
          <div className="admin-item-main"><div className="card-topline"><span className="category">{request.category}</span><span className={`status ${request.status}`}>{labels[request.status]}</span></div><h2>{request.title}</h2><p className="author">{request.author}・¥{request.price.toLocaleString("ja-JP")}</p><p className="private-meta">{request.department} {request.grade} / <span>{request.contact_email}</span></p></div>
          <div className="admin-actions"><a href={request.book_url} target="_blank" rel="noreferrer">書籍ページを確認</a><select aria-label={`${request.title}の状態`} value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value as RequestStatus)}><option value="pending">確認待ち</option><option value="approved">公開中</option><option value="rejected">非公開</option><option value="fulfilled">支援済み</option></select></div>
        </article>)}
        {!loading && visible.length === 0 && <div className="empty-state">該当する申請はありません。</div>}
      </div>
    </main>
  </div>;
}

function AdminBar({ onLogout }: { onLogout?: () => void }) {
  return <header className="admin-bar"><strong>KOSEN BOOKS 管理</strong><div className="admin-bar-actions"><Link href="/">公開ページ</Link>{onLogout && <button onClick={onLogout}>ログアウト</button>}</div></header>;
}
