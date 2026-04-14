import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);

  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    await admin.from('workspace_members').update({
      user_id: user.id,
      joined_at: new Date().toISOString(),
      invited_email: null,
    }).eq('invited_email', user.email).is('user_id', null);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
