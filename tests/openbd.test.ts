import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanAuthor, getTaxIncludedPrice, inferCategory, type OpenBdRecord } from "../lib/openbd";

function recordWithPrice(price: { PriceType?: string; CurrencyCode?: string; PriceAmount?: string }): OpenBdRecord {
  return { onix: { ProductSupply: { SupplyDetail: { Price: [price] } } } };
}

test("getTaxIncludedPrice adds 10% for tax-excluded price types", () => {
  assert.equal(getTaxIncludedPrice(recordWithPrice({ PriceType: "01", CurrencyCode: "JPY", PriceAmount: "3000" })), 3300);
});

test("getTaxIncludedPrice returns tax-included price types as-is", () => {
  assert.equal(getTaxIncludedPrice(recordWithPrice({ PriceType: "02", CurrencyCode: "JPY", PriceAmount: "3300" })), 3300);
});

test("getTaxIncludedPrice ignores non-JPY and missing prices", () => {
  assert.equal(getTaxIncludedPrice(recordWithPrice({ PriceType: "01", CurrencyCode: "USD", PriceAmount: "30" })), null);
  assert.equal(getTaxIncludedPrice({}), null);
});

test("cleanAuthor removes birth years and normalizes commas", () => {
  assert.equal(cleanAuthor("Boswell, Dustin, 1970-"), "Boswell Dustin");
  assert.equal(cleanAuthor("McKinney, Wes"), "McKinney Wes");
  assert.equal(cleanAuthor("斎藤 康毅"), "斎藤 康毅");
});

test("inferCategory classifies by keywords with fallback", () => {
  assert.equal(inferCategory("Python入門"), "プログラミング");
  assert.equal(inferCategory("半導体デバイス入門"), "電子工学");
  assert.equal(inferCategory("日本の歴史"), "語学・教養");
  assert.equal(inferCategory("よくわからない本"), "その他");
});
