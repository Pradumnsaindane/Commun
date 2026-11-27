'use client'

import { RouteError } from '@/components/ui/route-error'

type RouteErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

export default function Error({ error, retry }: RouteErrorProps) {
  return (
    <RouteError
      title="We could not load this page."
      description="Try again, or return to the home page."
      error={error}
      retry={retry}
    />
  )
}
