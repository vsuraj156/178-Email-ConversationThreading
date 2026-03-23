import { google } from "googleapis";
import type { EmailProvider } from "./provider";
import { mockProvider } from "./mock-provider";
import { createGmailProvider } from "./gmail-provider";

/**
 * Returns a Gmail provider using the given OAuth access token,
 * or the mock provider if no token is supplied.
 */
export function getProvider(accessToken?: string): EmailProvider {
  if (accessToken) {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth });
    return createGmailProvider(gmail);
  }
  return mockProvider;
}
