import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/admin'
import { UserAdminTable } from '@/components/admin/user-admin-table'
import { SectionHeader } from '@/components/ui/product-surfaces'

export default async function AdminUsersPage() { const context = await getAuthContext(); if (!context) redirect('/login?next=/admin/users'); if (context.role !== 'ADMIN') redirect('/feed'); const { data } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 50 }); return <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10"><SectionHeader eyebrow="Administration" title="Users" description="Manage roles and account status. Changes are server-authorized and audited." /><UserAdminTable users={(data?.users ?? []).map((user) => ({ id: user.id, email: user.email ?? '', role: user.app_metadata?.role ?? 'USER', status: user.app_metadata?.status ?? 'ACTIVE' }))} /></main> }
