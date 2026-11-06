import Link from 'next/link'
import { PageContainer } from '@/components/ui/primitives'
import { Surface } from '@/components/ui/product-surfaces'
import { BetaFeedbackForm } from '@/components/beta-feedback-form'
import { BetaStatus } from '@/components/beta-status'

const accountLinks = [
  { label: 'Profile', title: 'Your public identity', description: 'Update your name, username, bio, interests, and links.', href: '/onboarding', action: 'Edit profile' },
  { label: 'Account', title: 'Security and access', description: 'Password reset and email verification are available through your account flow.', href: '/forgot-password', action: 'Reset password' },
]

export default function SettingsPage() {
  return (
    <PageContainer eyebrow="Your account" title="Settings" description="Manage the parts of Commun that are currently supported by your account.">
      <BetaStatus />
      <section aria-label="Account settings" className="grid gap-4 md:grid-cols-2">
        {accountLinks.map((item) => <Surface key={item.label} className="interactive-surface p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">{item.label}</p><h2 className="mt-3 font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p><Link href={item.href} className="mt-5 inline-flex min-h-10 items-center rounded-lg text-sm font-semibold text-accent transition-colors hover:text-accent-hover">{item.action} <span aria-hidden="true" className="ml-1">→</span></Link></Surface>)}
      </section>
      <Surface className="p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Membership & earnings</p><h2 className="mt-3 font-semibold">Creator monetization</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage memberships you pay for and the payout account that receives your earnings.</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/memberships" className="inline-flex min-h-10 items-center text-sm font-semibold text-accent hover:text-accent-hover">Your memberships →</Link><Link href="/earnings" className="inline-flex min-h-10 items-center text-sm font-semibold text-accent hover:text-accent-hover">Creator earnings →</Link></div></Surface>
      <Surface className="p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Feedback</p><h2 className="mt-3 font-semibold">Help shape the beta</h2><p className="mb-6 mt-2 text-sm leading-6 text-muted">Report a bug, request a feature, or share what feels confusing. Don’t include passwords, tokens, or private content.</p><BetaFeedbackForm /></Surface>
    </PageContainer>
  )
}
