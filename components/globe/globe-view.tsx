"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import dynamic from "next/dynamic"
import {
  companySearchHaystack,
  useCaseSearchHaystack,
} from "@/lib/search-match"
import { useCaseDisplayName, type CompanyWithCoords, type UseCaseWithCoords } from "@/lib/types"

const SEA_GREEN = "#3cb371"
const SEA_GREEN_RGB = "60, 179, 113"

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

export interface GlobeFlyTo {
  lat: number
  lng: number
  altitude?: number
}

interface GlobeViewProps {
  companies: CompanyWithCoords[]
  useCases: UseCaseWithCoords[]
  onCompanyClick: (company: CompanyWithCoords) => void
  onUseCaseClick: (useCase: UseCaseWithCoords) => void
  isPanelOpen?: boolean
  /** Debounced substring; empty = no search highlight */
  highlightSearchQuery?: string
  /** When false, company markers ignore search dimming (full color). */
  searchScopeCompany?: boolean
  /** When false, use case markers ignore search dimming (full color). */
  searchScopeUseCase?: boolean
  /** Show yellow "new in 24h" ring around use-case markers. */
  highlightRecentUseCases?: boolean
  /** Fly camera when nonce increases (e.g. after picking from search) */
  flyTo?: GlobeFlyTo | null
  flyToNonce?: number
  /** Bumps HTML marker refresh when detail panel opens (react-globe can skip updates otherwise) */
  selectionRevision?: string
  /** Outer ring / selection halo only when this company id matches */
  selectedCompanyId?: string | null
  /** Outer ring / selection halo only when this use case id matches */
  selectedUseCaseId?: string | null
}

// GeoJSON URL for countries
const COUNTRIES_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
const GLOBE_ROTATION_SPEED = 0.3
const PRAGUE_VIEW = { lat: 50.0755, lng: 14.4378, altitude: 2.2 }
const FLY_ALTITUDE = 1.85
const FLY_MS = 1400

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Same Δ° in lat vs lng covers different ground distance; scale lng so ring reads circular on the globe. */
function lngDegreesScaleForLocalCircle(latDeg: number): number {
  const cosLat = Math.cos((latDeg * Math.PI) / 180)
  return 1 / Math.max(Math.abs(cosLat), 0.2)
}

