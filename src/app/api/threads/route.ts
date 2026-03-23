import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";

export async function GET() {
  const session = await getServerSession(authOptions);
  const provider = getProvider(session?.accessToken);
  const threads = await provider.getThreads();
  return Response.json({ threads });
}
