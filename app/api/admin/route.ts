import { timingSafeEqual } from "node:crypto";
import { getDemoRequests, updateDemoRequest } from "../../../lib/demo-store";
import { createAdminClient, isDemoMode } from "../../../lib/supabase";
import type { RequestStatus } from "../../../lib/types";

function keysMatch(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authorized(request: Request) {
  const provided = request.headers.get("x-admin-key");
  if (!provided) return false;
  if (isDemoMode()) {
    return keysMatch(provided, process.env.ADMIN_ACCESS_KEY || "demo-admin");
  }
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) return false;
  return keysMatch(provided, expected);
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
