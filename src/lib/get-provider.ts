import { google } from "googleapis";
import type { EmailProvider } from "./provider";
import { mockProvider } from "./mock-provider";
import { createGmailProvider } from "./gmail-provider";

/**
 * Returns the active email provider (mock or Gmail when configured).
 * When GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are set, returns GmailProvider; otherwise mock.
 */
export async function getProvider(): Promise<EmailProvider> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );
    auth.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: "v1", auth });
    return createGmailProvider(gmail);
  }

  return mockProvider;
}
