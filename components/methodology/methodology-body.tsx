"use client"

import { useEffect, useRef } from "react"

import "./methodology.css"
import "./methodology-redesign.css"
import { CANVAS_JS, DATA_JS } from "./methodology-data"
import { MARKUP } from "./methodology-markup"

/**
 * The methodology page body.
 *
 * The page's thesis is a funnel (about 11,400 found, 1,718 validated, 700 published), so
 * the page is that funnel: a fixed field of 1,140 dots - one per ten candidates - is
 * searched, filtered, recorded and reviewed as the reader scrolls through the four
 * stages, explains each later chapter beside its intro, and ends as the globe.
 *
 * The markup is static (methodology-markup.ts) and server-rendered; everything here
 * attaches behaviour to it on mount. Every DOM lookup is scoped to this component's
 * root, and every selector in the stylesheet is scoped under .mx (the blocks that keep
 * the earlier design sit in a nested .mth and use methodology.css).
 */

type Family = { k: string; n: string; d: string; pts: string[]; words?: [string, string][] }
type Source = { g: "stage" | "shared" | "build"; t: string; r: string; d: string; b: [string, string][] }
type Month = { m: string; pub: number; arc: number }
type Data = { FAMILIES: Family[]; SOURCES: Source[]; MONTHS: Month[] }

/* ---------- the particle field ---------- */
type RGB = readonly [number, number, number]
const C: Record<string, RGB> = {
  violet: [167, 139, 250],
  amber: [232, 163, 61],
  green: [67, 204, 147],
  rose: [242, 96, 122],
  cyan: [34, 211, 238],
  slate: [120, 146, 184],
}

type FieldInfo = { gates: string[]; fields: { n: string; ct: string }[]; docs: { t: string; r: string; g: number }[]; groups: string[] }

