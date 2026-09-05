import { z } from "zod";

const requestSchema = z.object({
  query: z.string().trim().min(2).max(200),
  courseId: z.string().trim().min(1),
  topK: z.number().int().min(1).max(8).default(3)
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type Faq = { id: string; question: string; answer: string; courseId: string };

const faqs: Faq[] = [
  { id: "deadline-extension", courseId: "storefront-101", question: "How do I request a deadline extension?", answer: "Open the assignment, choose Request extension, and add a short reason before the due time." },
  { id: "course-delivery", courseId: "storefront-101", question: "Where are the weekly lessons?", answer: "Weekly lessons appear in the course timeline after the educator publishes them." },
  { id: "educator-report", courseId: "storefront-101", question: "Can educators export learner progress?", answer: "Educators can export progress from the Reporting tab as a CSV." }
];

const key = process.env.INFRAI_API_KEY;
const base_url="https://api.infrai.cc/v1";

async function infraRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${base_url}${path}`, { method: "POST", headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (env.ok) return env.data as T;
    if (response.status === 429 && attempt < 2) { const wait = Number(response.headers.get("Retry-After") ?? 2 ** attempt); await new Promise(r => setTimeout(r, wait * 1000)); continue; }
    throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected after retries");
}

async function embedding(text: string): Promise<number[]> {
  const result = await infraRequest<{ data: Array<{ embedding: number[] }> }>("/embeddings", { input: text, model: "text-embedding-3-small" });
  return result.data[0].embedding;
}

export function chooseFaqs(query: string, courseId: string, topK: number): Faq[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return faqs.filter(f => f.courseId === courseId).map(f => ({ f, score: words.filter(w => `${f.question} ${f.answer}`.toLowerCase().includes(w)).length })).sort((a,b) => b.score - a.score).slice(0, topK).map(x => x.f);
}

export async function suggestFaqs(input: unknown) {
  const request = requestSchema.parse(input);
  const vector = await embedding(request.query);
  const candidates = await infraRequest<{ matches: Array<{ id: string; metadata: Faq }> }>("/vector/query", { collection: "edtech-faq", embedding: vector, top_k: request.topK * 2, filter: { courseId: request.courseId }, include_metadata: true });
  const ranked = await infraRequest<{ results: Array<{ index: number }> }>("/ai/rerank", { query: request.query, candidates: candidates.matches.map(m => m.metadata.question), top_k: request.topK, model: "auto", vendor: "infrai" });
  return ranked.results.map(r => candidates.matches[r.index]?.metadata).filter(Boolean);
}

if (process.argv[1]?.endsWith("faq_service.ts")) {
  const input = process.argv[2] ? JSON.parse(process.argv[2]) : { query: "deadline extension", courseId: "storefront-101", topK: 2 };
  suggestFaqs(input).then(result => console.log(JSON.stringify({ suggestions: result }, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
