import type { Message, Thread } from "./types";

// Scenario: Recruiter email + HackerRank invite in different threads/labels
// Thread 1: Recruiter at Acme - "Take our coding test"
// Thread 2: HackerRank - "Your coding assessment invite" (different subject, different label)
// Both semantically about "Acme coding test"

// Thread 3: Unrelated - project sync meeting
export const MOCK_MESSAGES: Message[] = [
  // Thread 1 - Recruiter
  {
    id: "m1",
    threadId: "t1",
    subject: "Re: Software Engineer role at Acme Corp",
    snippet: "Hi! We'd love for you to take our technical assessment. Please complete the coding test at your earliest convenience...",
    body: "Hi! We'd love for you to take our technical assessment. Please complete the coding test at your earliest convenience. You'll receive a separate email from our assessment provider with the actual link. Best, Sarah",
    from: "sarah.recruiter@acme.com",
    to: ["me@example.com"],
    date: "2025-03-01T10:00:00Z",
    labelIds: ["INBOX", "Recruiter"],
  },
  {
    id: "m2",
    threadId: "t1",
    subject: "Re: Software Engineer role at Acme Corp",
    snippet: "Just following up - have you had a chance to start the assessment? Let me know if you need more time.",
    from: "sarah.recruiter@acme.com",
    to: ["me@example.com"],
    date: "2025-03-03T14:00:00Z",
    labelIds: ["INBOX", "Recruiter"],
  },
  // Thread 2 - HackerRank (same topic, different thread/label)
  {
    id: "m3",
    threadId: "t2",
    subject: "Your Acme Corp coding assessment – action required",
    snippet: "You have been invited to complete a coding assessment for Acme Corp. Click below to begin. This link expires in 7 days.",
    body: "You have been invited to complete a coding assessment for Acme Corp. Click below to begin. This link expires in 7 days. [Start Assessment]",
    from: "noreply@hackerrank.com",
    to: ["me@example.com"],
    date: "2025-03-02T08:00:00Z",
    labelIds: ["INBOX", "HackerRank"],
  },
  {
    id: "m4",
    threadId: "t2",
    subject: "Reminder: Your Acme Corp coding assessment",
    snippet: "Your assessment is still pending. Complete it before the deadline.",
    from: "noreply@hackerrank.com",
    to: ["me@example.com"],
    date: "2025-03-05T09:00:00Z",
    labelIds: ["INBOX", "HackerRank"],
  },
  // Thread 3 - Different topic (project sync)
  {
    id: "m5",
    threadId: "t3",
    subject: "Project Alpha – sync meeting this Friday",
    snippet: "Can we schedule a 30-min sync for Friday 2pm to go over the Q1 roadmap?",
    from: "jane@acme.com",
    to: ["me@example.com"],
    date: "2025-03-04T11:00:00Z",
    labelIds: ["INBOX", "Work"],
  },
  {
    id: "m6",
    threadId: "t3",
    subject: "Re: Project Alpha – sync meeting this Friday",
    snippet: "Friday 2pm works for me. I'll send a calendar invite.",
    from: "me@example.com",
    to: ["jane@acme.com"],
    date: "2025-03-04T12:00:00Z",
    labelIds: ["INBOX", "Work", "Sent"],
  },
];

export const MOCK_THREADS: Thread[] = [
  {
    id: "t1",
    subject: "Re: Software Engineer role at Acme Corp",
    messageIds: ["m1", "m2"],
    snippet: "Just following up - have you had a chance to start the assessment?",
    updatedAt: "2025-03-03T14:00:00Z",
  },
  {
    id: "t2",
    subject: "Your Acme Corp coding assessment – action required",
    messageIds: ["m3", "m4"],
    snippet: "Your assessment is still pending. Complete it before the deadline.",
    updatedAt: "2025-03-05T09:00:00Z",
  },
  {
    id: "t3",
    subject: "Project Alpha – sync meeting this Friday",
    messageIds: ["m5", "m6"],
    snippet: "Friday 2pm works for me. I'll send a calendar invite.",
    updatedAt: "2025-03-04T12:00:00Z",
  },
];
