export type RequestStatus = "pending" | "approved" | "rejected" | "fulfilled";

export type BookRequest = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  book_url: string;
  price: number;
  reason: string;
  department: string;
  grade: string;
  category: string;
  status: RequestStatus;
  created_at: string;
  contact_email?: string;
  admin_note?: string | null;
};

export const publicRequestColumns = [
  "id",
  "title",
  "author",
  "isbn",
  "book_url",
  "price",
  "reason",
  "department",
  "grade",
  "category",
  "status",
  "created_at",
] as const;

export type PublicBookRequest = Pick<BookRequest, (typeof publicRequestColumns)[number]>;
