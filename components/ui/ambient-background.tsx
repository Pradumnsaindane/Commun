type AmbientBackgroundProps = {
  variant: 'landing' | 'dashboard'
}

/** A static-first ambient light field shared by the public site and workspace. */
export function AmbientBackground({ variant }: AmbientBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`ambient-background ambient-background--${variant}`}
    />
  )
}
