import { RouteNotFound } from '@/components/ui/route-state'

export default function NotFound() {
  return (
    <RouteNotFound
      title="That article does not exist."
      description="It may have been unpublished or moved to another address."
      backHref="/discover"
      backLabel="Browse articles"
    />
  )
}
