import { RouteNotFound } from '@/components/ui/route-state'

export default function NotFound() {
  return (
    <RouteNotFound
      title="That report does not exist."
      description="It may have been resolved or removed."
      backHref="/moderation/reports"
      backLabel="Back to reports"
    />
  )
}
