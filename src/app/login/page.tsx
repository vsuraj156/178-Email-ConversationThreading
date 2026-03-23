import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/SignInButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center space-y-4 max-w-sm w-full">
        <h1 className="text-2xl font-semibold">Email Threading</h1>
        <p className="text-gray-500 text-sm">
          Sign in with Google to view your inbox.
        </p>
        <SignInButton />
      </div>
    </div>
  );
}
