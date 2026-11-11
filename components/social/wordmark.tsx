type WordmarkProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-xl',
} as const

/** The Commun.dev wordmark. Wrap it in a link when it should navigate. */
export function Wordmark({ size = 'md', className = '' }: WordmarkProps) {
  return (
    <span
      className={`whitespace-nowrap font-mono font-semibold tracking-[-0.01em] text-foreground ${sizeClasses[size]} ${className}`}
    >
      commun<span className="text-accent">.</span>dev
    </span>
  )
}
