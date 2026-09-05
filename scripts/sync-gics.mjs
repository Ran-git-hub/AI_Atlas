// Regenerates data/gics-industries.json from the canonical GICS whitelist in the
// ai-atlas-data-quality skill. The skill file is the single source of truth; the
// JSON is a committed build artifact so the Vercel deployment can read the list.
// Run after any edit to gics-mapping.md:  npm run sync-gics
import { readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"

const SOURCE =
  process.env.GICS_MAPPING_PATH ||
  path.join(
    homedir(),
    ".hermes/profiles/aiatlashermes/skills/ai-atlas/ai-atlas-data-quality/references/gics-mapping.md"
  )
const OUT = path.join(import.meta.dirname, "..", "data", "gics-industries.json")

const EXPECTED_INDUSTRIES = 74
const EXPECTED_EXCEPTIONS = 2
const EXCEPTIONS_HEADING = "Non-GICS Exceptions"

let markdown
try {
  markdown = readFileSync(SOURCE, "utf8")
} catch {
  console.error(`Cannot read the GICS whitelist at:\n  ${SOURCE}\nSet GICS_MAPPING_PATH to override.`)
  process.exit(1)
}

const industries = []
const exceptions = []
let inExceptions = false

for (const line of markdown.split("\n")) {
  const heading = line.match(/^##\s+(.*?)\s*$/)
  if (heading) {
    inExceptions = heading[1] === EXCEPTIONS_HEADING
    continue
  }
  const bullet = line.match(/^-\s+(.*?)\s*$/)
  if (bullet) (inExceptions ? exceptions : industries).push(bullet[1])
}

const fail = (message) => {
  console.error(`${message}\nSource: ${SOURCE}\nNothing was written.`)
  process.exit(1)
}

if (industries.length !== EXPECTED_INDUSTRIES)
  fail(`Expected ${EXPECTED_INDUSTRIES} GICS L3 industries, parsed ${industries.length}.`)
if (exceptions.length !== EXPECTED_EXCEPTIONS)
  fail(`Expected ${EXPECTED_EXCEPTIONS} non-GICS exceptions, parsed ${exceptions.length}.`)

const all = [...industries, ...exceptions]
const duplicates = all.filter((value, i) => all.indexOf(value) !== i)
if (duplicates.length) fail(`Duplicate values: ${duplicates.join(", ")}`)

writeFileSync(OUT, `${JSON.stringify({ _source: SOURCE, industries, exceptions }, null, 2)}\n`)
console.log(`Wrote ${industries.length} industries + ${exceptions.length} exceptions to ${OUT}`)
