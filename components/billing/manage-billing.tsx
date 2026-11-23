'use client'

import { useState } from 'react'
import { errorMessage } from '@/features/api-client'
import { openBillingPortal } from '@/features/billing/api'

export function ManageBilling({ billingReady }: { billingReady: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setBusy(true)
    setError(null)
    try {
      window.location.href = await openBillingPortal()
    } catch (requestError) {
      setError(errorMessage(requestError, 'Billing portal unavailable.'))
      setBusy(false)
    }
  }

  if (!billingReady) return null

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={() => void openPortal()} disabled={busy} className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-50">
        {busy ? 'Opening…' : 'Manage billing'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}