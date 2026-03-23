import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProvider } from "@/lib/get-provider";

export async function ThreadList() {
  const session = await getServerSession(authOptions);
  const provider = getProvider(session?.accessToken);
  const threads = await provider.getThreads();

  return (
    <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {threads.map((t: { id: string; subject: string; snippet: string; messageIds: string[] }) => (
        <li key={t.id}>
          <Link
            href={`/threads/${t.id}`}
            className="block px-4 py-3 hover:bg-gray-50 transition"
          >
            <div className="font-medium text-gray-900 truncate">{t.subject}</div>
            <div className="text-sm text-gray-500 truncate mt-0.5">{t.snippet}</div>
            <div className="text-xs text-gray-400 mt-1">
              {t.messageIds?.length ?? 0} message{t.messageIds?.length === 1 ? "" : "s"}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
