import { isValidIsbn, normalizeIsbn, toIsbn13 } from "../../../../lib/isbn";
import { getDemoRequests } from "../../../../lib/demo-store";
import { cleanAuthor, getTaxIncludedPrice, inferCategory, type OpenBdRecord } from "../../../../lib/openbd";
import { createAdminClient, isDemoMode } from "../../../../lib/supabase";

async function findExistingRequest(isbn: string) {
  const publicFields = (request: Record<string, unknown>) => ({
    status: request.status,
    title: request.title,
    author: request.author,
    price: request.price,
    department: request.department,
    grade: request.grade,
    book_url: request.book_url,
  });

  if (isDemoMode()) {
    const request = getDemoRequests().find((item) => normalizeIsbn(item.isbn) === isbn && item.status !== "rejected");
    if (!request) return null;
    return request.status === "approved" || request.status === "fulfilled"
      ? publicFields(request as unknown as Record<string, unknown>)
      : { status: "registered" };
  }

  const client = createAdminClient();
  if (!client) return null;
  const { data } = await client
    .from("book_requests")
    .select("title,author,price,department,grade,book_url,status")
    .eq("isbn_normalized", isbn)
    .neq("status", "rejected")
    .maybeSingle();
  if (!data) return null;
  return data.status === "approved" || data.status === "fulfilled"
    ? publicFields(data)
    : { status: "registered" };
}

export async function GET(request: Request) {
  const inputIsbn = normalizeIsbn(new URL(request.url).searchParams.get("isbn"));
  if (!isValidIsbn(inputIsbn)) {
    return Response.json({ error: "正しいISBNを入力してください。" }, { status: 400 });
  }
  const isbn = toIsbn13(inputIsbn)!;

  const existing = await findExistingRequest(isbn);
  if (existing) {
    return Response.json({ existing }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch(`https://api.openbd.jp/v1/get?isbn=${encodeURIComponent(isbn)}`, {
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 86_400 },
    });
    if (!response.ok) throw new Error("openBD request failed");

    const records = await response.json() as Array<OpenBdRecord | null>;
    const record = records[0];
    if (!record?.summary?.title || !record.summary.author) {
      return Response.json({ error: "書籍情報が見つかりませんでした。手入力してください。" }, { status: 404 });
    }

    return Response.json({
      data: {
        isbn,
        title: record.summary.title,
        author: cleanAuthor(record.summary.author),
        price: getTaxIncludedPrice(record),
        book_url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(isbn)}`,
        category: inferCategory(record.summary.title),
      },
    }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return Response.json({ error: "書籍情報を取得できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
