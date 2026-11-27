import { RouteNotFound } from '@/components/ui/route-state'

export default function NotFound() {
  return (
    <RouteNotFound
      title="That developer does not exist."
      description="The profile may have been renamed or removed."
      backHref="/explore"
      backLabel="Explore developers"
    />
  )
}
