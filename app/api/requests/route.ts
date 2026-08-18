import { CATEGORIES, DEPARTMENTS, GRADES } from "../../../lib/constants";
import { addDemoRequest, getDemoRequests } from "../../../lib/demo-store";
import { isValidIsbn, normalizeIsbn, toIsbn13 } from "../../../lib/isbn";
import { createAdminClient, isDemoMode } from "../../../lib/supabase";

const departments: readonly string[] = DEPARTMENTS;
const grades: readonly string[] = GRADES;
const categories: readonly string[] = CATEGORIES;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 20_000) return Response.json({ error: "送信内容が大きすぎます。" }, { status: 413 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return Response.json({ error: "送信内容を読み取れませんでした。" }, { status: 400 }); }

  const title = String(body.title || "").trim();
  const author = String(body.author || "").trim();
  const inputIsbn = normalizeIsbn(body.isbn);
  const isbn = toIsbn13(inputIsbn);
  const bookUrl = String(body.book_url || "").trim();
  const price = Number(body.price);
  const department = String(body.department || "");
  const grade = String(body.grade || "");
  const category = String(body.category || "");
  const contactEmail = String(body.contact_email || "").trim().toLowerCase();

  if (!title || title.length > 160 || !author || author.length > 100) return Response.json({ error: "書籍名と著者名を確認してください。" }, { status: 400 });
  if (!inputIsbn || !isValidIsbn(inputIsbn) || !isbn) return Response.json({ error: "正しいISBNを入力してください。" }, { status: 400 });
  if (!/^https?:\/\/[^\s]+$/i.test(bookUrl) || bookUrl.length > 500) return Response.json({ error: "正しい書籍ページURLを入力してください。" }, { status: 400 });
  if (!Number.isInteger(price) || price < 1 || price > 50_000) return Response.json({ error: "価格を確認してください。" }, { status: 400 });
  if (!departments.includes(department) || !grades.includes(grade) || !categories.includes(category)) return Response.json({ error: "所属または分野を確認してください。" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254) return Response.json({ error: "メールアドレスを確認してください。" }, { status: 400 });

  const configuredLimit = Number(process.env.MAX_SUBMISSIONS_PER_DAY);
  const maxPerDay = Number.isFinite(configuredLimit)
    ? Math.min(10, Math.max(1, Math.floor(configuredLimit)))
    : 3;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (isDemoMode()) {
    const items = getDemoRequests();
    if (items.filter((item) => item.contact_email === contactEmail && item.created_at >= since).length >= maxPerDay) return Response.json({ error: `投稿は24時間に${maxPerDay}件までです。` }, { status: 429 });
    const duplicate = items.some((item) => item.status !== "rejected" && normalizeIsbn(item.isbn) === isbn);
    if (duplicate) return Response.json({ error: "この本はすでに掲載されています。" }, { status: 409 });
    addDemoRequest({ title, author, isbn, book_url: bookUrl, price, department, grade, category, contact_email: contactEmail, status: "approved", admin_note: null });
    return Response.json({ message: "申請を公開しました。" }, { status: 201 });
  }

  const client = createAdminClient();
  if (!client) return Response.json({ error: "保存先が設定されていません。" }, { status: 503 });

  const { count, error: countError } = await client.from("book_requests").select("id", { count: "exact", head: true }).eq("contact_email", contactEmail).gte("created_at", since);
  if (countError) return Response.json({ error: "投稿回数を確認できませんでした。" }, { status: 503 });
  if ((count || 0) >= maxPerDay) return Response.json({ error: `投稿は24時間に${maxPerDay}件までです。` }, { status: 429 });

  const { data: duplicate, error: duplicateError } = await client
    .from("book_requests")
    .select("id")
    .eq("isbn_normalized", isbn)
    .neq("status", "rejected")
    .limit(1);
  if (duplicateError) return Response.json({ error: "重複を確認できませんでした。" }, { status: 503 });
  if (duplicate?.length) return Response.json({ error: "この本はすでに掲載されています。" }, { status: 409 });

  const { error } = await client.from("book_requests").insert({ title, author, isbn, book_url: bookUrl, price, department, grade, category, contact_email: contactEmail, status: "approved" });
  if (error?.code === "23505") return Response.json({ error: "この本はすでに掲載されています。" }, { status: 409 });
  if (error) return Response.json({ error: "申請を保存できませんでした。" }, { status: 500 });
  return Response.json({ message: "申請を公開しました。" }, { status: 201 });
}
