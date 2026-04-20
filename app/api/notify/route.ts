import { NextRequest, NextResponse } from "next/server";
 
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notify
//
// Receives interest submissions (property CTA) and feedback submissions
// (feedback widget). Sends an email via Resend if configured, otherwise
// logs to server console.
//
// Request shape:
//   {
//     type: "interest" | "feedback",
//     payload: { ...fields }
//   }
//
// Env vars (all optional):
//   RESEND_API_KEY      - Resend API key, starts with "re_"
//   NOTIFY_TO_EMAIL     - Where to send notifications (defaults to the Resend
//                         sandbox sender which only delivers to the account owner)
//   NOTIFY_FROM_EMAIL   - From address (default: onboarding@resend.dev, works
//                         without domain verification for up to 100 emails)
//
// Missing keys do NOT error — they just log. This is intentional so the
// frontend demo works without any backend setup.
// ─────────────────────────────────────────────────────────────────────────────
 
export const runtime = "nodejs";
 
interface InterestPayload {
  property_id?: string;
  property_address?: string;
  monthly_profit?: number;
  user_email?: string;
  submitted_at: string;
  user_agent?: string;
}
 
interface FeedbackPayload {
  context: string;
  message: string;
  email?: string;
  path?: string;
  submitted_at: string;
  user_agent?: string;
}
 
type Payload = InterestPayload | FeedbackPayload;
 
interface NotifyRequest {
  type: "interest" | "feedback";
  payload: Payload;
}
 
export async function POST(req: NextRequest) {
  let body: NotifyRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
 
  if (!body || (body.type !== "interest" && body.type !== "feedback")) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
 
  if (!body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }
 
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFY_TO_EMAIL || "";
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "ROI Notifications <onboarding@resend.dev>";
 
  // Always log for dev/demo visibility
  console.log(`[notify] ${body.type}:`, JSON.stringify(body.payload, null, 2));
 
  // If not configured, return success — frontend doesn't need to know
  if (!resendKey || !toEmail) {
    return NextResponse.json({
      ok: true,
      delivery: "logged_only",
      note: "Configure RESEND_API_KEY and NOTIFY_TO_EMAIL to enable email delivery",
    });
  }
 
  // Build the email
  const { subject, html, text } = buildEmail(body);
 
  try {
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
        text,
      }),
    });
 
    if (!resendResp.ok) {
      const errText = await resendResp.text();
      console.error("[notify] Resend error:", resendResp.status, errText);
      return NextResponse.json(
        { ok: false, delivery: "failed", error: `Resend returned ${resendResp.status}` },
        { status: 502 }
      );
    }
 
    const result = await resendResp.json();
    return NextResponse.json({
      ok: true,
      delivery: "sent",
      email_id: result.id,
    });
  } catch (e) {
    console.error("[notify] Network error:", e);
    return NextResponse.json(
      { ok: false, delivery: "failed", error: "Network error" },
      { status: 502 }
    );
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// Email template builders
// ─────────────────────────────────────────────────────────────────────────────
 
function buildEmail(body: NotifyRequest): { subject: string; html: string; text: string } {
  if (body.type === "interest") {
    return buildInterestEmail(body.payload as InterestPayload);
  }
  return buildFeedbackEmail(body.payload as FeedbackPayload);
}
 
function buildInterestEmail(p: InterestPayload) {
  const subject = `New interest: ${p.property_address || "Unknown property"}`;
  const profit = p.monthly_profit != null ? `$${p.monthly_profit.toLocaleString()}/mo` : "—";
 
  const text = [
    "New property interest submitted on ROI",
    "",
    `Property: ${p.property_address || "—"}`,
    `Property ID: ${p.property_id || "—"}`,
    `Projected monthly profit: ${profit}`,
    `User email: ${p.user_email || "(not provided)"}`,
    `Submitted: ${p.submitted_at}`,
    "",
    p.user_agent ? `User agent: ${p.user_agent}` : "",
  ]
    .filter(Boolean)
    .join("\n");
 
  const html = `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;padding:24px;">
      <div style="font-size:11px;color:#737373;letter-spacing:0.06em;text-transform:uppercase;font-weight:600;margin-bottom:8px;">New interest</div>
      <h1 style="font-size:24px;font-weight:600;margin:0 0 16px;color:#0a0a0a;">Someone wants this property</h1>
      <div style="background:#fafafa;border:1px solid #eaeaea;border-radius:12px;padding:16px;margin:16px 0;">
        <div style="font-size:11px;color:#737373;letter-spacing:0.06em;text-transform:uppercase;font-weight:600;margin-bottom:4px;">Property</div>
        <div style="font-weight:600;margin-bottom:8px;">${escapeHtml(p.property_address || "Unknown")}</div>
        <div style="font-size:14px;color:#0c7c3d;font-weight:600;">${profit} projected</div>
      </div>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:#737373;width:140px;">Property ID</td><td style="padding:6px 0;font-family:monospace;">${escapeHtml(p.property_id || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#737373;">User email</td><td style="padding:6px 0;">${p.user_email ? escapeHtml(p.user_email) : "<em style='color:#a3a3a3;'>not provided</em>"}</td></tr>
        <tr><td style="padding:6px 0;color:#737373;">Submitted</td><td style="padding:6px 0;">${escapeHtml(p.submitted_at)}</td></tr>
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eaeaea;font-size:11px;color:#a3a3a3;">
        ROI · Automated notification
      </div>
    </div>
  `;
  return { subject, html, text };
}
 
function buildFeedbackEmail(p: FeedbackPayload) {
  const subject = `Feedback: ${p.message.slice(0, 60)}${p.message.length > 60 ? "…" : ""}`;
 
  const text = [
    "New feedback submitted on ROI",
    "",
    `Context: ${p.context}`,
    `Path: ${p.path || "—"}`,
    `From: ${p.email || "(anonymous)"}`,
    `Submitted: ${p.submitted_at}`,
    "",
    "Message:",
    p.message,
  ].join("\n");
 
  const html = `
    <div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;padding:24px;">
      <div style="font-size:11px;color:#737373;letter-spacing:0.06em;text-transform:uppercase;font-weight:600;margin-bottom:8px;">Feedback</div>
      <h1 style="font-size:24px;font-weight:600;margin:0 0 16px;color:#0a0a0a;">Someone left feedback</h1>
      <div style="background:#fafafa;border:1px solid #eaeaea;border-radius:12px;padding:16px;margin:16px 0;font-size:15px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(p.message)}</div>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:#737373;width:100px;">Context</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${escapeHtml(p.context)}</td></tr>
        <tr><td style="padding:6px 0;color:#737373;">Page</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${escapeHtml(p.path || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#737373;">Reply to</td><td style="padding:6px 0;">${p.email ? `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>` : "<em style='color:#a3a3a3;'>anonymous</em>"}</td></tr>
        <tr><td style="padding:6px 0;color:#737373;">Submitted</td><td style="padding:6px 0;">${escapeHtml(p.submitted_at)}</td></tr>
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eaeaea;font-size:11px;color:#a3a3a3;">
        ROI · Automated notification
      </div>
    </div>
  `;
  return { subject, html, text };
}
 
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}