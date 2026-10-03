import { z } from 'zod'

export const passwordSchema = z.string().min(8, 'Use at least 8 characters.').regex(/[A-Z]/, 'Add an uppercase letter.').regex(/[0-9]/, 'Add a number.')
export const registerSchema = z.object({ name: z.string().trim().min(2, 'Enter your name.'), username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores only.'), email: z.string().trim().email('Enter a valid email.'), password: passwordSchema, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
export const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email.'), password: z.string().min(1, 'Enter your password.') })
export const emailSchema = z.object({ email: z.string().trim().email('Enter a valid email.') })
export const resetSchema = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
export function safeNext(value: string | null) { return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/dashboard' }
export function safeNextPath(value: string | null | undefined) { return !value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') ? '/feed' : value }
export function authMessage(message?: string | null) { const text = message?.toLowerCase() ?? ''; if (text.includes('invalid login') || text.includes('invalid')) return 'Invalid email or password.'; if (text.includes('already registered') || text.includes('duplicate')) return 'That email or username is already in use.'; if (text.includes('password')) return message ?? 'Please choose a stronger password.'; return 'Something went wrong. Please try again.' }
export type AuthForm = 'login' | 'register' | 'forgot' | 'reset'

export function fieldErrors(error: z.ZodError) { return error.issues.reduce<Record<string, string>>((all, issue) => { const key = String(issue.path[0] ?? 'form'); if (!all[key]) all[key] = issue.message; return all }, {}) }

export const profileFields = { role: 'USER', status: 'PENDING_VERIFICATION', onboarding_completed: false } as const
