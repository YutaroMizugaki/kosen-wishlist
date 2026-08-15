import { getDemoRequests, updateDemoRequest } from "../../../lib/demo-store";
import { createAdminClient, isDemoMode } from "../../../lib/supabase";
import type { RequestStatus } from "../../../lib/types";

function authorized(request: Request) {
  const expected = process.env.ADMIN_ACCESS_KEY || "demo-admin";
  return request.headers.get("x-admin-key") === expected;
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "管理キーが正しくありません。" }, { status: 401 });
  if (isDemoMode()) return Response.json({ data: getDemoRequests() });
  const client = createAdminClient();
  if (!client) return Response.json({ error: "Supabaseが設定されていません。" }, { status: 503 });
  const { data, error } = await client.from("book_requests").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: "申請を取得できませんでした。" }, { status: 500 });
  return Response.json({ data });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return Response.json({ error: "管理キーが正しくありません。" }, { status: 401 });
  const body = await request.json() as { id?: string; status?: RequestStatus };
  if (!body.id || !body.status || !["pending", "approved", "rejected", "fulfilled"].includes(body.status)) return Response.json({ error: "更新内容が正しくありません。" }, { status: 400 });
  if (isDemoMode()) return Response.json({ data: updateDemoRequest(body.id, body.status) });
  const client = createAdminClient();
  if (!client) return Response.json({ error: "Supabaseが設定されていません。" }, { status: 503 });
  const { data, error } = await client.from("book_requests").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) return Response.json({ error: "更新できませんでした。" }, { status: 500 });
  return Response.json({ data });
}
