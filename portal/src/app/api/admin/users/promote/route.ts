import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const Body = z.object({ userId: z.string().uuid(), isAdmin: z.boolean().default(true) });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: caller } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!caller?.is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('profiles').update({ is_admin: parsed.data.isAdmin }).eq('user_id', parsed.data.userId);
  await admin.from('audit_log').insert({
    actor_user_id: user.id,
    action: 'user.admin_changed',
    metadata: { target_user_id: parsed.data.userId, is_admin: parsed.data.isAdmin },
  });
  return NextResponse.json({ ok: true });
}
