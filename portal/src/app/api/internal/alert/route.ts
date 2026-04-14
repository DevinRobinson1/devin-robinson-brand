import { NextResponse, type NextRequest } from 'next/server';
import { resend } from '@/lib/resend';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    await resend().emails.send({
      from: 'Portal Alerts <alerts@fchiefaio.com>',
      to: process.env.ALERT_EMAIL_TO!,
      subject: `[portal] ${body.kind ?? 'alert'}`,
      text: JSON.stringify(body, null, 2),
    });
  } catch {
    // Swallow — we are the alert path; don't recurse.
  }
  return NextResponse.json({ ok: true });
}
