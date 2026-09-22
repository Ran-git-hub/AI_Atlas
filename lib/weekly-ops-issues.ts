import type { WeeklyAdminRow } from "@/lib/types-weekly-admin"
import type { IssueState, IssueStatus } from "@/lib/data-weekly-ops-state"

export type IssueSource = "warning" | "next-step"

export interface IssueOccurrence {
  year: number
  isoWeek: number
  weekStart: string
  /** The issue text exactly as that week's writer phrased it. */
  text: string
  /** The recommendation (warnings) or action (next steps) for that week. */
  detail: string
  /** `severity` for warnings, `priority` for next steps. */
  grade: string
  /**
   * How this week mentioned the issue. A next step that is still outstanding
   * moves out of `nextSteps` and into the following week's `carryOver`, so an
   * issue's life runs through both lists.
   */
  via: "direct" | "carry-over"
  /** The writer's own verdict, present only on carry-over occurrences. */
  carryStatus?: "resolved" | "carried" | "new"
}

export interface OpsIssue {
  key: string
  source: IssueSource
  /** `location` for warnings, `file` for next steps. */
  location: string
  /** Newest occurrence first. */
  occurrences: IssueOccurrence[]
  firstSeen: IssueOccurrence
  latest: IssueOccurrence
  /** Number of weeks this issue appeared in. */
  weeks: number
  /** Consecutive weeks up to and including the newest week in the data. */
  streak: number
  /** True when the issue is still live in the newest week and not declared resolved. */
  open: boolean
  /** The week whose carry-over declared this issue resolved, if any. */
  resolvedIn: IssueOccurrence | null

  /** The operator's own verdict, null while they have not judged this issue. */
  adminStatus: IssueStatus | null
  adminNote: string | null
  /** The newest week on record when the operator set that verdict. */
  adminStatusWeek: { year: number; isoWeek: number } | null
  /** The operator closed this issue and a later week raised it again. */
  reopened: boolean
  /** Still needs the operator: live, and not closed by them without recurring since. */
  actionable: boolean
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is",
  "are", "was", "were", "be", "been", "still", "not", "no", "this", "that", "with",
  "from", "as", "it", "its", "has", "have", "had", "by", "via",
])

/**
 * Writers restate an outstanding item with a fresh preamble every week —
 * "Carry-over from W31/W32 (4th consecutive carry): …", "5th consecutive
 * carry-over (W31→W35): …". Comparing the text with that preamble attached
 * splits one long-running issue into a new issue every week, which is exactly
 * the history worth keeping.
 */
function stripCarryPreamble(text: string): string {
  return text
    .replace(/^\s*carry[- ]?over\s+from\s+[^:.]*[:.]\s*/i, "")
    .replace(/^\s*\d+(st|nd|rd|th)\s+consecutive\s+carry[- ]?over[^:]*:\s*/i, "")
    .replace(/^\s*\(?\d+(st|nd|rd|th)\s+consecutive\s+carry\)?[:.]?\s*/i, "")
}

/**
 * The claim an occurrence makes, without the evidence for it.
 *
 * Each week restates a standing problem and then appends that week's proof —
 * "… enforced: 2 UCs (HBF, Tirol Kliniken) failed", "… enforced. UC 2dca2f
 * failed". The proof is longer than the claim and different every week, so the
 * comparison runs on the first clause only: up to the first sentence or clause
 * break, with parentheticals removed.
 */
const CLAIM_WORDS = 8

function claimOf(text: string): string {
  return stripCarryPreamble(text)
    .replace(/\(.*?\)/g, " ")
    .split(/[.:;—]|\s-\s/)[0]
}

