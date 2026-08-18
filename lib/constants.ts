// Single source of truth for the option lists used by both the client form and
// the server-side validation. Keeping these in one place prevents drift where a
// value is selectable in the UI but rejected by the API (or vice versa).

export const DEPARTMENTS = [
  "機械工学科",
  "電気電子工学科",
  "電子制御工学科",
  "情報工学科",
  "環境都市工学科",
  "専攻科",
] as const;

export const GRADES = ["1年", "2年", "3年", "4年", "5年", "専攻科"] as const;

export const CATEGORIES = [
  "コンピュータ",
  "プログラミング",
  "AI・データ",
  "電子工学",
  "機械工学",
  "環境・化学",
  "数学・自然科学",
  "語学・教養",
  "その他",
] as const;

export const DEFAULT_CATEGORY = "その他";

export type Department = (typeof DEPARTMENTS)[number];
export type Grade = (typeof GRADES)[number];
export type Category = (typeof CATEGORIES)[number];
