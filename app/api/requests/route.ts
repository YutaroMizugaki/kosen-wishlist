import { createAdminClient, isDemoMode } from "../../../lib/supabase";
import { addDemoRequest } from "../../../lib/demo-store";

const requiredFields = ["title", "author", "book_url", "price", "reason", "department", "grade", "category", "contact_email"] as const;

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const missing = requiredFields.find((field) => !String(body[field] ?? "").trim());
  if (missing) return Response.json({ error: "必須項目を入力してください。" }, { status: 400 });
  if (String(body.reason).length < 40 || String(body.reason).length > 300) return Response.json({ error: "読みたい理由は40〜300字で入力してください。" }, { status: 400 });
  if (!/^https?:\/\//.test(String(body.book_url))) return Response.json({ error: "正しい書籍ページURLを入力してください。" }, { status: 400 });

  if (isDemoMode()) {
    addDemoRequest({
      title: String(body.title).trim(), author: String(body.author).trim(), isbn: String(body.isbn || "").trim() || null,
      book_url: String(body.book_url).trim(), price: Number(body.price), reason: String(body.reason).trim(),
      department: String(body.department), grade: String(body.grade), category: String(body.category),
      contact_email: String(body.contact_email).trim().toLowerCase(), status: "approved", admin_note: null,
    });
    return Response.json({ message: "申請を公開しました。公開ページを更新すると確認できます。" }, { status: 201 });
  }

  const client = createAdminClient();
  if (!client) return Response.json({ error: "保存先が設定されていません。" }, { status: 503 });
  const { error } = await client.from("book_requests").insert({
    title: String(body.title).trim(), author: String(body.author).trim(), isbn: String(body.isbn || "").trim() || null,
    book_url: String(body.book_url).trim(), price: Number(body.price), reason: String(body.reason).trim(),
    department: String(body.department), grade: String(body.grade), category: String(body.category),
    contact_email: String(body.contact_email).trim().toLowerCase(), status: "approved",
  });
  if (error) return Response.json({ error: "申請を保存できませんでした。" }, { status: 500 });
  return Response.json({ message: "申請を公開しました。支援状況は公開ページで確認できます。" }, { status: 201 });
}
