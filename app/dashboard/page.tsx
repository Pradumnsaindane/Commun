import { createClient } from '@/lib/supabase/server'
import { PageContainer, Card } from '@/components/ui/primitives'
import { LogoutButton } from '@/components/auth/auth-forms'
export default async function DashboardPage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return <PageContainer eyebrow="Commun / Dashboard" title="Your workspace" description={user?.email ? `Signed in as ${user.email}` : 'Your authenticated workspace.'}><Card className="max-w-xl"><p className="text-sm text-muted">Your account foundation is active. Feed, writing, and community tools will arrive in the next phase.</p><div className="mt-6"><LogoutButton /></div></Card></PageContainer> }
