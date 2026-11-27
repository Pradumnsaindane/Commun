'use client'

import { RouteError } from '@/components/ui/route-error'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <RouteError
      title="This profile could not be loaded."
      description="Try again, or return home."
      error={error}
      retry={retry}
    />
  )
}
