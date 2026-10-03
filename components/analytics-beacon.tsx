'use client'

import { useEffect } from 'react'
import { track, type ProductEvent } from '@/lib/analytics'

export function AnalyticsBeacon({ event, metadata }: { event: ProductEvent; metadata?: Record<string, string | number | boolean> }) { useEffect(() => { track(event, metadata) }, [event, metadata]); return null }