export function GlobeView({
  companies,
  useCases,
  onCompanyClick,
  onUseCaseClick,
  isPanelOpen = false,
  highlightSearchQuery = "",
  searchScopeCompany = true,
  searchScopeUseCase = true,
  highlightRecentUseCases = false,
  flyTo = null,
  flyToNonce = 0,
  selectionRevision = "",
  selectedCompanyId = null,
  selectedUseCaseId = null,
}: GlobeViewProps) {
  const globeRef = useRef<any>(null)
  const globeContainerRef = useRef<HTMLDivElement>(null)
  const controlsListenersRef = useRef<{
    controls: { removeEventListener: (ev: string, fn: () => void) => void }
    onStart: () => void
    onEnd: () => void
    onChange?: () => void
  } | null>(null)
  const isPanelOpenRef = useRef(isPanelOpen)
  const userPausedRef = useRef(false)
  const flyToNonceRef = useRef(flyToNonce)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const dragMovedRef = useRef(false)
  const suppressBlankClickUntilRef = useRef(0)
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [geoJsonData, setGeoJsonData] = useState<{ features: any[] }>({ features: [] })
  const [markersReady, setMarkersReady] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)
  const [cameraAltitude, setCameraAltitude] = useState(PRAGUE_VIEW.altitude)

  // Function to pause/resume rotation
  const pauseRotation = useCallback(() => {
    if (globeRef.current?.controls()) {
      globeRef.current.controls().autoRotate = false
    }
  }, [])
  
  const resumeRotation = useCallback(() => {
    if (globeRef.current?.controls()) {
      globeRef.current.controls().autoRotate = true
    }
  }, [])

  /** Face Prague (instant) + auto-rotate unless panel open or user paused blank-toggle. */
  const applyPragueViewAndRotation = useCallback(() => {
    const globe = globeRef.current
    const controls = globe?.controls()
    if (!globe || !controls) return
    controls.autoRotateSpeed = GLOBE_ROTATION_SPEED
    globe.pointOfView(PRAGUE_VIEW, 0)
    controls.autoRotate = !(isPanelOpenRef.current || userPausedRef.current)
  }, [])

  const handleBlankAreaClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressBlankClickUntilRef.current) return
    const target = event.target as HTMLElement | null
    if (!target) return
    if (target.closest(".company-marker")) return
    if (target.closest(".use-case-marker")) return
    if (!isPanelOpenRef.current) {
      setIsUserPaused((prev) => !prev)
    }
  }, [])

  const handlePointerDownCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    pointerDownRef.current = { x: event.clientX, y: event.clientY }
    dragMovedRef.current = false
  }, [])

  const handlePointerMoveCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const start = pointerDownRef.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 6) {
      dragMovedRef.current = true
    }
  }, [])

  const handlePointerUpCapture = useCallback(() => {
    if (dragMovedRef.current) {
      // Drag release often emits a click; suppress that click so blank-toggle won't flip unexpectedly.
      suppressBlankClickUntilRef.current = Date.now() + 260
    }
    pointerDownRef.current = null
    dragMovedRef.current = false
  }, [])
  
  useEffect(() => {
    isPanelOpenRef.current = isPanelOpen
  }, [isPanelOpen])

  useEffect(() => {
    userPausedRef.current = isUserPaused
  }, [isUserPaused])

  useEffect(() => {
    flyToNonceRef.current = flyToNonce
  }, [flyToNonce])

  // Pause/resume rotation based on panel state + user toggle state
  useEffect(() => {
    if (isPanelOpen || isUserPaused) {
      pauseRotation()
    } else {
      resumeRotation()
    }
  }, [isPanelOpen, isUserPaused, pauseRotation, resumeRotation])

  // Detach OrbitControls listeners on unmount
  useEffect(() => {
    return () => {
      const attached = controlsListenersRef.current
      if (attached) {
        attached.controls.removeEventListener("start", attached.onStart)
        attached.controls.removeEventListener("end", attached.onEnd)
        if (attached.onChange) {
          attached.controls.removeEventListener("change", attached.onChange)
        }
        controlsListenersRef.current = null
      }
    }
  }, [])
  
  // Markers layer: delay when there is data (globe init); short delay when empty so Prague POV still reapplies.
  useEffect(() => {
    if (!isClient) return
    const delay = companies.length > 0 || useCases.length > 0 ? 500 : 80
    const timer = setTimeout(() => setMarkersReady(true), delay)
    return () => clearTimeout(timer)
  }, [companies, useCases, isClient])

  useEffect(() => {
    setIsClient(true)
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Load GeoJSON data for countries
  useEffect(() => {
    fetch(COUNTRIES_URL)
      .then(res => res.json())
      .then(data => {
        setGeoJsonData(data)
      })
      .catch(err => console.error("Failed to load countries:", err))
  }, [])

  // After client mount, retry once controls exist (ref may attach after first paint).
  // Deps must stay a fixed-length array ([isClient] only) — do not add callbacks here
  // (avoids React 19 "dependency array changed size" with Fast Refresh).
  useEffect(() => {
    if (!isClient) return
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const globe = globeRef.current
      const controls = globe?.controls()
      if (!globe || !controls) return
      controls.autoRotateSpeed = GLOBE_ROTATION_SPEED
      if (flyToNonceRef.current < 1) {
        globe.pointOfView(PRAGUE_VIEW, 0)
      }
      controls.autoRotate = !(isPanelOpenRef.current || userPausedRef.current)
    }
    const run = () => {
      tick()
      requestAnimationFrame(() => {
        if (!cancelled) tick()
      })
    }
    requestAnimationFrame(run)
    return () => {
      cancelled = true
    }
  }, [isClient])

  const handleGlobeReady = useCallback(() => {
    const controls = globeRef.current?.controls()
    if (!controls) return

    // Replace any previous listeners (e.g. React Strict Mode remount)
    const prev = controlsListenersRef.current
    if (prev) {
      prev.controls.removeEventListener("start", prev.onStart)
      prev.controls.removeEventListener("end", prev.onEnd)
      if (prev.onChange) {
        prev.controls.removeEventListener("change", prev.onChange)
      }
      controlsListenersRef.current = null
    }

    applyPragueViewAndRotation()

    const onStart = () => {
      pauseRotation()
    }
    let rafId = 0
    const onChange = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        const pov = globeRef.current?.pointOfView?.()
        if (pov && typeof pov.altitude === "number") {
          setCameraAltitude((prev) =>
            Math.abs(prev - pov.altitude) > 0.01 ? pov.altitude : prev
          )
        }
      })
    }
    const onEnd = () => {
      // Keep paused after a manual drag; users can explicitly toggle rotation via blank click.
      pauseRotation()
      onChange()
    }

    controls.addEventListener("start", onStart)
    controls.addEventListener("end", onEnd)
    controls.addEventListener("change", onChange)
    controlsListenersRef.current = { controls, onStart, onEnd, onChange }

    applyPragueViewAndRotation()
    requestAnimationFrame(() => {
      applyPragueViewAndRotation()
    })
  }, [applyPragueViewAndRotation, pauseRotation])

  const jitteredUseCases = useMemo(() => {
    // Larger offset when zoomed out (high altitude), smaller when zoomed in.
    const zoomFactor = clamp(cameraAltitude / 1.8, 0.75, 2.8)
    const zoomOutSpreadBoost = zoomFactor > 1 ? 1.5 : 1
    const baseRadius = 0.06 + 0.12 * zoomFactor
    const companyCoordKeys = new Set(companies.map((c) => `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`))

    const grouped = new Map<string, UseCaseWithCoords[]>()
    for (const u of useCases) {
      const key = `${u.lat.toFixed(4)},${u.lng.toFixed(4)}`
      const arr = grouped.get(key)
      if (arr) arr.push(u)
      else grouped.set(key, [u])
    }

    const output: UseCaseWithCoords[] = []
    const ringSlots = 8
    for (const [key, arr] of grouped.entries()) {
      const sorted = [...arr].sort((a, b) => String(a.id).localeCompare(String(b.id)))
      const hasCompanyOnSameCoord = companyCoordKeys.has(key)
      const needSpread = hasCompanyOnSameCoord || sorted.length > 1
      if (!needSpread) {
        output.push(sorted[0])
        continue
      }
      for (let i = 0; i < sorted.length; i++) {
        const u = sorted[i]
        const layer = Math.floor(i / ringSlots)
        const slot = i % ringSlots
        const angle = (slot / ringSlots) * Math.PI * 2 + layer * 0.25
        const radius =
          (baseRadius * (1 + layer * 0.9) + (hasCompanyOnSameCoord ? 0.03 * zoomFactor : 0)) *
          zoomOutSpreadBoost
        const lngScale = lngDegreesScaleForLocalCircle(u.lat)
        output.push({
          ...u,
          lat: u.lat + Math.cos(angle) * radius,
          lng: u.lng + Math.sin(angle) * radius * lngScale,
        })
      }
    }
    return output
  }, [useCases, companies, cameraAltitude])

  /** Same-coordinate company markers overlap without offset; spread in a ring like use cases. */
  const jitteredCompanies = useMemo(() => {
    const zoomFactor = clamp(cameraAltitude / 1.8, 0.75, 2.8)
    const zoomOutSpreadBoost = zoomFactor > 1 ? 1.5 : 1
    const baseRadius = 0.06 + 0.12 * zoomFactor
    const ringSlots = 8

    const grouped = new Map<string, CompanyWithCoords[]>()
    for (const c of companies) {
      const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`
      const arr = grouped.get(key)
      if (arr) arr.push(c)
      else grouped.set(key, [c])
    }

    const output: CompanyWithCoords[] = []
    for (const [, arr] of grouped.entries()) {
      const sorted = [...arr].sort((a, b) => String(a.id).localeCompare(String(b.id)))
      if (sorted.length === 1) {
        output.push(sorted[0])
        continue
      }
      for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i]
        const layer = Math.floor(i / ringSlots)
        const slot = i % ringSlots
        // Half-slot rotation vs use-case ring so cyan/green dots don’t sit on identical angles.
        const angle = (slot / ringSlots) * Math.PI * 2 + layer * 0.25 + Math.PI / ringSlots
        const radius = baseRadius * (1 + layer * 0.9) * zoomOutSpreadBoost
        const lngScale = lngDegreesScaleForLocalCircle(item.lat)
        output.push({
          ...item,
          lat: item.lat + Math.cos(angle) * radius,
          lng: item.lng + Math.sin(angle) * radius * lngScale,
        })
      }
    }
    return output
  }, [companies, cameraAltitude])

  // New object refs when search / panel / selection changes so react-globe.gl refreshes HTML markers.
  const htmlElementsData = useMemo(() => {
    if (!markersReady) return []
    const q = highlightSearchQuery.trim().toLowerCase()
    const companyMarkers = searchScopeCompany
      ? jitteredCompanies.map((c) => ({
          kind: "company" as const,
          ...c,
          _globeSearchKey: q,
          _globeSearchScopeCompany: searchScopeCompany,
          _globeSearchScopeUseCase: searchScopeUseCase,
          _globeUiRev: selectionRevision,
          _globeSelected:
            Boolean(selectedCompanyId) && String(c.id) === String(selectedCompanyId),
        }))
      : []
    const useCaseMarkers = searchScopeUseCase
      ? jitteredUseCases.map((u) => ({
          kind: "use_case" as const,
          ...u,
          _globeSearchKey: q,
          _globeSearchScopeCompany: searchScopeCompany,
          _globeSearchScopeUseCase: searchScopeUseCase,
          _globeUiRev: selectionRevision,
          _globeSelected:
            Boolean(selectedUseCaseId) && String(u.id) === String(selectedUseCaseId),
        }))
      : []
    return [...companyMarkers, ...useCaseMarkers]
  }, [
    markersReady,
    jitteredCompanies,
    jitteredUseCases,
    highlightSearchQuery,
    searchScopeCompany,
    searchScopeUseCase,
    selectionRevision,
    selectedCompanyId,
    selectedUseCaseId,
  ])

  // HTML markers attaching often resets POV — re-aim at Prague (unless user already flew via search).
  useEffect(() => {
    if (!isClient || !markersReady) return
    const schedule = () => {
      if (flyToNonceRef.current > 0) return
      applyPragueViewAndRotation()
    }
    const raf = requestAnimationFrame(schedule)
    const t1 = window.setTimeout(schedule, 120)
    const t2 = window.setTimeout(schedule, 520)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isClient, markersReady, applyPragueViewAndRotation])

  // GeoJSON polygons finishing load can nudge the camera — align to Prague once.
  useEffect(() => {
    if (!isClient || geoJsonData.features.length === 0) return
    const t = window.setTimeout(() => {
      if (flyToNonceRef.current > 0) return
      applyPragueViewAndRotation()
    }, 150)
    return () => clearTimeout(t)
  }, [isClient, geoJsonData.features.length, applyPragueViewAndRotation])

  useEffect(() => {
    if (!isClient || !flyTo || flyToNonce < 1) return
    const id = window.setTimeout(() => {
      globeRef.current?.pointOfView(
        { lat: flyTo.lat, lng: flyTo.lng, altitude: flyTo.altitude ?? FLY_ALTITUDE },
        FLY_MS
      )
    }, 80)
    return () => clearTimeout(id)
  }, [isClient, flyTo, flyToNonce])

  if (!isClient) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#020a18]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
          <div className="text-cyan-400/80 text-sm tracking-wide">Loading globe...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={globeContainerRef}
      className="relative z-0 isolate h-full w-full"
      onClickCapture={handleBlankAreaClickCapture}
      onMouseDownCapture={handlePointerDownCapture}
      onMouseMoveCapture={handlePointerMoveCapture}
      onMouseUpCapture={handlePointerUpCapture}
    >
      <Globe
        ref={globeRef}
        onGlobeReady={handleGlobeReady}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl=""
        showAtmosphere={true}
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.15}
        
        // Polygons layer for countries
        polygonsData={geoJsonData.features}
        polygonCapColor={() => "rgba(20, 40, 80, 0.7)"}
        polygonSideColor={() => "rgba(20, 40, 80, 0.3)"}
        polygonStrokeColor={() => "#22d3ee"}
        polygonAltitude={0.01}
        polygonLabel={(d: any) => `
        <div style="
          background: rgba(2, 10, 24, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          font-family: system-ui, sans-serif;
        ">
          <div style="font-size: 13px; color: #94a3b8;">${d.properties?.NAME || 'Unknown'}</div>
        </div>
      `}

        // HTML markers: glow dot + hover tooltip; search dims non-matches
        htmlElementsData={htmlElementsData}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={(d: any) => {
          const q = (d._globeSearchKey as string) ?? ""
          const isCompany = d.kind === "company"
          const scopeCompany = d._globeSearchScopeCompany !== false
          const scopeUseCase = d._globeSearchScopeUseCase !== false
          const inSearchScope = isCompany ? scopeCompany : scopeUseCase
          const label = isCompany
            ? String(d.name)
            : useCaseDisplayName(d as UseCaseWithCoords)
          const haystack = isCompany
            ? companySearchHaystack(d as CompanyWithCoords)
            : useCaseSearchHaystack(d as UseCaseWithCoords)
          const searchApplies = q.length > 0 && inSearchScope
          const isMatch = !searchApplies || haystack.includes(q)
          const isSelected = d._globeSelected === true
          const updatedRaw =
            typeof d.updated_at === "string"
              ? d.updated_at
              : typeof d.created_at === "string"
                ? d.created_at
                : null
          const updatedTs = updatedRaw ? Date.parse(updatedRaw) : NaN
          const isRecent24h =
            highlightRecentUseCases &&
            !isCompany &&
            Number.isFinite(updatedTs) &&
            Date.now() - updatedTs <= 24 * 60 * 60 * 1000

          const container = document.createElement("div")
          container.className = isCompany ? "company-marker" : "use-case-marker"
          container.style.cssText = `
            cursor: pointer;
            transform: translate(-50%, -50%);
            pointer-events: auto;
            position: relative;
            z-index: 1;
            opacity: ${searchApplies && !isMatch ? "0.22" : "1"};
            filter: ${searchApplies && !isMatch ? "grayscale(0.85)" : "none"};
            transition: opacity 0.25s ease, filter 0.25s ease;
          `

          const dot = document.createElement("div")
          const cyanIdle = "none"
          const cyanSelected =
            "0 0 0 2px rgba(34, 211, 238, 0.95), 0 0 14px 4px rgba(34, 211, 238, 0.45)"
          const greenIdle = "none"
          const greenSelected = `0 0 0 2px rgba(${SEA_GREEN_RGB}, 0.95), 0 0 14px 4px rgba(${SEA_GREEN_RGB}, 0.4)`
          const dotGlow = isCompany
            ? isSelected
              ? cyanSelected
              : cyanIdle
            : isSelected
              ? greenSelected
              : greenIdle
          const recentRing = "0 0 0 1.1px rgba(254, 249, 195, 0.78)"
          const dotShadow = isRecent24h
            ? dotGlow === "none"
              ? recentRing
              : `${dotGlow}, ${recentRing}`
            : dotGlow
          const dotSize =
            searchApplies && isMatch ? "12px" : isSelected ? "12px" : "9.6px"
          const dotGradient = isCompany
            ? "radial-gradient(circle, #22d3ee 0%, rgba(34, 211, 238, 0.8) 50%, transparent 100%)"
            : `radial-gradient(circle, ${SEA_GREEN} 0%, rgba(${SEA_GREEN_RGB}, 0.85) 50%, transparent 100%)`
          const selectionRing = isCompany
            ? "outline: 2px solid rgba(255,255,255,0.85); outline-offset: 4px;"
            : `outline: 2px solid rgba(${SEA_GREEN_RGB},0.9); outline-offset: 4px;`
          dot.style.cssText = `
            width: ${dotSize};
            height: ${dotSize};
            background: ${dotGradient};
            border-radius: 50%;
            box-shadow: ${dotShadow};
            animation: ${searchApplies && !isMatch ? "none" : "pulse 3s ease-in-out infinite"};
            transition: transform 0.2s ease, width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease, outline 0.2s ease;
            ${isSelected ? selectionRing : "outline: none;"}
          `

          const tooltip = document.createElement("div")
          const borderRgb = isCompany ? "34, 211, 238" : SEA_GREEN_RGB
          const titleRgb = isCompany ? "#22d3ee" : SEA_GREEN
          tooltip.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(2, 10, 24, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(${borderRgb}, 0.5);
            border-radius: 10px;
            padding: 12px 16px;
            color: white;
            font-family: system-ui, sans-serif;
            min-width: 200px;
            max-width: 280px;
            box-shadow: 0 0 20px rgba(${borderRgb}, 0.3);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            z-index: 2;
            white-space: nowrap;
          `

          if (isCompany) {
            tooltip.innerHTML = `
            <div style="font-weight: 600; font-size: 14px; color: ${titleRgb}; margin-bottom: 4px;">${d.name}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">${d.city}, ${d.headquarters_country}</div>
            <div style="
              font-size: 11px;
              padding: 3px 8px;
              background: rgba(34, 211, 238, 0.15);
              border-radius: 4px;
              color: #22d3ee;
              display: inline-block;
            ">${d.industry}</div>
          `
          } else {
            const loc =
              [d.city, d.country].filter(Boolean).join(", ") ||
              (d.location ? String(d.location) : "")
            const sub = loc
              ? `<div style="font-size: 12px; color: #94a3b8; margin-bottom: 6px;">${loc}</div>`
              : ""
            const badge =
              d.sector || d.industry
                ? `<div style="
              font-size: 11px;
              padding: 3px 8px;
              background: rgba(${SEA_GREEN_RGB}, 0.18);
              border-radius: 4px;
              color: ${titleRgb};
              display: inline-block;
            ">${d.sector || d.industry}</div>`
                : `<div style="font-size: 11px; color: #64748b;">Use case</div>`
            tooltip.innerHTML = `
            <div style="font-weight: 600; font-size: 14px; color: ${titleRgb}; margin-bottom: 4px;">${label}</div>
            ${sub}
            ${badge}
          `
          }

          container.appendChild(dot)
          container.appendChild(tooltip)

          container.addEventListener("mouseenter", () => {
            tooltip.style.opacity = "1"
            tooltip.style.visibility = "visible"
            dot.style.transform = "scale(1.5)"
            pauseRotation()
          })

          container.addEventListener("mouseleave", () => {
            tooltip.style.opacity = "0"
            tooltip.style.visibility = "hidden"
            dot.style.transform = "scale(1)"
            if (!isPanelOpenRef.current && !userPausedRef.current) {
              resumeRotation()
            }
          })

          container.addEventListener("click", (e) => {
            e.stopPropagation()
            pauseRotation()
            const {
              kind: _k,
              _globeSearchKey: _q,
              _globeUiRev: _r,
              _globeSearchScopeCompany: _sc,
              _globeSearchScopeUseCase: _su,
              _globeSelected: _sel,
              ...rest
            } = d
            if (isCompany) {
              const c = rest as CompanyWithCoords
              const orig = companies.find((co) => String(co.id) === String(c.id))
              onCompanyClick(
                orig ? { ...c, lat: orig.lat, lng: orig.lng } : c
              )
            } else {
              const u = rest as UseCaseWithCoords
              const orig = useCases.find((x) => String(x.id) === String(u.id))
              onUseCaseClick(orig ? { ...u, lat: orig.lat, lng: orig.lng } : u)
            }
          })

          return container
        }}
      />
    </div>
  )
}
