import { Resend } from 'resend';

let client: Resend | null = null;

export function resend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
}

export async function sendMagicLinkEmail(params: {
  to: string;
  magicLink: string;
  planDisplayName: string;
}): Promise<void> {
  const { MagicLinkEmail } = await import('./emails/magic-link');
  await resend().emails.send({
    from: 'Devin Robinson <hello@fchiefaio.com>',
    to: params.to,
    subject: 'Your CAIO portal is ready',
    react: MagicLinkEmail({ magicLink: params.magicLink, planDisplayName: params.planDisplayName }),
  });
}

export async function sendInviteEmail(params: {
  to: string;
  magicLink: string;
  workspaceName: string;
  inviterName: string | null;
}): Promise<void> {
  const { InviteEmail } = await import('./emails/invite');
  await resend().emails.send({
    from: 'Devin Robinson <hello@fchiefaio.com>',
    to: params.to,
    subject: `You've been invited to ${params.workspaceName}`,
    react: InviteEmail(params),
  });
}
