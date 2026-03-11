import { getProvider } from "@/lib/get-provider";

export async function GET() {
  const provider = await getProvider();
  const threads = await provider.getThreads();
  return Response.json({ threads });
}