function tokenize(text: string): Set<string> {
  return new Set(
    claimOf(text)
      .toLowerCase()
      .replace(/\d+/g, " ")
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
      .slice(0, CLAIM_WORDS),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  return shared / (a.size + b.size - shared)
}

/**
 * The same place, written differently. Locations pick up parenthetical and
 * step suffixes over time — "…/SKILL.md" and
 * "…/SKILL.md (Tier-1 ghost company audit)" are one file.
 */
function normalizeLocation(location: string): string {
  return location
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/,?\s*Step\s+[\d.]+.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/**
 * Two occurrences are the same issue when they sit in the same place and their
 * meaningful words mostly agree. Word overlap rather than a prefix comparison,
 * because each week's restatement inserts and drops words freely.
 */
const SAME_ISSUE_THRESHOLD = 0.55

/**
 * Collapse every week's warnings and next steps into one entry per distinct
 * issue, so an issue that recurs for weeks reads as one thing with a history
 * instead of N unrelated rows.
 *
 * `rows` is expected newest first, as `getWeeklyAdminRows` returns it.
 */
export function deriveOpsIssues(rows: WeeklyAdminRow[]): OpsIssue[] {
  if (rows.length === 0) return []

  interface Cluster {
    source: IssueSource
    location: string
    /** Token sets of every occurrence, for matching later weeks against any of them. */
    tokenSets: Set<string>[]
    seedTokens: string[]
    occurrences: IssueOccurrence[]
  }

  // Keyed by `${source}|${normalizedLocation}` — clustering only ever compares
  // issues that point at the same place.
  const groups = new Map<string, Cluster[]>()

  const add = (
    source: IssueSource,
    location: string,
    row: WeeklyAdminRow,
    text: string,
    detail: string,
    grade: string,
    via: "direct" | "carry-over",
    carryStatus?: "resolved" | "carried" | "new",
  ) => {
    const occurrence: IssueOccurrence = {
      year: row.year,
      isoWeek: row.isoWeek,
      weekStart: row.weekStart,
      text,
      detail,
      grade,
      via,
      carryStatus,
    }
    const tokens = tokenize(text)
    const groupKey = `${source}|${normalizeLocation(location)}`
    const clusters = groups.get(groupKey) ?? []

    let best: Cluster | null = null
    let bestScore = SAME_ISSUE_THRESHOLD
    for (const c of clusters) {
      const score = Math.max(...c.tokenSets.map((ts) => jaccard(tokens, ts)))
      if (score >= bestScore) {
        best = c
        bestScore = score
      }
    }

    if (best) {
      best.tokenSets.push(tokens)
      best.occurrences.push(occurrence)
    } else {
      clusters.push({
        source,
        location,
        tokenSets: [tokens],
        // The seed is the earliest occurrence, so the derived key stays put as
        // later weeks join the cluster.
        seedTokens: [...tokens].sort().slice(0, 6),
        occurrences: [occurrence],
      })
      groups.set(groupKey, clusters)
    }
  }

  // Oldest first, so each cluster is seeded by the week that raised it first.
  for (const row of [...rows].reverse()) {
    for (const w of row.systemHealth?.warnings ?? []) {
      add("warning", w.location, row, w.issue, w.recommendation, w.severity, "direct")
    }
    for (const s of row.nextSteps ?? []) {
      add("next-step", s.file, row, s.issue, s.action, s.priority, "direct")
    }
    // A carry-over entry is the same issue as the earlier week's next step, so
    // it extends that issue rather than starting a new one. Without this an
    // outstanding item looks closed the moment it stops being a next step.
    for (const c of row.carryOver ?? []) {
      add("next-step", c.step.file, row, c.step.issue, c.step.action, c.step.priority, "carry-over", c.status)
    }
  }

  const byKey = new Map<string, { source: IssueSource; location: string; occurrences: IssueOccurrence[] }>()
  for (const [groupKey, clusters] of groups) {
    for (const c of clusters) {
      byKey.set(`${groupKey}|${c.seedTokens.join(" ")}`, {
        source: c.source,
        location: c.location,
        occurrences: c.occurrences,
      })
    }
  }

  // Weeks present in the data, newest first — a gap in cron runs must not break a streak.
  const weekOrder = rows.map((r) => `${r.year}-${r.isoWeek}`)
  const newestWeek = weekOrder[0]

  const issues: OpsIssue[] = []
  for (const [key, entry] of byKey) {
    const occurrences = [...entry.occurrences].sort(
      (a, b) => b.year - a.year || b.isoWeek - a.isoWeek,
    )
    const seen = new Set(occurrences.map((o) => `${o.year}-${o.isoWeek}`))

    let streak = 0
    for (const w of weekOrder) {
      if (!seen.has(w)) break
      streak++
    }

    const latest = occurrences[0]
    issues.push({
      key,
      source: entry.source,
      location: entry.location,
      occurrences,
      firstSeen: occurrences[occurrences.length - 1],
      latest,
      weeks: seen.size,
      streak,
      open: seen.has(newestWeek) && latest.carryStatus !== "resolved",
      resolvedIn: latest.carryStatus === "resolved" ? latest : null,
      adminStatus: null,
      adminNote: null,
      adminStatusWeek: null,
      reopened: false,
      actionable: seen.has(newestWeek) && latest.carryStatus !== "resolved",
    })
  }

  return sortIssues(issues, gradeRank)
}

function sortIssues(issues: OpsIssue[], rank: (i: OpsIssue) => number): OpsIssue[] {
  return [...issues].sort(
    (a, b) =>
      Number(b.reopened) - Number(a.reopened) ||
      Number(b.actionable) - Number(a.actionable) ||
      Number(b.open) - Number(a.open) ||
      b.streak - a.streak ||
      rank(a) - rank(b) ||
      b.weeks - a.weeks,
  )
}

const GRADE_RANK: Record<string, number> = {
  critical: 0,
  high: 0,
  warning: 1,
  medium: 1,
  info: 2,
  low: 2,
}
const gradeRank = (i: OpsIssue) => GRADE_RANK[i.latest.grade] ?? 3

/**
 * Layer the operator's verdicts onto the derived issues.
 *
 * An issue the operator marked done or ignored drops out of the actionable list
 * — unless a week later than their verdict raised it again, which is the case
 * worth surfacing loudest: the fix did not hold.
 */
export function applyIssueStates(issues: OpsIssue[], states: Map<string, IssueState>): OpsIssue[] {
  const merged = issues.map((issue) => {
    const state = states.get(issue.key)
    if (!state) return issue

    const closedByOperator = state.status === "done" || state.status === "ignored"
    const latestWeek = issue.latest.year * 100 + issue.latest.isoWeek
    const statusWeek = state.statusYear * 100 + state.statusIsoWeek
    const reopened = closedByOperator && latestWeek > statusWeek

    return {
      ...issue,
      adminStatus: state.status,
      adminNote: state.note,
      adminStatusWeek: { year: state.statusYear, isoWeek: state.statusIsoWeek },
      reopened,
      actionable: issue.open && (!closedByOperator || reopened),
    }
  })

  return sortIssues(merged, gradeRank)
}

export interface WeekTrendPoint {
  year: number
  isoWeek: number
  weekStart: string
  status: string | null
  dataQualityScore: number | null
  agentRuns: number | null
  totalSearches: number | null
  /** Distinct issues this week's record mentioned — not the same as issues open now. */
  issuesRaised: number
  /** Share of the week's ingested use cases that were archived, 0-100. */
  archivedRate: number | null
}

/**
 * Older weekly records wrote placeholder strings into numeric metrics — some
 * weeks carry `"DRY-RUN N/A"` where a count belongs. Anything that is not a
 * real number becomes null, which the strip already draws as "not written"
 * rather than as a NaN-height bar.
 */
function numberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/**
 * How much of the week's intake was thrown away. The quality gate tightened
 * through 2026 and this is the number that shows it, so it belongs on the strip
 * next to the metrics that explain it.
 */
function archivedRateOf(row: WeeklyAdminRow): number | null {
  const b = row.weekStats?.useCaseStatusBreakdown
  if (!b || !Number.isFinite(b.total) || b.total === 0) return null
  return Math.round((b.archived / b.total) * 100)
}

/** One point per week, oldest first, for the trend strip. */
export function deriveWeekTrend(rows: WeeklyAdminRow[], issues: OpsIssue[]): WeekTrendPoint[] {
  return [...rows]
    .sort((a, b) => a.year - b.year || a.isoWeek - b.isoWeek)
    .map((r) => ({
      year: r.year,
      isoWeek: r.isoWeek,
      weekStart: r.weekStart,
      status: r.systemHealth?.status ?? null,
      // The engine's score, not `agentMetrics.dataQualityScore` — that one is
      // the writer's own derivation and disagrees with the Data quality panel.
      dataQualityScore: numberOrNull(r.dataQuality?.score),
      agentRuns: numberOrNull(r.agentMetrics?.runsThisWeek),
      totalSearches: numberOrNull(r.searchToolUsage?.thisWeek?.totalSearches),
      issuesRaised: issues.filter((i) =>
        i.occurrences.some((o) => o.year === r.year && o.isoWeek === r.isoWeek),
      ).length,
      archivedRate: archivedRateOf(r),
    }))
}

export interface WeekDiff {
  appeared: OpsIssue[]
  resolved: OpsIssue[]
  carried: OpsIssue[]
}

/** What changed between the newest week on record and the one before it. */
export function deriveWeekDiff(rows: WeeklyAdminRow[], issues: OpsIssue[]): WeekDiff | null {
  if (rows.length < 2) return null
  const [newest, previous] = rows
  const inWeek = (i: OpsIssue, r: WeeklyAdminRow) =>
    i.occurrences.some((o) => o.year === r.year && o.isoWeek === r.isoWeek)

  return {
    appeared: issues.filter((i) => inWeek(i, newest) && !inWeek(i, previous)),
    resolved: issues.filter((i) => !inWeek(i, newest) && inWeek(i, previous)),
    carried: issues.filter((i) => inWeek(i, newest) && inWeek(i, previous)),
  }
}

export interface DraftIssue {
  source: IssueSource
  /** `location` for a warning, `file` for a next step. */
  location: string
  text: string
}

export interface DraftMatch {
  draft: DraftIssue
  /** The existing issue this draft continues, if any. */
  issueKey: string | null
  /** How many weeks that issue already spans. */
  weeks: number
  firstSeen: { year: number; isoWeek: number } | null
  adminStatus: IssueStatus | null
  adminNote: string | null
  /** True when the operator marked it done or won't-fix: the writer should not raise it again. */
  handled: boolean
}

/**
 * Match freshly drafted issues against the ones already on record.
 *
 * This exists so the weekly writer never has to reimplement the matching rules.
 * It sends what it is about to write, and gets back which of those the operator
 * has already dealt with. Keeping the rules in one place matters: they were
 * re-tuned twice against real data, and a second copy would drift from this one.
 */
export function matchDrafts(drafts: DraftIssue[], issues: OpsIssue[]): DraftMatch[] {
  return drafts.map((draft) => {
    const tokens = tokenize(draft.text)
    const location = normalizeLocation(draft.location)

    let best: OpsIssue | null = null
    let bestScore = SAME_ISSUE_THRESHOLD
    for (const issue of issues) {
      if (issue.source !== draft.source) continue
      if (normalizeLocation(issue.location) !== location) continue
      const score = Math.max(...issue.occurrences.map((o) => jaccard(tokens, tokenize(o.text))))
      if (score >= bestScore) {
        best = issue
        bestScore = score
      }
    }

    if (!best) {
      return {
        draft,
        issueKey: null,
        weeks: 0,
        firstSeen: null,
        adminStatus: null,
        adminNote: null,
        handled: false,
      }
    }

    return {
      draft,
      issueKey: best.key,
      weeks: best.weeks,
      firstSeen: { year: best.firstSeen.year, isoWeek: best.firstSeen.isoWeek },
      adminStatus: best.adminStatus,
      adminNote: best.adminNote,
      handled: best.adminStatus === "done" || best.adminStatus === "ignored",
    }
  })
}

/**
 * Locate the issue a rendered week-panel card belongs to.
 *
 * The week view renders the raw arrays out of the row, so a card there has no
 * issue identity of its own. Every occurrence was built from exactly these
 * strings, so an exact lookup finds it — no fuzzy matching needed here, that
 * work already happened when the issues were derived.
 */
export function occurrenceKey(
  year: number,
  isoWeek: number,
  source: IssueSource,
  text: string,
): string {
  return `${year}|${isoWeek}|${source}|${text}`
}

export function buildOccurrenceIndex(issues: OpsIssue[]): Map<string, OpsIssue> {
  const index = new Map<string, OpsIssue>()
  for (const issue of issues) {
    for (const o of issue.occurrences) {
      index.set(occurrenceKey(o.year, o.isoWeek, issue.source, o.text), issue)
    }
  }
  return index
}
