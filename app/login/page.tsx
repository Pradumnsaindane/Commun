import type { Metadata } from 'next'
import { CommunLoginAdapter } from '@/components/auth/commun-login-adapter'

export const metadata: Metadata = {
  title: 'Log in | Commun',
  description: 'Log in to continue where you left off on Commun.',
}

export default function LoginPage() {
  return <CommunLoginAdapter />
}
