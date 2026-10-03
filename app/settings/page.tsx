import { PageContainer } from '@/components/ui/primitives'
import { Surface } from '@/components/ui/product-surfaces'
import { BetaFeedbackForm } from '@/components/beta-feedback-form'
import { BetaStatus } from '@/components/beta-status'

export default function SettingsPage() {
  return <PageContainer eyebrow="Your account" title="Settings" description="Manage the parts of Commun that are currently supported by your account.">
    <BetaStatus />
    <div className="grid gap-4 md:grid-cols-2"><Surface className="p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Profile</p><h2 className="mt-3 font-semibold">Your public identity</h2><p className="mt-2 text-sm leading-6 text-muted">Update your name, username, bio, interests, and links from your profile setup.</p><a href="/onboarding" className="mt-5 inline-flex text-sm font-semibold text-accent hover:underline">Edit profile →</a></Surface><Surface className="p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Account</p><h2 className="mt-3 font-semibold">Security and access</h2><p className="mt-2 text-sm leading-6 text-muted">Password reset and email verification are available through the account flow.</p><a href="/forgot-password" className="mt-5 inline-flex text-sm font-semibold text-accent hover:underline">Reset password →</a></Surface></div>
    <Surface className="p-6"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Feedback</p><h2 className="mt-3 font-semibold">Help shape the beta</h2><p className="mt-2 mb-6 text-sm leading-6 text-muted">Report a bug, request a feature, or tell us what feels confusing. Please do not include passwords, tokens, or private content.</p><BetaFeedbackForm /></Surface>
  </PageContainer>
}
