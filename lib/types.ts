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
