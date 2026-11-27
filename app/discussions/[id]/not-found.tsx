import { RouteNotFound } from '@/components/ui/route-state'

export default function NotFound() {
  return (
    <RouteNotFound
      title="That discussion does not exist."
      description="It may have been removed or is no longer available."
      backHref="/discussions"
      backLabel="Browse discussions"
    />
  )
}
