'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Commun3DLogin,
  type CommunLoginCredentials,
  type CommunLoginResult,
  type CommunRecoveryResult,
} from '@/components/ui/commun-3d-login'
import { createClient } from '@/lib/supabase/client'
import { authMessage, emailSchema, fieldErrors, loginSchema, safeNext } from '@/lib/auth/validation'

/**
 * Connects the animated Commun login experience to the existing Supabase
 * email/password flow. No mock or delayed auth path exists here: success is
 * returned only after Supabase resolves signInWithPassword without an error.
 */
export function CommunLoginAdapter() {
  const router = useRouter()

  const onSubmit = useCallback(
    async ({ email, password }: CommunLoginCredentials): Promise<CommunLoginResult> => {
      const parsed = loginSchema.safeParse({ email, password })
      if (!parsed.success) {
        const errors = fieldErrors(parsed.error)
        const field = errors.email ? 'email' : errors.password ? 'password' : 'form'
        return {
          ok: false,
          message: errors.email ?? errors.password ?? 'Enter a valid email and password.',
          field,
        }
      }

      try {
        const { error } = await createClient().auth.signInWithPassword(parsed.data)
        if (error) {
          return { ok: false, message: authMessage(error.message), field: 'form' }
        }

        const next = safeNext(new URLSearchParams(window.location.search).get('next'))
        return { ok: true, redirectTo: next }
      } catch {
        return { ok: false, message: 'Unable to sign in. Please try again.', field: 'form' }
      }
    },
    []
  )

  const onForgotPassword = useCallback(async (email: string): Promise<CommunRecoveryResult> => {
    const parsed = emailSchema.safeParse({ email })
    if (!parsed.success) {
      return { ok: false, message: 'Enter a valid email address.' }
    }

    try {
      const { error } = await createClient().auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        return { ok: false, message: 'Unable to send a reset link. Please try again.' }
      }
      return { ok: true, message: 'Check your inbox for a password reset link.' }
    } catch {
      return { ok: false, message: 'Unable to send a reset link. Please try again.' }
    }
  }, [])

  const onSignup = useCallback(() => {
    router.push('/register')
  }, [router])

  const onRedirect = useCallback(
    (path: string) => {
      router.push(path)
      router.refresh()
    },
    [router]
  )

  return (
    <Commun3DLogin
      accentColor="#2563EB"
      onSubmit={onSubmit}
      onForgotPassword={onForgotPassword}
      onSignup={onSignup}
      onRedirect={onRedirect}
    />
  )
}

export default CommunLoginAdapter
