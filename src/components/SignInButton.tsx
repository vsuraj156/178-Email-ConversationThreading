"use client";
import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
    >
      Sign in with Google
    </button>
  );
}
