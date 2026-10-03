import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/admin'
import { UserAdminTable } from '@/components/admin/user-admin-table'

export default async function AdminUsersPage() { const context = await getAuthContext(); if (!context) redirect('/login?next=/admin/users'); if (context.role !== 'ADMIN') redirect('/feed'); const { data } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 50 }); return <main className="mx-auto max-w-6xl px-6 py-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Administration</p><h1 className="mt-2 text-3xl font-semibold">Users</h1><p className="mt-2 text-sm text-muted-foreground">Manage roles and account status. Changes are server-authorized and audited.</p><UserAdminTable users={(data?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? '', role: user.app_metadata?.role ?? 'USER', status: user.app_metadata?.status ?? 'ACTIVE' }))} /></main> }
