import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const provider = getProvider(session?.accessToken);

  if (!provider.getMessage) {
    return Response.json({ error: "Not supported" }, { status: 501 });
  }

  const message = await provider.getMessage(id);
  if (!message) {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }

  return Response.json({ message });
}
