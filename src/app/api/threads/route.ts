import { mockProvider } from "@/lib/mock-provider";

export async function GET() {
  const threads = await mockProvider.getThreads();
  return Response.json({ threads });
}
