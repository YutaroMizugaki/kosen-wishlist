export type OpenBdPrice = {
  PriceType?: string;
  CurrencyCode?: string;
  PriceAmount?: string;
};

export type OpenBdRecord = {
  summary?: { title?: string; author?: string };
  onix?: {
    ProductSupply?: {
      SupplyDetail?: { Price?: OpenBdPrice[] | OpenBdPrice };
    };
  };
};

// ONIX PriceType codes that represent a tax-excluded amount. For these we add
// Japan's 10% consumption tax to present an approximate tax-included price.
const TAX_EXCLUDED_PRICE_TYPES = [
  "01", "03", "05", "07", "11", "13", "15", "17", "21", "23", "31", "33", "41", "43",
];

export function getTaxIncludedPrice(record: OpenBdRecord): number | null {
  const rawPrices = record.onix?.ProductSupply?.SupplyDetail?.Price;
  const prices = Array.isArray(rawPrices) ? rawPrices : rawPrices ? [rawPrices] : [];
  const price = prices.find((item) => item.CurrencyCode === "JPY" && Number(item.PriceAmount) > 0);
  if (!price) return null;

  const amount = Number(price.PriceAmount);
  const excludingTax = TAX_EXCLUDED_PRICE_TYPES.includes(price.PriceType || "");
  return Math.round(excludingTax ? amount * 1.1 : amount);
}

export function cleanAuthor(author: string): string {
  return author.replace(/,\s*\d{4}-?.*$/, "").replace(/,\s*/g, " ").trim();
}

export function inferCategory(title: string): string {
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
