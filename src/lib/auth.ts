import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GMAIL_CLIENT_ID!,
      clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, persist tokens
      if (account) {
        return {
          ...token,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : undefined,
        };
      }

      // Return token if still valid
      if (!token.expiresAt || Date.now() < token.expiresAt) {
        return token;
      }

      // Access token expired — refresh it
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID!,
            client_secret: process.env.GMAIL_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken ?? "",
          }),
        });
        const tokens = await response.json();
        if (!response.ok) throw tokens;
        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.userId = token.sub!;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
