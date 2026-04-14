import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin.from('workspace_members').select('workspace_id, user_id').eq('id', id).single();
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (row.user_id) return NextResponse.json({ error: 'not a pending invite' }, { status: 400 });

  const { data: caller } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', row.workspace_id).eq('user_id', user.id).maybeSingle();
  if (caller?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await admin.from('workspace_members').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
