-- profiles: users read/update their own row; admins read all
create policy "profiles_self_select"
  on public.profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "profiles_self_update"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_admin = (select is_admin from public.profiles where user_id = auth.uid()));
-- ^ Users cannot flip their own is_admin flag.

-- workspaces: members read; admins read all
create policy "workspaces_member_select"
  on public.workspaces for select
  using (id in (select public.user_workspace_ids()) or public.is_admin());

-- workspace_members: members read their own workspace's members; admins read all
create policy "workspace_members_member_select"
  on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()) or public.is_admin());

-- audit_log: members read their workspace's audit log; admins read all
create policy "audit_log_member_select"
  on public.audit_log for select
  using (workspace_id in (select public.user_workspace_ids()) or public.is_admin());

-- No INSERT/UPDATE/DELETE policies on workspaces, workspace_members, audit_log, webhook_events.
-- All writes go through the service role (API routes and webhook).
