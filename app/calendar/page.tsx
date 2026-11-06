import { redirect } from 'next/navigation'
import { CalendarWorkspace } from '@/components/workspace/calendar-workspace'
import { createClient } from '@/lib/supabase/server'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/calendar')
  return <CalendarWorkspace />
}
