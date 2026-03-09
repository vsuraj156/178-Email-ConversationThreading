import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Email – Conversation view",
  description: "Conversation-level threading for email",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
