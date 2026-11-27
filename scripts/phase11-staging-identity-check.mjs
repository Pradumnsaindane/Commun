#!/usr/bin/env node
/**
 * Phase 11M — CLI wrapper for the staging identity gate.
 * Prints PASS/BLOCKED only; never prints secret values.
 */
import { checkStagingIdentity } from './phase11-staging-identity.mjs'

const { results, ok } = checkStagingIdentity(process.env)
for (const result of results) {
  console.log(`${result.status.padEnd(7)} ${result.name} — ${result.detail}`)
}
const passes = results.filter((r) => r.status === 'PASS').length
console.log(`\nSummary: ${passes} PASS, ${results.length - passes} BLOCKED`)
process.exit(ok ? 0 : 2)