function startField(fx: HTMLCanvasElement, getScene: () => string, getClip: () => [number, number], signal: AbortSignal, info: FieldInfo) {
  const ctx = fx.getContext("2d")
  if (!ctx) return
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  /* one dot per ten candidates: 1,140 found, 172 validated, 70 published */
  const N = 1140
  const NP = 70
  const NV = 172
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const P = Array.from({ length: N }, () => ({ x: 0, y: 0, a: 0, r: 1, c: [167, 139, 250], u: rnd(), v: rnd(), w: rnd(), q: rnd() }))
  const o = { x: 0, y: 0, a: 0, r: 1, c: C.violet, sq: false }
  let W = 0
  let Hh = 0
  let top = 0
  let mobile = false
  let V = { x: 0, y: 0, w: 0, h: 0 }
  let snap = true
  let scene = ""
  let sceneAt = 0
  let raf = 0
  let lastMs = 0

  const size = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    Hh = window.innerHeight
    fx.width = Math.round(W * dpr)
    fx.height = Math.round(Hh * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    /* the app header plus this page's chapter bar */
    top = (document.getElementById("atlas-chrome")?.offsetHeight ?? 0) + 42
    mobile = W < 900
    V = mobile
      ? { x: W * 0.07, y: top + 22, w: W * 0.86, h: Hh * 0.32 }
      : { x: W * 0.55, y: top + (Hh - top) * 0.1, w: W * 0.38, h: (Hh - top) * 0.74 }
    snap = true
  }

  const grid = () => {
    const cols = mobile ? 22 : 14
    const cell = Math.min((V.w * 0.94) / cols, mobile ? 13 : 23)
    return { cols, cell, gx: V.x + (V.w - cols * cell) / 2, gy: V.y + V.h * 0.03, rows: Math.ceil(NV / cols) }
  }
  const blocks = () => {
    const pc = Math.min((V.w * 0.44) / 10, mobile ? 14 : 25)
    const ac = Math.min((V.w * 0.44) / 12, mobile ? 10 : 17)
    return { pc, ac, px: V.x + V.w - pc * 10, ax: V.x, y: V.y + V.h * 0.05 }
  }

  const gateAt = (k: number) => 0.13 + 0.17 * k
  const recLayout = () => {
    const lw = mobile ? 158 : 164
    return { x0: V.x + lw, w: V.w - lw, rh: Math.min(V.h / Math.max(1, info.fields.length), 36) }
  }
  /* where the check has got to: 10s for a record that passes, 10s for one that fails */
  const recState = (t: number) => {
    const R = info.fields.length
    const step = 0.4
    const second = t % 20 >= 10
    const tt = t % 10
    const failRow = Math.max(0, info.fields.findIndex((f) => f.n === "company_id"))
    const stop = second ? failRow + 1 : R
    const done = tt >= stop * step
    return {
      row: Math.min(stop, Math.floor(tt / step)),
      frac: (tt % step) / step,
      done,
      fail: second ? failRow : -1,
      drop: Math.max(0, tt - stop * step - 2.2),
      rest: tt > 9.3,
    }
  }
  /* 0 flowing on the primary tool, 1 silent, 2 flowing on the fallback */
  const resPhase = (t: number) => {
    const c = t % 13
    return c < 4 ? 0 : c < 7 ? 1 : 2
  }
  const knowLayout = () => {
    const rows = info.docs.length + (mobile ? 0 : info.groups.length)
    const rh = V.h / Math.max(1, rows)
    const ys: number[] = []
    const heads: number[] = []
    let r = 0
    info.docs.forEach((d, i) => {
      if (!mobile && (i === 0 || info.docs[i - 1].g !== d.g)) heads[d.g] = V.y + (r++ + 0.5) * rh
      ys.push(V.y + (r++ + 0.5) * rh)
    })
    return { ys, heads, rad: Math.min(9, rh * 0.3) }
  }

  const target = (i: number, p: (typeof P)[number], sc: string, t: number) => {
    const g = i < NP ? 0 : i < NV ? 1 : 2
    o.sq = false
    if (sc === "cloud" || sc === "dust") {
      o.x = W * (0.02 + 0.96 * p.u) + Math.sin(t * 0.21 + p.q * 6.283) * 16
      o.y = top + (Hh - top) * p.v + Math.cos(t * 0.17 + p.w * 6.283) * 16
      o.a = sc === "cloud" ? 0.2 + 0.62 * p.w : 0.06 + 0.12 * p.w
      o.r = 0.7 + 1.5 * p.q
      o.c = C.violet
      return
    }
    if (sc === "bar") {
      /* five tests in a row: a candidate that fails one falls out there, and only
         what clears all five comes out the far side */
      const f = (p.u + t * 0.05 * (0.6 + 0.5 * p.q)) % 1
      const edge = Math.min(1, f * 12, (1 - f) * 12)
      const by = V.y + V.h * 0.3 + (p.v - 0.5) * V.h * 0.2
      o.x = V.x + f * V.w
      o.y = by
      o.r = 1.2 + 0.9 * p.q
      const failAt = gateAt(i % 5)
      if (g === 2 && f > failAt) {
        const d = f - failAt
        o.y = by + V.h * 0.12 + Math.sqrt(d) * V.h * 0.95
        o.a = Math.max(0, 0.85 - d * 1.9)
        o.c = C.rose
      } else {
        o.a = (g === 2 ? 0.7 : 0.95) * edge
        o.c = f > gateAt(4) ? C.green : C.violet
        if (g !== 2) o.r = 2.1
      }
      return
    }
    if (sc === "rules") {
      /* one record, field by field: each row is a field being checked against its
         limit. The first record clears all of them; the second fails one and is dropped */
      const R = Math.max(1, info.fields.length)
      const L = recLayout()
      const row = i % R
      const k = Math.floor(i / R)
      const per = Math.ceil(N / R)
      const s = recState(t)
      o.sq = true
      o.r = mobile ? 1 : 1.5
      o.x = L.x0 + ((k + 0.5) / per) * L.w
      o.y = V.y + (row + 0.5) * L.rh
      if (s.done) {
        o.a = s.fail < 0 ? 0.9 : row === s.fail ? 1 : 0.1
        o.c = s.fail < 0 ? C.green : row === s.fail ? C.rose : C.slate
        if (s.fail >= 0 && s.drop > 0) {
          o.y += s.drop * s.drop * 90
          o.a *= Math.max(0, 1 - s.drop * 0.9)
        }
      } else if (row < s.row || (row === s.row && (k + 0.5) / per < s.frac)) {
        o.a = 0.85
        o.c = C.cyan
      } else {
        o.a = 0.22
        o.c = C.slate
      }
      return
    }
    if (sc === "res") {
      /* the incident that shaped the rules: a tool goes quiet without an error,
         the silence is treated as a failure, and the run moves to another tool */
      const ph = resPhase(t)
      const f = (p.u + t * 0.06 * (0.6 + 0.5 * p.q)) % 1
      const edge = Math.min(1, f * 12, (1 - f) * 12)
      o.x = V.x + f * V.w
      o.r = 1.1 + 1.1 * p.q
      if (ph === 2) {
        o.y = V.y + V.h * 0.66 + (p.v - 0.5) * V.h * 0.13
        o.a = 0.8 * edge
        o.c = C.cyan
      } else {
        o.y = V.y + V.h * 0.26 + (p.v - 0.5) * V.h * 0.13
        o.a = ph === 0 ? 0.75 * edge : 0.03
        o.c = C.violet
      }
      return
    }
    if (sc === "know") {
      /* thirteen documents, each owning one kind of decision; they light in turn */
      const D = info.docs.length || 1
      const d = i % D
      const K = knowLayout()
      const on = d === Math.floor(t / 1.0) % D
      const ang = p.v * 6.283 + t * (0.25 + 0.4 * p.q) * (d % 2 ? 1 : -1)
      const rr = Math.sqrt(p.u) * (on ? K.rad * 1.5 : K.rad)
      o.x = V.x + K.rad * 1.6 + Math.cos(ang) * rr
      o.y = K.ys[d] + Math.sin(ang) * rr
      o.a = on ? 0.95 : 0.32
      o.r = on ? 1.3 : 0.9
      o.c = [C.cyan, C.green, C.violet][info.docs[d]?.g ?? 0]
      return
    }
    if (sc === "s1") {
      const f = (p.u + t * 0.035 * (0.5 + p.q)) % 1
      o.x = V.x + f * V.w
      o.y = V.y + V.h * (0.2 + 0.3 * (i % 3)) + (p.v - 0.5) * V.h * 0.15 + Math.sin(t * 1.3 + p.w * 9) * 2
      o.a = Math.sin(Math.PI * f) * 0.85
      o.r = 1 + 1.2 * p.q
      o.c = C.violet
      return
    }
    if (sc === "globe") {
      const j = (i * 397) % N
      const phi = Math.acos(1 - (2 * (j + 0.5)) / N)
      const th = Math.PI * (1 + Math.sqrt(5)) * j + t * 0.16
      const R = mobile ? V.h * 0.52 : Math.min(V.w, V.h) * 0.52
      const y = Math.cos(phi)
      const z = Math.sin(phi) * Math.sin(th)
      const y2 = y * 0.93 - z * 0.37
      const d = (y * 0.37 + z * 0.93 + 1) / 2
      o.x = V.x + V.w / 2 + Math.sin(phi) * Math.cos(th) * R
      o.y = (mobile ? V.y + V.h / 2 : top + (Hh - top) / 2) + y2 * R
      if (g === 0) {
        o.a = 0.2 + 0.8 * d
        o.r = 1.5 + 2 * d
        o.c = C.green
      } else {
        o.a = 0.05 + 0.32 * d
        o.r = 0.7 + 0.8 * d
        o.c = C.slate
      }
      return
    }
    if (g === 2) {
      /* the discard pile: most of what a day finds */
      const hh = Math.pow(Math.sin(Math.PI * p.u), 0.7) * V.h * 0.24
      o.x = V.x + V.w * 0.58 * p.u
      o.y = V.y + V.h - p.v * hh
      o.a = sc === "s2" ? 0.62 : sc === "review" ? 0.1 : 0.2
      o.r = 1.2
      o.c = C.rose
      return
    }
    if (sc === "s2") {
      o.x = V.x + V.w * (0.7 + 0.28 * p.u) + Math.sin(t * 0.8 + p.q * 6) * 3
      o.y = V.y + V.h * (0.08 + 0.5 * p.v) + Math.cos(t * 0.7 + p.w * 6) * 3
      o.a = 0.95
      o.r = 2.3
      o.c = C.amber
      return
    }
    o.sq = true
    if (sc === "review") {
      const b = blocks()
      if (g === 0) {
        o.x = b.px + ((i % 10) + 0.5) * b.pc
        o.y = b.y + (Math.floor(i / 10) + 0.5) * b.pc
        o.a = 1
        o.r = b.pc * 0.33
        o.c = C.green
      } else {
        const k = i - NP
        o.x = b.ax + ((k % 12) + 0.5) * b.ac
        o.y = b.y + (Math.floor(k / 12) + 0.5) * b.ac
        o.a = 0.4
        o.r = b.ac * 0.3
        o.c = C.rose
      }
      return
    }
    const gr = grid()
    o.x = gr.gx + ((i % gr.cols) + 0.5) * gr.cell
    o.y = gr.gy + (Math.floor(i / gr.cols) + 0.5) * gr.cell
    o.r = gr.cell * 0.3
    if (sc === "s4") {
      const sx = gr.gx + ((t * 0.22) % 1.25) * gr.cols * gr.cell
      const near = Math.abs(o.x - sx) < gr.cell * 1.2
      o.a = near ? 1 : 0.5
      o.c = near ? C.cyan : C.green
    } else {
      o.a = 0.9
      o.c = C.green
    }
  }

  const label = (text: string, x: number, y: number, c: RGB, a: number, align: CanvasTextAlign = "left") => {
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`
    ctx.textAlign = align
    ctx.fillText(text, x, y)
  }
  const extras = (sc: string, t: number, a: number) => {
    ctx.font = '500 11px "Geist Mono", ui-monospace, Menlo, monospace'
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1.6px"
    const mono = (px = 11) => {
      ctx.font = `500 ${px}px "Geist Mono", ui-monospace, Menlo, monospace`
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1.4px"
    }
    const sans = (px: number, w = 500) => {
      ctx.font = `${w} ${px}px "Geist", system-ui, sans-serif`
      if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px"
    }
    if (sc === "bar") {
      const y1 = V.y + V.h * 0.14
      const y2 = V.y + V.h * 0.46
      mono(mobile ? 10 : 11)
      info.gates.slice(0, 5).forEach((gname, k) => {
        const x = V.x + gateAt(k) * V.w
        ctx.strokeStyle = `rgba(232,163,61,${(a * 0.6).toFixed(3)})`
        ctx.setLineDash([3, 5])
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
        ctx.setLineDash([])
        label("0" + (k + 1), x, y1 - 9, C.amber, a, "center")
        ctx.save()
        ctx.translate(x + 4, y2 + 12)
        ctx.rotate(Math.PI / 2)
        label(gname, 0, 0, C.amber, a * 0.95)
        ctx.restore()
      })
      label("QUALIFIES", V.x + V.w, V.y + V.h * 0.035, C.green, a, "right")
      label("REJECTED, WITH A REASON", V.x + V.w, V.y + V.h + (mobile ? 22 : -2), C.rose, a, "right")
    } else if (sc === "rules") {
      const L = recLayout()
      const s = recState(t)
      const R = info.fields.length
      mono(mobile ? 10 : 11)
      info.fields.forEach((f, r) => {
        const y = V.y + (r + 0.5) * L.rh + 4
        const failed = s.done && r === s.fail
        const passed = s.fail < 0 ? s.done || r < s.row : r < s.row && r !== s.fail
        const fade = s.done && s.fail >= 0 && !failed ? 0.3 : 1
        label(f.n.toUpperCase(), V.x, y, failed ? C.rose : s.done && s.fail < 0 ? C.green : passed ? C.cyan : C.slate, a * fade * (passed || failed || r === s.row ? 1 : 0.6))
      })
      const by = V.y + R * L.rh + 26
      if (!s.rest) {
        if (!s.done) label("CHECKING FIELD " + String(Math.min(R, s.row + 1)).padStart(2, "0") + " / " + R, L.x0, by, C.slate, a)
        else if (s.fail < 0) label("ADMITTED \u00b7 STATUS PENDING", L.x0, by, C.green, a)
        else label("REJECTED \u00b7 " + info.fields[s.fail].n.toUpperCase() + ": " + info.fields[s.fail].ct.toUpperCase(), L.x0, by, C.rose, a)
      }
    } else if (sc === "res") {
      const ph = resPhase(t)
      const c = t % 13
      const yp = V.y + V.h * 0.26
      const yf = V.y + V.h * 0.66
      const hh = V.h * 0.1
      const flagged = ph === 1 && c > 5.4
      mono(mobile ? 10 : 11)
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = flagged ? `rgba(242,96,122,${(a * 0.9).toFixed(3)})` : `rgba(120,146,184,${(a * 0.35).toFixed(3)})`
      ctx.strokeRect(V.x, yp - hh, V.w, hh * 2)
      ctx.strokeStyle = ph === 2 ? `rgba(34,211,238,${(a * 0.7).toFixed(3)})` : `rgba(120,146,184,${(a * 0.25).toFixed(3)})`
      ctx.strokeRect(V.x, yf - hh, V.w, hh * 2)
      ctx.setLineDash([])
      label("PRIMARY SEARCH TOOL", V.x, yp - hh - 10, flagged ? C.rose : C.violet, a)
      label("FALLBACK TOOL", V.x, yf - hh - 10, ph === 2 ? C.cyan : C.slate, a * (ph === 2 ? 1 : 0.7))
      if (ph === 0) label("RESULTS RETURNED", V.x + V.w, yp + hh + 18, C.violet, a * 0.9, "right")
      else if (ph === 1 && !flagged) label("0 RESULTS \u00b7 NO ERROR", V.x + V.w, yp + hh + 18, C.slate, a, "right")
      else if (flagged) label("EMPTY \u2192 TREATED AS A FAILURE", V.x + V.w, yp + hh + 18, C.rose, a, "right")
      else {
        label("EMPTY \u2192 TREATED AS A FAILURE", V.x + V.w, yp + hh + 18, C.rose, a * 0.6, "right")
        label("SUBSTITUTION RECORDED", V.x + V.w, yf + hh + 18, C.cyan, a, "right")
      }
    } else if (sc === "know") {
      const K = knowLayout()
      const D = info.docs.length || 1
      const onI = Math.floor(t / 1.0) % D
      const tx = V.x + K.rad * 3.2 + 12
      mono(10)
      info.groups.forEach((gname, gi) => {
        if (K.heads[gi] != null) label(gname, V.x, K.heads[gi] + 4, C.slate, a * 0.85)
      })
      info.docs.forEach((d, i) => {
        const on = i === onI
        sans(mobile ? 12 : 14, on ? 600 : 500)
        label(d.t, tx, K.ys[i] + 5, on ? ([230, 237, 247] as RGB) : C.slate, a * (on ? 1 : 0.8))
        if (on && !mobile) {
          const w = ctx.measureText(d.t).width
          mono(10)
          if (tx + w + 16 + ctx.measureText(d.r.toUpperCase()).width < V.x + V.w + 30) label(d.r.toUpperCase(), tx + w + 16, K.ys[i] + 4, [C.cyan, C.green, C.violet][d.g], a)
        }
      })
      mono(11)
    } else if (sc === "s1") {
      ;["PROCESS", "INDUSTRY", "GEOGRAPHY"].forEach((s, k) => label(s, V.x, V.y + V.h * (0.2 + 0.3 * k) - V.h * 0.1, C.violet, a * 0.9))
    } else if (sc === "s2") {
      const gx = V.x + V.w * 0.64
      ctx.strokeStyle = `rgba(232,163,61,${(a * 0.55).toFixed(3)})`
      ctx.setLineDash([4, 6])
      ctx.beginPath()
      ctx.moveTo(gx, V.y)
      ctx.lineTo(gx, V.y + V.h * 0.72)
      ctx.stroke()
      ctx.setLineDash([])
      label("THE BAR", gx, V.y - 10, C.amber, a, "center")
      label("85% DISCARDED", V.x, V.y + V.h * 0.7, C.rose, a)
      label("15% SURVIVE", V.x + V.w, V.y + V.h * 0.66, C.amber, a, "right")
    } else if (sc === "s3" || sc === "s4") {
      const gr = grid()
      const by = gr.gy + gr.rows * gr.cell + 24
      if (sc === "s4") {
        const sx = gr.gx + ((t * 0.22) % 1.25) * gr.cols * gr.cell
        if (sx < gr.gx + gr.cols * gr.cell) {
          ctx.fillStyle = `rgba(34,211,238,${(a * 0.5).toFixed(3)})`
          ctx.fillRect(sx, gr.gy - 8, 1.5, gr.rows * gr.cell + 16)
        }
        label("READ, NEVER RE-JUDGED", gr.gx, by, C.cyan, a)
      } else {
        label("RECORDED WHOLE · AWAITING REVIEW", gr.gx, by, C.green, a)
      }
    } else if (sc === "review") {
      const b = blocks()
      label("ARCHIVED", b.ax, b.y + 9 * b.ac + 22, C.rose, a)
      label("PUBLISHED", b.px, b.y + 7 * b.pc + 22, C.green, a)
    }
  }

  const frame = (ms: number) => {
    const t = reduce ? 0 : ms / 1000
    const sc = getScene()
    if (sc !== scene) {
      scene = sc
      sceneAt = ms
    }
    ctx.clearRect(0, 0, W, Hh)
    /* a diagram belongs to its own chapter intro: it is cut off where the
       full-width content above or below it begins, with a soft edge */
    const viz = sc !== "cloud" && sc !== "dust"
    const [ct, cb] = getClip()
    if (viz) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, ct, W, Math.max(0, cb - ct))
      ctx.clip()
    }
    const jump = snap || reduce
    /* time-based easing, so a throttled or slow frame rate reaches the same place */
    const dt = Math.min(1, Math.max(0, (ms - lastMs) / 1000))
    lastMs = ms
    const ka = 1 - Math.exp(-dt * 5)
    for (let i = 0; i < N; i++) {
      const p = P[i]
      target(i, p, sc, t)
      if (jump) {
        p.x = o.x
        p.y = o.y
        p.a = o.a
        p.r = o.r
        p.c[0] = o.c[0]
        p.c[1] = o.c[1]
        p.c[2] = o.c[2]
      } else {
        const k = 1 - Math.exp(-dt * (2.6 + 4 * p.q))
        const dx = o.x - p.x
        if ((sc === "s1" || sc === "bar" || sc === "res") && dx < -V.w * 0.5) {
          /* the stream wraps: re-enter on the left instead of flying back across */
          p.x = o.x
          p.y = o.y
          p.a = 0
        } else {
          p.x += dx * k
          p.y += (o.y - p.y) * k
        }
        p.a += (o.a - p.a) * ka
        p.r += (o.r - p.r) * ka
        p.c[0] += (o.c[0] - p.c[0]) * ka
        p.c[1] += (o.c[1] - p.c[1]) * ka
        p.c[2] += (o.c[2] - p.c[2]) * ka
      }
      if (p.a < 0.012) continue
      ctx.fillStyle = `rgba(${p.c[0] | 0},${p.c[1] | 0},${p.c[2] | 0},${p.a.toFixed(3)})`
      if (o.sq) {
        ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, 6.2832)
        ctx.fill()
      }
    }
    snap = false
    extras(sc, t, reduce ? 1 : Math.max(0, Math.min(1, (ms - sceneAt - 500) / 600)))
    if (viz) {
      ctx.globalCompositeOperation = "destination-out"
      const soft = (y0: number, y1: number) => {
        const gr = ctx.createLinearGradient(0, y0, 0, y1)
        gr.addColorStop(0, "rgba(0,0,0,1)")
        gr.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = gr
        ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0))
      }
      if (ct > top + 1) soft(ct, ct + 48)
      if (cb < Hh - 1) soft(cb, cb - 48)
      ctx.globalCompositeOperation = "source-over"
      ctx.restore()
    }
    raf = requestAnimationFrame(frame)
  }

  size()
  window.addEventListener("resize", size, { signal })
  signal.addEventListener("abort", () => cancelAnimationFrame(raf))
  raf = requestAnimationFrame(frame)
}

/* ---------- incidents: each card plays its own failure, then its fix ---------- */
type MiniDraw = (c: CanvasRenderingContext2D, w: number, h: number, t: number, fixed: boolean) => string
const rgba = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mDot = (c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => {
  c.fillStyle = fill
  c.beginPath()
  c.arc(x, y, r, 0, 6.2832)
  c.fill()
}
const mLane = (c: CanvasRenderingContext2D, x0: number, x1: number, y: number, col = "rgba(120,146,184,.3)") => {
  c.strokeStyle = col
  c.lineWidth = 1
  c.setLineDash([2, 4])
  c.beginPath()
  c.moveTo(x0, y)
  c.lineTo(x1, y)
  c.stroke()
  c.setLineDash([])
}
const mStream = (c: CanvasRenderingContext2D, w: number, y: number, t: number, n: number, col: RGB, alpha = 1, x0 = 0) => {
  for (let k = 0; k < n; k++) {
    const f = (t * 0.3 + k / n) % 1
    mDot(c, x0 + f * (w - x0), y + (((k * 7) % 3) - 1) * 2.5, 2.2, rgba(col, alpha * Math.min(1, f * 8, (1 - f) * 8)))
  }
}
const MINI: MiniDraw[] = [
  /* the same fixed queries, finding only what is already on record */
  (c, w, h, t, fixed) => {
    const wall = w * 0.74
    c.fillStyle = "rgba(120,146,184,.4)"
    c.fillRect(wall, 4, 1.5, h - 8)
    for (let k = 0; k < 10; k++) {
      const p = t * 0.3 + k / 10
      const f = p % 1
      const y = h / 2 + (fixed ? ((k * 7 + Math.floor(p) * 13) % 5) - 2 : (k % 3) - 1) * 7
      const in_ = f * w > wall
      mDot(c, f * w, y, 2.4, in_ ? rgba(fixed ? C.green : C.slate, fixed ? 0.95 : 0.4) : rgba(C.violet, Math.min(1, f * 8)))
    }
    return fixed ? "QUERIES ROTATE DAILY" : "ALL ALREADY ON RECORD"
  },
  /* a tool that goes quiet without an error */
  (c, w, h, t, fixed) => {
    const y1 = h / 2 - 10
    const y2 = h / 2 + 10
    mLane(c, 0, w, y1)
    mLane(c, 0, w, y2, fixed ? rgba(C.cyan, 0.5) : undefined)
    if (fixed) mStream(c, w, y2, t, 9, C.cyan)
    else mStream(c, w, y1, t, 9, C.violet, Math.max(0, 1 - (t % 5) / 1.6))
    return fixed ? "EMPTY \u2192 FALLBACK TOOL" : "0 RESULTS \u00b7 NO ERROR"
  },
  /* three tools, only the first ever reached */
  (c, w, h, t, fixed) => {
    c.font = '500 10px "Geist Mono", ui-monospace, monospace'
    ;[0, 1, 2].forEach((k) => {
      const y = h / 2 + (k - 1) * 16
      c.fillStyle = rgba(C.slate, 0.9)
      c.fillText(String(k + 1), 0, y + 3.5)
      mLane(c, 14, w, y)
      if (k === 0 || fixed) mStream(c, w, y, t + k * 0.37, k === 2 ? 9 : 6, k === 2 ? C.green : C.violet, 1, 14)
    })
    return fixed ? "EVERY TOOL IN USE" : "TOOL 3 \u00b7 NEVER CALLED"
  },
  /* untranslated records passing as translated ones */
  (c, w, h, t, fixed) => {
    const gate = w * 0.58
    if (fixed) {
      c.fillStyle = rgba(C.cyan, 0.8)
      c.fillRect(gate, 4, 1.5, h - 8)
    }
    for (let k = 0; k < 10; k++) {
      const f = (t * 0.22 + k / 10) % 1
      const bad = k % 4 === 1
      const x = f * w
      let y = h / 2
      let a = Math.min(1, f * 8, (1 - f) * 8)
      if (bad && fixed && x > gate) {
        y += (x - gate) * 0.9
        a *= Math.max(0, 1 - (x - gate) / 40)
      }
      if (bad) {
        c.strokeStyle = rgba(C.rose, a)
        c.lineWidth = 1.5
        c.strokeRect(x - 4, y - 4, 8, 8)
      } else {
        c.fillStyle = rgba(C.green, a * 0.9)
        c.fillRect(x - 4, y - 4, 8, 8)
      }
    }
    return fixed ? "CHECKED BEFORE WRITING" : "UNTRANSLATED \u00b7 WRITTEN ANYWAY"
  },
  /* seventeen vendor pages among a day's records */
  (c, w, h, t, fixed) => {
    const cols = 16
    const cell = Math.min(11, w / cols)
    const shown = fixed ? 17 : Math.min(17, Math.floor((t % 8) * 5))
    for (let k = 0; k < 48; k++) {
      const x = (k % cols) * cell
      const y = h / 2 - cell * 1.5 + Math.floor(k / cols) * cell
      const vendor = (k * 11) % 48 < 17
      if (vendor && fixed) {
        c.strokeStyle = rgba(C.rose, 0.35)
        c.lineWidth = 1
        c.strokeRect(x + 1.5, y + 1.5, cell - 5, cell - 5)
      } else {
        c.fillStyle = vendor && (k * 11) % 48 < shown ? rgba(C.rose, 0.95) : rgba(C.green, 0.8)
        c.fillRect(x + 1, y + 1, cell - 4, cell - 4)
      }
    }
    return fixed ? "17 SCREENED OUT" : shown + " VENDOR PAGES RECORDED"
  },
  /* a count that stopped at the first page */
  (c, w, h, t, fixed) => {
    const cols = 18
    const cell = Math.min(12, w / cols)
    const page = 9
    const head = fixed ? Math.min(36, Math.floor((t % 6) * 14)) : Math.min(page, Math.floor((t % 6) * 6))
    for (let k = 0; k < 36; k++) {
      const x = (k % cols) * cell + cell / 2
      const y = h / 2 - cell / 2 + Math.floor(k / cols) * cell
      mDot(c, x, y, 2.6, k < head ? rgba(fixed ? C.green : C.amber, 0.95) : rgba(C.slate, 0.3))
    }
    if (!fixed) {
      c.strokeStyle = rgba(C.amber, 0.7)
      c.lineWidth = 1
      c.strokeRect(0.5, h / 2 - cell - 1, page * cell, cell + 2)
    }
    return fixed ? "COUNTED AT THE SOURCE" : "COUNT STOPPED AT PAGE ONE"
  },
]

function startIncidents(root: HTMLElement, signal: AbortSignal, still: boolean) {
  const grid = root.querySelector<HTMLElement>(".mx-inc")
  if (!grid) return
  const cards = Array.from(grid.querySelectorAll<HTMLElement>("article"))
  const began: number[] = cards.map(() => -1)
  const timers: number[] = []
  const paint = (i: number, now: number) => {
    const cv = cards[i].querySelector("canvas")
    const c = cv?.getContext("2d")
    if (!cv || !c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = cv.clientWidth
    const h = cv.clientHeight
    if (cv.width !== Math.round(w * dpr)) {
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, w, h)
    if (began[i] < 0) return
    const fixed = cards[i].dataset.s === "4"
    const text = (MINI[i] || MINI[0])(c, w, h - 18, still ? 3 : (now - began[i]) / 1000, fixed)
    c.font = '500 10px "Geist Mono", ui-monospace, monospace'
    if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1.2px"
    c.fillStyle = rgba(fixed ? C.cyan : C.rose, 0.95)
    c.fillText(text, 0, h - 3)
    if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px"
  }
  const play = (i: number) => {
    began[i] = performance.now()
    cards[i].dataset.s = "1"
    ;[1300, 2600, 3500].forEach((ms, k) => timers.push(window.setTimeout(() => { cards[i].dataset.s = String(k + 2) }, ms)))
  }
  if (still) {
    cards.forEach((card, i) => {
      card.dataset.s = "4"
      began[i] = 0
      paint(i, 0)
    })
    return
  }
  let visible = false
  let raf = 0
  let queued = 0
  const loop = (now: number) => {
    if (visible) cards.forEach((_, i) => paint(i, now))
    raf = requestAnimationFrame(loop)
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting }), { threshold: 0 })
  io.observe(grid)
  /* each card starts when it is actually on screen; cards that arrive together take turns */
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    cio.unobserve(e.target)
    const i = cards.indexOf(e.target as HTMLElement)
    const wait = Math.max(0, queued - performance.now())
    queued = performance.now() + wait + 1500
    timers.push(window.setTimeout(() => play(i), wait))
  }), { threshold: 0.3 })
  cards.forEach((card) => cio.observe(card))
  cards.forEach((card, i) => card.addEventListener("mouseenter", () => { if (card.dataset.s === "4") play(i) }, { signal }))
  raf = requestAnimationFrame(loop)
  signal.addEventListener("abort", () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    cio.disconnect()
    timers.forEach((id) => window.clearTimeout(id))
  })
}

function start(root: HTMLElement): () => void {
  const ac = new AbortController()
  const { signal } = ac
  const data = new Function(DATA_JS)() as Data
  const $ = <E extends HTMLElement = HTMLElement>(s: string) => root.querySelector<E>(s)
  const $$ = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s))
  const go = (id: string) => $("#sec-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  /* chapters: dots, progress, and which scene the field is in */
  const chapters = $$("[data-nav]")
  const scenes = $$("[data-scene]")
  const dots = $(".mx-bar-l") as HTMLElement
  const barN = $(".mx-bar-n b") as HTMLElement
  ;($(".mx-bar-n span") as HTMLElement).textContent = "/ " + String(chapters.length).padStart(2, "0")
  dots.innerHTML = chapters
    .map((c, i) => `<button data-i="${i}" style="--sc:${c.style.getPropertyValue("--sc") || "var(--cyan)"}">${c.dataset.nav}</button>`)
    .join("")
  let curCh = -1
  dots.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button")
    if (b) chapters[Number(b.dataset.i)].scrollIntoView({ behavior: "smooth", block: "start" })
  }, { signal })
  let scene = "cloud"
  const hud = $(".mx-hud") as HTMLElement
  const bar = $(".mx-prog i") as HTMLElement
  const HUD: Record<string, string> = { cloud: "", dust: "", s1: "found", s2: "val", s3: "val", s4: "val", review: "pub", globe: "pub" }
  let clip: [number, number] = [0, 100000]
  const fulls = $$(".mx-body, #sec-map, .mx-prin, .mx-hero")
  const onScroll = () => {
    let ct = 0
    let cb = window.innerHeight
    fulls.forEach((el) => {
      const fr = el.getBoundingClientRect()
      if (fr.bottom <= 0 || fr.top >= window.innerHeight) return
      if (fr.top < window.innerHeight * 0.5) ct = Math.max(ct, fr.bottom)
      else cb = Math.min(cb, fr.top)
    })
    clip = [ct, cb]
    const line = window.innerHeight * 0.58
    let cur = 0
    chapters.forEach((c, i) => {
      if (c.getBoundingClientRect().top <= line) cur = i
    })
    let sc = "cloud"
    scenes.forEach((c) => {
      if (c.getBoundingClientRect().top <= line) sc = c.dataset.scene || sc
    })
    scene = sc
    if (cur !== curCh) {
      curCh = cur
      barN.textContent = String(cur + 1).padStart(2, "0")
      Array.from(dots.children).forEach((d, i) => {
        d.toggleAttribute("aria-current", i === cur)
        d.classList.toggle("done", i < cur)
      })
      /* the list scrolls sideways on narrow screens; keep the current chapter in view */
      const b = dots.children[cur] as HTMLElement
      dots.scrollTo({ left: Math.max(0, b.offsetLeft - (dots.clientWidth - b.offsetWidth) / 2), behavior: "smooth" })
    }
    hud.dataset.on = HUD[scene] || ""
    const r = root.getBoundingClientRect()
    bar.style.width = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight))) * 100 + "%"
  }
  const setChrome = () => root.style.setProperty("--chrome", (document.getElementById("atlas-chrome")?.offsetHeight ?? 0) + "px")
  setChrome()
  window.addEventListener("resize", setChrome, { signal })
  window.addEventListener("scroll", onScroll, { passive: true, signal })
  window.addEventListener("resize", onScroll, { signal })
  onScroll()

  startField($<HTMLCanvasElement>(".mx-fx") as HTMLCanvasElement, () => scene, () => clip, signal, {
    gates: $$(".mx-qual li b").map((b) => (b.textContent || "").trim().toUpperCase()),
    fields: $$("#mxRec .rr:not(.j)").map((r) => ({ n: r.querySelector(".nm")?.textContent || "", ct: r.querySelector(".ct")?.textContent || "" })),
    docs: (["stage", "shared", "build"] as const).flatMap((g, gi) => data.SOURCES.filter((s) => s.g === g).map((s) => ({ t: s.t, r: s.r, g: gi }))),
    groups: $$(".mx-know .kg > .mx-k").map((k) => (k.firstChild?.textContent || "").trim().toUpperCase()),
  })

  /* blocks rise into place as they are reached, and figures count up once */
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!still && "IntersectionObserver" in window) {
    const count = (b: HTMLElement) => {
      const m = (b.textContent || "").match(/^(\D*)([\d,]+)(\D*)$/)
      if (!m) return
      const end = Number(m[2].replace(/,/g, ""))
      if (!end) return
      const t0 = performance.now()
      const step = (now: number) => {
        const f = Math.min(1, (now - t0) / 1100)
        b.textContent = m[1] + Math.round(end * (1 - Math.pow(1 - f, 3))).toLocaleString("en-US") + m[3]
        if (f < 1 && !signal.aborted) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          io.unobserve(el)
          el.classList.add("in")
          if (el.matches(".mx-figs > div, .mx-fun > div")) el.querySelectorAll<HTMLElement>("b").forEach(count)
          if (el.matches(".mx-months")) el.querySelectorAll<HTMLElement>(".tot").forEach(count)
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    )
    $$(
      ".mx-sub, .mx-chh-c > *, .mx-two > *, .mx-wrap > .mx-p, .mx-qual li, .mx-fam, .mx-dims .dim, .mx-embed, .mx-rec, .mx-states .st, .mx-states .fork, .mx-stand > div, .mx-know .kg, .mx-prin-g article, .mx-months, .mx-figs > div, .mx-fun > div, .mx-duty, .mx-gate-g > div, .mx-decs details, .mx-close, .mx-stage h2, .mx-stage .mx-lede, .mx-num",
    ).forEach((el) => {
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.tagName === el.tagName) : []
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 7) * 70 + "ms")
      el.classList.add("rv")
      io.observe(el)
    })
    signal.addEventListener("abort", () => io.disconnect())
  }

  /* rejection families */
  const famT = $("#mxFamT") as HTMLElement
  const famP = $("#mxFamP") as HTMLElement
  let famAt = 0
  const showFam = (i: number) => {
    famAt = i
    const f = data.FAMILIES[i]
    Array.from(famT.children).forEach((c, j) => c.setAttribute("aria-selected", String(j === i)))
    const tab = famT.children[i] as HTMLElement | undefined
    if (tab && famT.scrollWidth > famT.clientWidth + 4) famT.scrollTo({ left: Math.max(0, tab.offsetLeft - (famT.clientWidth - tab.offsetWidth) / 2), behavior: "smooth" })
    famP.innerHTML = `<h4>${f.n}</h4><p>${f.d}</p><ul>${f.pts.map((p) => `<li>${p}</li>`).join("")}</ul>${
      f.words ? `<div class="words">${f.words.map((w) => `<div><span>${w[0]}</span><i>${w[1]}</i></div>`).join("")}</div>` : ""
    }`
  }
  famT.innerHTML = data.FAMILIES.map((f, i) => `<button role="tab" data-i="${i}"><i>0${i + 1}</i>${f.k}</button>`).join("")
  famT.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button")
    if (b) showFam(Number(b.dataset.i))
  }, { signal })
  showFam(0)
  /* the panel keeps the height of its longest family, so stepping through them moves nothing below */
  const fitFam = () => {
    const keep = famAt
    famP.style.minHeight = ""
    /* stacked on a phone, where tabs change only by tap, a fixed height would just leave gaps */
    if (window.innerWidth < 900) return
    let tall = 0
    data.FAMILIES.forEach((_, i) => {
      showFam(i)
      tall = Math.max(tall, famP.offsetHeight)
    })
    famP.style.minHeight = tall + "px"
    showFam(keep)
  }
  fitFam()
  window.addEventListener("resize", fitFam, { signal })
  document.fonts?.ready.then(() => { if (!signal.aborted) fitFam() })

  /* scroll-led emphasis: as a block travels up the screen its parts are picked
     out one at a time, left to right, and stay lit once passed */
  let famManual = false
  famT.addEventListener("click", () => { famManual = true }, { signal })
  const seqs: { el: HTMLElement; items: HTMLElement[]; step?: (i: number) => void; at: number }[] = []
  const addSeq = (el: HTMLElement | null, sel: string, step?: (i: number) => void) => {
    if (!el) return
    const items = Array.from(el.querySelectorAll<HTMLElement>(sel))
    if (!items.length) return
    if (!step) {
      el.classList.add("sq")
      items.forEach((it) => it.classList.add("sq-i"))
    }
    seqs.push({ el, items, step, at: -2 })
  }
  addSeq($(".mx-fam"), ".mx-fam-t button", (i) => { if (!famManual) showFam(i) })
  addSeq($(".mx-dims"), ".dim")
  addSeq($("#sec-bar .triage"), ".tbar, .tcol, .taudit")
  /* Nothing is held in place: the block scrolls with the page, and its parts change left to
     right over the stretch in which it is on screen - from a little over half of it being
     visible until its top edge reaches the chapter bar. */
  const stickTop = () => (document.getElementById("atlas-chrome")?.offsetHeight ?? 0) + 62
  const onSeq = () => {
    const vh = window.innerHeight
    seqs.forEach((s) => {
      const n = s.items.length
      const r = s.el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh) {
        if (s.step) famManual = false
        return
      }
      let at: number
      /* on a phone the tabs change only by tap, whatever height the current family happens to be */
      if (s.step && window.innerWidth < 900) return
      if (r.height > vh * 0.7) {
        /* taller than the screen (stacked on a phone): tabs change only by tap, and a stacked
           list lights up as each part passes */
        if (s.step) return
        const prog = (vh * 0.78 - r.top) / (r.height + vh * 0.2)
        at = prog >= 1 ? n : Math.floor(prog * n)
      } else {
        /* start once a little over half the block is on screen, end just before it meets the bar */
        const from = Math.min(vh * 0.8, vh - r.height * 0.55)
        const to = stickTop() + 10
        at = Math.floor(((from - r.top) / Math.max(1, from - to)) * n)
      }
      at = Math.max(0, Math.min(s.step ? n - 1 : n, at))
      /* act only when the part actually changes: re-rendering on every scroll event is what flickered */
      if (at === s.at) return
      s.at = at
      if (s.step) {
        s.step(at)
        return
      }
      s.el.classList.toggle("sq-live", at < n)
      s.items.forEach((it, i) => {
        it.classList.toggle("sq-on", i < at)
        it.classList.toggle("sq-now", i === at)
      })
    })
  }
  window.addEventListener("scroll", onSeq, { passive: true, signal })
  window.addEventListener("resize", onSeq, { signal })
  document.fonts?.ready.then(() => { if (!signal.aborted) onSeq() })
  onSeq()

  /* the record inspector */
  const rec = $("#mxRec") as HTMLElement
  const rule = $("#mxRule") as HTMLElement
  const showRule = (b: HTMLElement) => {
    rec.querySelectorAll(".rr").forEach((x) => x.setAttribute("aria-expanded", String(x === b)))
    rule.innerHTML = `<div class="nm">${b.querySelector(".nm")?.outerHTML ?? ""}${b.querySelector(".ct")?.outerHTML ?? ""}</div><p>${b.querySelector(".rw")?.innerHTML ?? ""}</p>`
  }
  const pick = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".rr")
    if (b) showRule(b)
  }
  rec.addEventListener("click", pick, { signal })
  rec.addEventListener("mouseover", pick, { signal })
  rec.addEventListener("focusin", pick, { signal })
  showRule(rec.querySelector(".rr") as HTMLElement)
  if (!still) {
    const rrs = Array.from(rec.querySelectorAll<HTMLElement>(".rr"))
    let held = false
    let seen = false
    rec.addEventListener("mouseenter", () => { held = true }, { signal })
    rec.addEventListener("mouseleave", () => { held = false }, { signal })
    /* a tap has no "leave", so it holds until the panel scrolls away */
    rec.addEventListener("touchstart", () => { held = true }, { signal, passive: true })
    const rio = new IntersectionObserver((es) => es.forEach((e) => {
      seen = e.isIntersecting
      if (!seen && window.matchMedia("(hover: none)").matches) held = false
    }), { threshold: 0.25 })
    rio.observe(rec)
    const tick = window.setInterval(() => {
      /* on a phone the rule opens inside the list, so advancing by itself would keep moving the page */
      if (!seen || held || document.hidden || window.innerWidth < 900) return
      const at = rrs.findIndex((x) => x.getAttribute("aria-expanded") === "true")
      showRule(rrs[(at + 1) % rrs.length])
    }, 1000)
    signal.addEventListener("abort", () => { window.clearInterval(tick); rio.disconnect() })
  }

  startIncidents(root, signal, still)

  /* the production map engine, unchanged except that a plain scroll stays with the page */
  const map = $("#mxMap") as HTMLElement
  try {
    new Function(
      "ROOT",
      "__el",
      "go",
      CANVAS_JS.replace("svg.addEventListener('wheel',e=>{\n  e.preventDefault();", "svg.addEventListener('wheel',e=>{\n  if(!(e.ctrlKey||e.metaKey))return;\n  e.preventDefault();")
        /* on a phone the map fills the screen: a vertical swipe has to scroll the page */
        .replace("  const narrow=kw<kh*0.72;", "  const narrow=kw<kh*0.72;\n  svg.__narrow=narrow;")
        .replace("  view.x=drag.vx+dx; view.y=drag.vy+dy; apply();", "  view.x=drag.vx+dx; if(!svg.__narrow)view.y=drag.vy+dy; apply();"),
    )(map, (id: string) => map.querySelector("#" + id), go)
  } catch (err) {
    console.error("methodology: map failed to start", err)
  }

  return () => {
    ac.abort()
    /* behaviour adds nodes and classes; put the markup back as it was served so a second
       mount (Strict Mode in development) starts from the same document */
    root.innerHTML = MARKUP
  }
}

export function MethodologyBody() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) return
    return start(rootRef.current)
  }, [])

  return <div className="mx" ref={rootRef} dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
