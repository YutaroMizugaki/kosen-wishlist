import { getDemoRequests } from "./demo-store";
import { createPublicClient } from "./supabase";
import { type BookRequest, type PublicBookRequest } from "./types";

export function toPublicRequest(request: BookRequest): PublicBookRequest {
  return {
    id: request.id,
    title: request.title,
    author: request.author,
    isbn: request.isbn,
    book_url: request.book_url,
    price: request.price,
    reason: request.reason,
    department: request.department,
    grade: request.grade,
    category: request.category,
    status: request.status,
    created_at: request.created_at,
  };
}

export async function getPublicRequests(): Promise<PublicBookRequest[]> {
  const client = createPublicClient();
  if (!client) {
    return getDemoRequests()
      .filter((request) => request.status === "approved" || request.status === "fulfilled")
      .map(toPublicRequest);
  }

  const { data, error } = await client
    .from("book_requests")
    .select("id,title,author,isbn,book_url,price,reason,department,grade,category,status,created_at")
    .in("status", ["approved", "fulfilled"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public requests", error.message);
    return [];
  }
  return (data ?? []).map(toPublicRequest);
}
