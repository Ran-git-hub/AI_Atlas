// Static checks for bugs this codebase has shipped that raised no error and
// returned plausible output. Runs before every build (npm "prebuild").
//
// 1. A cached reader called from inside another unstable_cache callback, at any
//    depth. Next skips the inner cache when nested, so the inner read hits
//    Supabase on every outer miss while looking cached (PR #43).
// 2. A paged Supabase read (.range) in a function that never calls .order.
//    Postgres gives no row order without one, so pages can repeat or skip rows.
//
// Usage: node scripts/check-guardrails.mjs [projectRoot]
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const root = path.resolve(process.argv[2] ?? ".")
const SOURCE_DIRS = ["app", "lib", "components"]
const SKIP_DIRS = new Set(["node_modules", ".next", path.join("components", "ui")])

function listSources(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name)
    if (SKIP_DIRS.has(rel) || SKIP_DIRS.has(entry.name)) continue
    if (entry.isDirectory()) listSources(rel, out)
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(rel)
  }
  return out
}

const files = SOURCE_DIRS.filter((d) => fs.existsSync(path.join(root, d))).flatMap((d) => listSources(d))
const sources = files.map((file) =>
  ts.createSourceFile(file, fs.readFileSync(path.join(root, file), "utf8"), ts.ScriptTarget.Latest, true),
)

const calleeName = (call) => {
  const e = call.expression
  if (ts.isIdentifier(e)) return e.text
  if (ts.isPropertyAccessExpression(e)) return e.name.text
  return null
}
const where = (node) => {
  const sf = node.getSourceFile()
  return `${sf.fileName}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1}`
}

// Top-level functions and consts by name. A name defined in several files maps
// to all of them; following every one can only over-report, never miss.
const defs = new Map()
const cachedNames = new Set()
const addDef = (name, node) => defs.set(name, [...(defs.get(name) ?? []), node])

for (const sf of sources) {
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name) addDef(stmt.name.text, stmt)
    if (!ts.isVariableStatement(stmt)) continue
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue
      addDef(decl.name.text, decl.initializer)
      if (ts.isCallExpression(decl.initializer) && calleeName(decl.initializer) === "unstable_cache") {
        cachedNames.add(decl.name.text)
      }
    }
  }
}

function calledNames(node) {
  const names = []
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const name = calleeName(n)
      if (name) names.push({ name, node: n })
    }
    // A function passed by reference, e.g. cache(loadX), is called later.
    if (ts.isIdentifier(n) && n.parent && ts.isCallExpression(n.parent) && n.parent.arguments.includes(n)) {
      names.push({ name: n.text, node: n })
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return names
}

const problems = []

// 1. Nested caches.
for (const sf of sources) {
  const visit = (node) => {
    if (ts.isCallExpression(node) && calleeName(node) === "unstable_cache" && node.arguments[0]) {
      const seen = new Set()
      const stack = [{ node: node.arguments[0], trail: [] }]
      while (stack.length > 0) {
        const { node: body, trail } = stack.pop()
        for (const { name, node: at } of calledNames(body)) {
          if (cachedNames.has(name)) {
            problems.push(
              `${where(node)} unstable_cache callback reaches cached ${name} ` +
                `(${[...trail, name].join(" -> ")}, at ${where(at)}). Nested caches are skipped; ` +
                `read the uncached function inside the callback instead.`,
            )
            continue
          }
          if (seen.has(name) || !defs.has(name)) continue
          seen.add(name)
          for (const def of defs.get(name)) stack.push({ node: def, trail: [...trail, name] })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

// 2. Paged reads without an order.
for (const sf of sources) {
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "range") {
      let fn = node.parent
      while (fn && !ts.isFunctionLike(fn)) fn = fn.parent
      if (fn && !/\.order\(/.test(fn.getText())) {
        problems.push(`${where(node)} .range() in a function with no .order(): pages can repeat or skip rows.`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

if (problems.length > 0) {
  console.error(`Guardrail check failed (${problems.length}):\n` + problems.map((p) => `  - ${p}`).join("\n"))
  process.exit(1)
}
console.log(`Guardrail check passed: ${files.length} files, ${cachedNames.size} cached readers.`)
