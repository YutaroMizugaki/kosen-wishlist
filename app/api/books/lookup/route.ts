import { isValidIsbn, normalizeIsbn, toIsbn13 } from "../../../../lib/isbn";
import { getDemoRequests } from "../../../../lib/demo-store";
import { createAdminClient, isDemoMode } from "../../../../lib/supabase";

type OpenBdPrice = {
  PriceType?: string;
  CurrencyCode?: string;
  PriceAmount?: string;
};

type OpenBdRecord = {
  summary?: { title?: string; author?: string };
  onix?: {
    ProductSupply?: {
      SupplyDetail?: { Price?: OpenBdPrice[] | OpenBdPrice };
    };
  };
};

function getTaxIncludedPrice(record: OpenBdRecord) {
  const rawPrices = record.onix?.ProductSupply?.SupplyDetail?.Price;
  const prices = Array.isArray(rawPrices) ? rawPrices : rawPrices ? [rawPrices] : [];
  const price = prices.find((item) => item.CurrencyCode === "JPY" && Number(item.PriceAmount) > 0);
  if (!price) return null;

  const amount = Number(price.PriceAmount);
  const excludingTax = ["01", "03", "05", "07", "11", "13", "15", "17", "21", "23", "31", "33", "41", "43"].includes(price.PriceType || "");
  return Math.round(excludingTax ? amount * 1.1 : amount);
}

function cleanAuthor(author: string) {
  return author.replace(/,\s*\d{4}-?.*$/, "").replace(/,\s*/g, " ").trim();
}

function inferCategory(title: string) {
  const text = title.toLowerCase();
  if (/(ai|人工知能|機械学習|深層学習|deep learning|データサイエンス|統計)/i.test(text)) return "AI・データ";
  if (/(プログラミング|python|javascript|typescript|java|rust|c\+\+|コード)/i.test(text)) return "プログラミング";
  if (/(コンピュータ|cpu|os|ネットワーク|データベース|セキュリティ)/i.test(text)) return "コンピュータ";
  if (/(電子|電気|回路|半導体|ロボット)/i.test(text)) return "電子工学";
  if (/(機械|材料力学|熱力学|流体力学|cad)/i.test(text)) return "機械工学";
  if (/(環境|化学|都市|建築|土木)/i.test(text)) return "環境・化学";
  if (/(数学|物理|科学|解析|代数)/i.test(text)) return "数学・自然科学";
  if (/(英語|語学|文学|歴史|哲学|教養)/i.test(text)) return "語学・教養";
  return "その他";
}

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
