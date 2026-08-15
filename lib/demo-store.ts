import { adminSampleRequests } from "./sample-data";
import type { BookRequest, RequestStatus } from "./types";

type DemoGlobal = typeof globalThis & { __kosenBooksDemoRequests?: BookRequest[] };

const demoGlobal = globalThis as DemoGlobal;

function store() {
  if (!demoGlobal.__kosenBooksDemoRequests) {
    demoGlobal.__kosenBooksDemoRequests = adminSampleRequests.map((request) => ({ ...request }));
  }
  return demoGlobal.__kosenBooksDemoRequests;
}

export function getDemoRequests() {
  return store();
}

export function addDemoRequest(input: Omit<BookRequest, "id" | "created_at">) {
  const request: BookRequest = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  store().unshift(request);
  return request;
}

export function updateDemoRequest(id: string, status: RequestStatus) {
  const request = store().find((item) => item.id === id);
  if (request) request.status = status;
  return request;
}
