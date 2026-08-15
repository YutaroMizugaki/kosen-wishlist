import { getDemoRequests } from "./demo-store";
import { createPublicClient } from "./supabase";
import type { BookRequest } from "./types";

export async function getPublicRequests(): Promise<BookRequest[]> {
  const client = createPublicClient();
  if (!client) return getDemoRequests().filter((request) => request.status === "approved" || request.status === "fulfilled");

  const { data, error } = await client
    .from("book_requests")
    .select("id,title,author,isbn,book_url,price,department,grade,category,status,created_at")
    .in("status", ["approved", "fulfilled"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public requests", error.message);
    return [];
  }
  return (data ?? []) as BookRequest[];
}
