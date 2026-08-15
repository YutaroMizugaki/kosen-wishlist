import type { BookRequest } from "./types";

export const sampleRequests: BookRequest[] = [
  {
    id: "sample-1", title: "CPUの創りかた", author: "渡波 郁", isbn: "9784839909864",
    book_url: "https://www.amazon.co.jp/s?k=CPUの創りかた", price: 3080,
    reason: "自作CPUに挑戦するため、回路が動く仕組みを基礎から理解したいです。",
    department: "情報工学科", grade: "2年", category: "コンピュータ", status: "approved", created_at: "2026-08-08T00:00:00Z",
  },
  {
    id: "sample-2", title: "Pythonによるデータ分析入門", author: "Wes McKinney", isbn: "9784873119328",
    book_url: "https://www.amazon.co.jp/s?k=Pythonによるデータ分析入門", price: 4180,
    reason: "ロボコンの走行データを可視化して、機体の改善に役立てたいです。",
    department: "電子制御工学科", grade: "3年", category: "プログラミング", status: "approved", created_at: "2026-08-05T00:00:00Z",
  },
  {
    id: "sample-3", title: "半導体デバイス入門", author: "柴田 直", isbn: "9784274225789",
    book_url: "https://www.amazon.co.jp/s?k=半導体デバイス入門", price: 2970,
    reason: "授業で半導体に興味を持ち、デバイスの動作原理をもう少し深く学びたいです。",
    department: "電気電子工学科", grade: "2年", category: "電子工学", status: "fulfilled", created_at: "2026-08-01T00:00:00Z",
  },
];

export const adminSampleRequests: BookRequest[] = [
  {
    id: "sample-pending", title: "ゼロから作るDeep Learning", author: "斎藤 康毅", isbn: "9784873117584",
    book_url: "https://www.amazon.co.jp/s?k=ゼロから作るDeep+Learning", price: 3740,
    reason: "画像認識を使った文化祭展示を作るため、ニューラルネットワークの実装を学びたいです。",
    department: "情報工学科", grade: "1年", category: "AI・データ", status: "pending", created_at: "2026-08-12T07:30:00Z",
    contact_email: "student@example.kisarazu.ac.jp", admin_note: null,
  },
  ...sampleRequests,
];
