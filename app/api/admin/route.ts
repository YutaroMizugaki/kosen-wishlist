import { requireAdmin } from "../../../lib/admin-auth";
import type { RequestStatus } from "../../../lib/types";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.client
    .from("book_requests")
    .select("id,title,author,isbn,book_url,price,department,grade,category,contact_email,status,admin_note,created_at")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: "申請を取得できませんでした。" }, { status: 500 });
  return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  let body: { id?: string; status?: RequestStatus; admin_note?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return Response.json({ error: "更新内容を読み取れませんでした。" }, { status: 400 });
  }
  if (!body.id || !body.status || !["pending", "approved", "rejected", "fulfilled"].includes(body.status)) {
    return Response.json({ error: "更新内容が正しくありません。" }, { status: 400 });
  }

  const { data, error } = await auth.client
    .from("book_requests")
    .update({ status: body.status, admin_note: body.admin_note?.slice(0, 500) || null })
    .eq("id", body.id)
    .select("id,status,admin_note")
    .single();

  if (error) return Response.json({ error: "更新できませんでした。" }, { status: 500 });
  return Response.json({ data });
}
