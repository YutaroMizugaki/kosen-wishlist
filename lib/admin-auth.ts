import { createAdminClient } from "./supabase";

export type AdminAuthResult =
  | { ok: true; client: NonNullable<ReturnType<typeof createAdminClient>>; userId: string }
  | { ok: false; status: 401 | 403 | 503; error: string };

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const client = createAdminClient();
  if (!client) return { ok: false, status: 503, error: "管理機能が設定されていません。" };

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: "ログインが必要です。" };

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, status: 401, error: "ログインの有効期限が切れています。" };

  const { data: admin, error: adminError } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !admin) return { ok: false, status: 403, error: "管理者として登録されていません。" };
  return { ok: true, client, userId: userData.user.id };
}
