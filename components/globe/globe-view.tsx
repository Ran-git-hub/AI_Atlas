"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react"
import dynamic from "next/dynamic"
import * as THREE from "three"
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

interface GlobeHtmlMarkerDatum {
  kind: "company" | "use_case"
  id: string | number
  lat: number
  lng: number
  name?: string | null
  city?: string | null
  headquarters_country?: string | null
  country?: string | null
  location?: string | null
  industry?: string | null
  sector?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// GeoJSON URL for countries
const COUNTRIES_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
const GLOBE_ROTATION_SPEED = 0.3
const PRAGUE_VIEW = { lat: 50.0755, lng: 14.4378, altitude: 2.2 }
const FLY_ALTITUDE = 1.85
const FLY_MS = 1400
/** Bucket POV altitude so jitter + html marker data do not rebuild on every zoom tick (major perf win). */
const CAMERA_ALTITUDE_JITTER_BUCKET = 0.09
const MAX_DESKTOP_DPR = 1.5
const FAR_VIEW_ALTITUDE = 2.45

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function cameraAltitudeJitterBucket(altitude: number): number {
  return (
    Math.round(altitude / CAMERA_ALTITUDE_JITTER_BUCKET) *
    CAMERA_ALTITUDE_JITTER_BUCKET
  )
}

/** Same Δ° in lat vs lng covers different ground distance; scale lng so ring reads circular on the globe. */
function lngDegreesScaleForLocalCircle(latDeg: number): number {
  const cosLat = Math.cos((latDeg * Math.PI) / 180)
  return 1 / Math.max(Math.abs(cosLat), 0.2)
}

/** WebGL pins (mobile): globe.gl pointRadius is in degrees on the surface; tuned to approximate HTML dot sizes. */
function mobileWebglPointStyle(
  marker: GlobeHtmlMarkerDatum,
  opts: {
    highlightSearchQuery: string
    searchScopeCompany: boolean
    searchScopeUseCase: boolean
    selectedCompanyId: string | null
    selectedUseCaseId: string | null
    cameraAltitude: number
  }
): { color: string; radius: number; altitude: number } {
  const q = opts.highlightSearchQuery.trim().toLowerCase()
  const isCompany = marker.kind === "company"
  const inSearchScope = isCompany
    ? opts.searchScopeCompany
    : opts.searchScopeUseCase
  const haystack = isCompany
    ? companySearchHaystack(marker as unknown as CompanyWithCoords)
    : useCaseSearchHaystack(marker as unknown as UseCaseWithCoords)
  const searchApplies = q.length > 0 && inSearchScope
  const isMatch = !searchApplies || haystack.includes(q)
  const selectedId = isCompany
    ? opts.selectedCompanyId
    : opts.selectedUseCaseId
  const isSelected =
    Boolean(selectedId) && String(marker.id) === String(selectedId)
  const updatedRaw =
    typeof marker.updated_at === "string"
      ? marker.updated_at
      : typeof marker.created_at === "string"
        ? marker.created_at
        : null
  const updatedTs = updatedRaw ? Date.parse(updatedRaw) : NaN
  const isRecent24h =
    !isCompany &&
    Number.isFinite(updatedTs) &&
    Date.now() - updatedTs <= 24 * 60 * 60 * 1000
  const isFarView = opts.cameraAltitude >= FAR_VIEW_ALTITUDE

  const baseRgb = isCompany ? ([34, 211, 238] as const) : ([60, 179, 113] as const)
  const dimAlpha = searchApplies && !isMatch ? 0.5 : 1
  const fillAlpha = Math.max(0.52, 0.92 * dimAlpha)
  const color = `rgba(${baseRgb[0]}, ${baseRgb[1]}, ${baseRgb[2]}, ${fillAlpha})`

  let radiusDeg =
    searchApplies && isMatch
      ? isFarView && !isSelected
        ? 0.15
        : 0.17
      : isSelected
        ? 0.17
        : isFarView
          ? 0.11
          : 0.13
  radiusDeg *= 0.92
  radiusDeg = Math.max(radiusDeg, isFarView ? 0.125 : 0.11)
  if (isSelected) radiusDeg *= 1.12
  if (isRecent24h && !isCompany && !isSelected) radiusDeg *= 1.06

  // Keep points only slightly above polygon caps so they read as dots (not pillars).
  const altitude = isSelected ? 0.013 : 0.011

  return { color, radius: radiusDeg, altitude }
}

function mobileMarkerMatchState(
  marker: GlobeHtmlMarkerDatum,
  opts: {
    highlightSearchQuery: string
    searchScopeCompany: boolean
    searchScopeUseCase: boolean
    selectedCompanyId: string | null
    selectedUseCaseId: string | null
  }
): { searchApplies: boolean; isMatch: boolean; isSelected: boolean; isRecent24h: boolean } {
  const q = opts.highlightSearchQuery.trim().toLowerCase()
  const isCompany = marker.kind === "company"
  const inSearchScope = isCompany ? opts.searchScopeCompany : opts.searchScopeUseCase
  const haystack = isCompany
    ? companySearchHaystack(marker as unknown as CompanyWithCoords)
    : useCaseSearchHaystack(marker as unknown as UseCaseWithCoords)
  const searchApplies = q.length > 0 && inSearchScope
  const isMatch = !searchApplies || haystack.includes(q)
  const selectedId = isCompany ? opts.selectedCompanyId : opts.selectedUseCaseId
  const isSelected = Boolean(selectedId) && String(marker.id) === String(selectedId)
  const updatedRaw =
    typeof marker.updated_at === "string"
      ? marker.updated_at
      : typeof marker.created_at === "string"
        ? marker.created_at
        : null
  const updatedTs = updatedRaw ? Date.parse(updatedRaw) : NaN
  const isRecent24h =
    !isCompany &&
    Number.isFinite(updatedTs) &&
    Date.now() - updatedTs <= 24 * 60 * 60 * 1000
  return { searchApplies, isMatch, isSelected, isRecent24h }
}

function mobileLodConfig(altitude: number): {
  cellDeg: number
  maxPerCell: number
  keepRatio: number
  maxTotal: number
  useCaseKeepRatio: number
  minVisible: number
} {
  if (altitude < 1.25) {
    return { cellDeg: 0.18, maxPerCell: 6, keepRatio: 1, maxTotal: 2500, useCaseKeepRatio: 1, minVisible: 900 }
  }
  if (altitude < 1.55) {
    return { cellDeg: 0.28, maxPerCell: 5, keepRatio: 0.9, maxTotal: 1800, useCaseKeepRatio: 0.9, minVisible: 700 }
  }
  if (altitude < 1.95) {
    return { cellDeg: 0.5, maxPerCell: 3, keepRatio: 0.65, maxTotal: 900, useCaseKeepRatio: 0.7, minVisible: 380 }
  }
  if (altitude < 2.35) {
    // Default Prague-like far view (~2.2): keep this intentionally aggressive for iPhone smoothness.
    return { cellDeg: 0.82, maxPerCell: 1, keepRatio: 0.38, maxTotal: 230, useCaseKeepRatio: 0.32, minVisible: 120 }
  }
  if (altitude < 2.75) {
    return { cellDeg: 1.0, maxPerCell: 1, keepRatio: 0.28, maxTotal: 170, useCaseKeepRatio: 0.22, minVisible: 90 }
  }
  if (altitude < 3.05) {
    return { cellDeg: 1.6, maxPerCell: 1, keepRatio: 0.2, maxTotal: 130, useCaseKeepRatio: 0.16, minVisible: 70 }
  }
  return { cellDeg: 2.2, maxPerCell: 1, keepRatio: 0.14, maxTotal: 90, useCaseKeepRatio: 0.1, minVisible: 45 }
}

function stableMarkerHash(id: string, seed = 2166136261): number {
  let h = seed >>> 0
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
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
  const prevPanelOpenRef = useRef(isPanelOpen)
  const userPausedRef = useRef(false)
  const flyToNonceRef = useRef(flyToNonce)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const touchTapRef = useRef<{
    x: number
    y: number
    t: number
    moved: boolean
    multiTouch: boolean
  } | null>(null)
  const dragMovedRef = useRef(false)
  const suppressBlankClickUntilRef = useRef(0)
  const suppressAfterControlsUntilRef = useRef(0)
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [geoJsonData, setGeoJsonData] = useState<{ features: any[] }>({ features: [] })
  const [markersReady, setMarkersReady] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)
  const [cameraAltitude, setCameraAltitude] = useState(PRAGUE_VIEW.altitude)
  const [isMobileLikeInput, setIsMobileLikeInput] = useState(false)
  const [isTouchCapable, setIsTouchCapable] = useState(false)
  const isTouchCapableRef = useRef(false)
  const [mobileAutoRotateLocked, setMobileAutoRotateLocked] = useState(false)
  const [isMobileInteracting, setIsMobileInteracting] = useState(false)
  const mobileInteractionEndTimerRef = useRef<number | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const highlightSearchQueryRef = useRef(highlightSearchQuery)
  const searchScopeCompanyRef = useRef(searchScopeCompany)
  const searchScopeUseCaseRef = useRef(searchScopeUseCase)
  const selectedCompanyIdRef = useRef<string | null>(selectedCompanyId)
  const selectedUseCaseIdRef = useRef<string | null>(selectedUseCaseId)

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

  const lockMobileAutoRotate = useCallback(() => {
    if (!(isMobileLikeInput || isTouchCapable)) return
    setMobileAutoRotateLocked(true)
    pauseRotation()
  }, [isMobileLikeInput, isTouchCapable, pauseRotation])

  /** HTML markers sit above the canvas; forward wheel so OrbitControls can still zoom while hovering tooltips. */
  const forwardMarkerWheelToGlobe = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const globe = globeRef.current
    if (!globe || typeof globe.renderer !== "function") return
    const canvas = globe.renderer()?.domElement
    if (!(canvas instanceof HTMLCanvasElement)) return
    canvas.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaZ: e.deltaZ,
        deltaMode: e.deltaMode,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        bubbles: true,
        cancelable: true,
        view: window,
      })
    )
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

  const applyRendererPixelRatio = useCallback(() => {
    try {
      const globe = globeRef.current
      const renderer =
        typeof globe?.renderer === "function" ? globe.renderer() : globe?.renderer
      if (!renderer?.setPixelRatio) return
      const nextDpr = isMobileLikeInput
        ? cameraAltitude < 1.75
          ? 1.35
          : 1
        : Math.min(window.devicePixelRatio || 1, MAX_DESKTOP_DPR)
      renderer.setPixelRatio(nextDpr)
    } catch {
      // Ignore renderer configuration errors (varies by react-globe.gl version).
    }
  }, [cameraAltitude, isMobileLikeInput])

  const handleBlankAreaClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (isMobileLikeInput || isTouchCapable) {
      lockMobileAutoRotate()
      return
    }
    const now = Date.now()
    if (now < suppressBlankClickUntilRef.current) return
    if (now < suppressAfterControlsUntilRef.current) return
    const target = event.target as HTMLElement | null
    if (!target) return
    if (target.closest(".company-marker")) return
    if (target.closest(".use-case-marker")) return
    if (!isPanelOpenRef.current) {
      setIsUserPaused((prev) => !prev)
    }
  }, [isMobileLikeInput, isTouchCapable, lockMobileAutoRotate])

  /** Mobile: blank globe surface (not WebGL point / polygon hit) toggles rotation like desktop HTML blank clicks. */
  const handleGlobeSurfaceClick = useCallback(() => {
    if (isMobileLikeInput || isTouchCapable) {
      lockMobileAutoRotate()
      return
    }
    if (Date.now() < suppressBlankClickUntilRef.current) return
    if (!isPanelOpenRef.current) {
      setIsUserPaused((prev) => !prev)
    }
  }, [isMobileLikeInput, isTouchCapable, lockMobileAutoRotate])

  const handlePointerDownCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (isMobileLikeInput || isTouchCapable) lockMobileAutoRotate()
    pointerDownRef.current = { x: event.clientX, y: event.clientY }
    dragMovedRef.current = false
  }, [isMobileLikeInput, isTouchCapable, lockMobileAutoRotate])

  const handlePointerMoveCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const start = pointerDownRef.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 6) {
      dragMovedRef.current = true
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = "0"
        tooltipRef.current.style.visibility = "hidden"
      }
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

  const handleTouchStartCapture = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!(isMobileLikeInput || isTouchCapable)) return
      lockMobileAutoRotate()
      const touches = event.touches
      if (touches.length !== 1) {
        touchTapRef.current = {
          x: 0,
          y: 0,
          t: Date.now(),
          moved: true,
          multiTouch: true,
        }
        suppressAfterControlsUntilRef.current = Date.now() + 1100
        return
      }
      const t = touches[0]
      touchTapRef.current = {
        x: t.clientX,
        y: t.clientY,
        t: Date.now(),
        moved: false,
        multiTouch: false,
      }
    },
    [isMobileLikeInput, isTouchCapable, lockMobileAutoRotate]
  )

  const handleTouchMoveCapture = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!(isMobileLikeInput || isTouchCapable)) return
      const state = touchTapRef.current
      if (!state) return
      if (event.touches.length !== 1) {
        state.multiTouch = true
        state.moved = true
        suppressAfterControlsUntilRef.current = Date.now() + 1100
        return
      }
      const t = event.touches[0]
      const dx = t.clientX - state.x
      const dy = t.clientY - state.y
      if (Math.hypot(dx, dy) > 8) {
        state.moved = true
      }
    },
    [isMobileLikeInput, isTouchCapable]
  )

  const handleTouchEndCapture = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (!(isMobileLikeInput || isTouchCapable)) return
      const state = touchTapRef.current
      touchTapRef.current = null
      if (!state) return
      const now = Date.now()
      if (now < suppressBlankClickUntilRef.current) return
      if (now < suppressAfterControlsUntilRef.current) return
      if (state.multiTouch || state.moved) return
      if (now - state.t > 280) return

      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest(".company-marker") || target.closest(".use-case-marker")) return
      if (!isPanelOpenRef.current) {
        setIsUserPaused((prev) => !prev)
        // Block the synthetic click that iOS may emit right after touchend.
        suppressBlankClickUntilRef.current = Date.now() + 380
      }
    },
    [isMobileLikeInput, isTouchCapable]
  )
  
  useEffect(() => {
    isPanelOpenRef.current = isPanelOpen
  }, [isPanelOpen])

  useEffect(() => {
    const wasOpen = prevPanelOpenRef.current
    prevPanelOpenRef.current = isPanelOpen
    // Desktop: closing details should never auto-resume rotation.
    if (wasOpen && !isPanelOpen && !(isMobileLikeInput || isTouchCapableRef.current)) {
      setIsUserPaused(true)
      pauseRotation()
      // Close/backdrop clicks can trail into globe; ignore blank-toggle briefly.
      suppressBlankClickUntilRef.current = Date.now() + 420
      suppressAfterControlsUntilRef.current = Date.now() + 420
    }
  }, [isPanelOpen, isMobileLikeInput, pauseRotation])

  useEffect(() => {
    userPausedRef.current = isUserPaused
  }, [isUserPaused])

  useEffect(() => {
    highlightSearchQueryRef.current = highlightSearchQuery
    searchScopeCompanyRef.current = searchScopeCompany
    searchScopeUseCaseRef.current = searchScopeUseCase
    selectedCompanyIdRef.current = selectedCompanyId
    selectedUseCaseIdRef.current = selectedUseCaseId
  }, [
    highlightSearchQuery,
    searchScopeCompany,
    searchScopeUseCase,
    selectedCompanyId,
    selectedUseCaseId,
  ])

  const hideSharedTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = "0"
      tooltipRef.current.style.visibility = "hidden"
    }
  }, [])

  const showSharedTooltip = useCallback((marker: GlobeHtmlMarkerDatum, anchor: HTMLElement) => {
    const tooltip = tooltipRef.current
    const host = globeContainerRef.current
    if (!tooltip || !host) return

    const rect = anchor.getBoundingClientRect()
    const hostRect = host.getBoundingClientRect()
    const isCompany = marker.kind === "company"
    const title = isCompany
      ? String(marker.name ?? "")
      : useCaseDisplayName(marker as unknown as UseCaseWithCoords)
    const sub = isCompany
      ? [marker.city, marker.headquarters_country].filter(Boolean).join(", ")
      : [marker.city, marker.country].filter(Boolean).join(", ") || String(marker.location ?? "")
    const badge = isCompany
      ? String(marker.industry ?? "")
      : String(marker.sector || marker.industry || "Use case")
    const borderRgb = isCompany ? "34, 211, 238" : SEA_GREEN_RGB
    const titleRgb = isCompany ? "#22d3ee" : SEA_GREEN
    const badgeBg = isCompany ? "rgba(34, 211, 238, 0.15)" : `rgba(${SEA_GREEN_RGB}, 0.18)`
    const badgeColor = isCompany ? "#22d3ee" : SEA_GREEN

    tooltip.style.left = `${rect.left - hostRect.left + rect.width / 2}px`
    tooltip.style.top = `${rect.top - hostRect.top}px`
    tooltip.style.borderColor = `rgba(${borderRgb}, 0.5)`
    tooltip.style.boxShadow = `0 0 20px rgba(${borderRgb}, 0.3)`
    tooltip.innerHTML = `
      <div style="margin-bottom: 4px; max-width: 100%; word-wrap: break-word; overflow-wrap: anywhere; font-size: 14px; font-weight: 600; line-height: 1.35; color: ${titleRgb};">
        ${title}
      </div>
      ${
        sub
          ? `<div style="margin-bottom: 6px; word-wrap: break-word; overflow-wrap: anywhere; font-size: 12px; color: #94a3b8;">${sub}</div>`
          : ""
      }
      <div style="display: inline-block; max-width: 100%; word-wrap: break-word; overflow-wrap: anywhere; border-radius: 4px; padding: 3px 8px; font-size: 11px; color: ${badgeColor}; background: ${badgeBg};">
        ${badge}
      </div>
    `
    tooltip.style.opacity = "1"
    tooltip.style.visibility = "visible"
  }, [])

  const applyMarkerVisualState = useCallback(
    (container: HTMLDivElement, dot: HTMLDivElement, marker: GlobeHtmlMarkerDatum) => {
      const q = highlightSearchQueryRef.current.trim().toLowerCase()
      const isCompany = marker.kind === "company"
      const inSearchScope = isCompany ? searchScopeCompanyRef.current : searchScopeUseCaseRef.current
      const haystack = isCompany
        ? companySearchHaystack(marker as unknown as CompanyWithCoords)
        : useCaseSearchHaystack(marker as unknown as UseCaseWithCoords)
      const searchApplies = q.length > 0 && inSearchScope
      const isMatch = !searchApplies || haystack.includes(q)
      const selectedId = isCompany ? selectedCompanyIdRef.current : selectedUseCaseIdRef.current
      const isSelected = Boolean(selectedId) && String(marker.id) === String(selectedId)
      const updatedRaw =
        typeof marker.updated_at === "string"
          ? marker.updated_at
          : typeof marker.created_at === "string"
            ? marker.created_at
            : null
      const updatedTs = updatedRaw ? Date.parse(updatedRaw) : NaN
      const isRecent24h =
        !isCompany &&
        Number.isFinite(updatedTs) &&
        Date.now() - updatedTs <= 24 * 60 * 60 * 1000
      const isFarView = cameraAltitude >= FAR_VIEW_ALTITUDE
      const mobile = isMobileLikeInput
      const cyanSelected =
        "0 0 0 2px rgba(34, 211, 238, 0.95), 0 0 14px 4px rgba(34, 211, 238, 0.45)"
      const greenSelected = `0 0 0 2px rgba(${SEA_GREEN_RGB}, 0.95), 0 0 14px 4px rgba(${SEA_GREEN_RGB}, 0.4)`
      const dotGlow = isCompany ? (isSelected ? cyanSelected : "none") : isSelected ? greenSelected : "none"
      const recentRing = "0 0 0 1.1px rgba(254, 249, 195, 0.78)"
      const baseDotShadow =
        isRecent24h ? (dotGlow === "none" ? recentRing : `${dotGlow}, ${recentRing}`) : dotGlow
      const dotShadow =
        mobile || (isFarView && !isSelected && !isRecent24h)
          ? "none"
          : baseDotShadow
      const shouldPulse =
        !isMobileLikeInput && !(searchApplies && !isMatch) && (isSelected || isRecent24h)
      let dotSize =
        searchApplies && isMatch
          ? isFarView && !isSelected
            ? "10.8px"
            : "12px"
          : isSelected
            ? "12px"
            : isFarView
              ? "8.2px"
              : "9.6px"
      if (mobile) {
        const n = parseFloat(dotSize)
        dotSize = `${Math.max(6.5, n * 0.88)}px`
      }
      const selectionRing = isCompany
        ? "outline: 2px solid rgba(255,255,255,0.85); outline-offset: 4px;"
        : `outline: 2px solid rgba(${SEA_GREEN_RGB},0.9); outline-offset: 4px;`

      if (mobile) {
        container.style.opacity = searchApplies && !isMatch ? "0.32" : "1"
        container.style.filter = "none"
      } else {
        container.style.opacity = searchApplies && !isMatch ? "0.22" : "1"
        container.style.filter = searchApplies && !isMatch ? "grayscale(0.85)" : "none"
      }
      dot.style.width = dotSize
      dot.style.height = dotSize
      dot.style.boxShadow = dotShadow
      dot.style.animation = shouldPulse ? "pulse 3s ease-in-out infinite" : "none"
      dot.style.outline = isSelected ? (isCompany ? "2px solid rgba(255,255,255,0.85)" : `2px solid rgba(${SEA_GREEN_RGB},0.9)`) : "none"
      dot.style.outlineOffset = isSelected ? "4px" : "0px"
      if (mobile && isRecent24h && !isSelected) {
        dot.style.outline = "1px solid rgba(254, 249, 195, 0.65)"
        dot.style.outlineOffset = "1px"
      }
      dot.dataset.selected = isSelected ? "1" : "0"
      dot.dataset.match = isMatch ? "1" : "0"
      dot.dataset.searchApplies = searchApplies ? "1" : "0"
      dot.dataset.recent = isRecent24h ? "1" : "0"
      dot.dataset.selectionRing = selectionRing
    },
    [cameraAltitude, isMobileLikeInput]
  )

  useEffect(() => {
    if (isMobileLikeInput) {
      hideSharedTooltip()
    }
  }, [hideSharedTooltip, isMobileLikeInput])

  useEffect(() => {
    flyToNonceRef.current = flyToNonce
  }, [flyToNonce])

  // Pause/resume rotation based on panel state + user toggle state
  useEffect(() => {
    if (isMobileLikeInput || isTouchCapableRef.current) {
      if (isPanelOpen || mobileAutoRotateLocked) {
        pauseRotation()
      } else {
        resumeRotation()
      }
      return
    }
    if (isPanelOpen || isUserPaused) {
      pauseRotation()
    } else {
      resumeRotation()
    }
  }, [
    isMobileLikeInput,
    isPanelOpen,
    isUserPaused,
    mobileAutoRotateLocked,
    pauseRotation,
    resumeRotation,
  ])

  // Detach OrbitControls listeners on unmount
  useEffect(() => {
    return () => {
      if (mobileInteractionEndTimerRef.current !== null) {
        window.clearTimeout(mobileInteractionEndTimerRef.current)
        mobileInteractionEndTimerRef.current = null
      }
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

  // Mobile-like input devices (no hover + coarse pointer): reduce DOM + animation work.
  // This avoids degrading touchscreen laptops that still have hover-capable input.
  useEffect(() => {
    if (!isClient) return
    const mql =
      window.matchMedia?.("(hover: none) and (pointer: coarse)") ?? null
    const update = () => setIsMobileLikeInput(Boolean(mql?.matches))
    update()
    if (!mql?.addEventListener) return
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    const next = (window.navigator?.maxTouchPoints ?? 0) > 0
    isTouchCapableRef.current = next
    setIsTouchCapable(next)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    applyRendererPixelRatio()
  }, [applyRendererPixelRatio, dimensions.height, dimensions.width, isClient])

  // Mobile Safari can occasionally miss OrbitControls "change" events during pinch zoom.
  // Poll POV altitude as a lightweight fallback so LOD + debug HUD stay in sync.
  useEffect(() => {
    if (!isClient) return
    const syncAltitude = () => {
      const pov = globeRef.current?.pointOfView?.()
      if (!pov || typeof pov.altitude !== "number") return
      setCameraAltitude((prev) => {
        const prevB = cameraAltitudeJitterBucket(prev)
        const nextB = cameraAltitudeJitterBucket(pov.altitude)
        return prevB !== nextB ? pov.altitude : prev
      })
    }
    syncAltitude()
    const timer = window.setInterval(syncAltitude, 120)
    return () => window.clearInterval(timer)
  }, [isClient])

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
      lockMobileAutoRotate()
      if (isMobileLikeInput) {
        suppressAfterControlsUntilRef.current = Date.now() + 700
      }
      if (mobileInteractionEndTimerRef.current !== null) {
        window.clearTimeout(mobileInteractionEndTimerRef.current)
        mobileInteractionEndTimerRef.current = null
      }
      if (isMobileLikeInput) {
        setIsMobileInteracting(true)
      }
      pauseRotation()
    }
    let rafId = 0
    const onChange = () => {
      if (isMobileLikeInput) {
        // Keep extending suppression while gesture is in progress.
        suppressAfterControlsUntilRef.current = Date.now() + 420
      }
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        const pov = globeRef.current?.pointOfView?.()
        if (pov && typeof pov.altitude === "number") {
          setCameraAltitude((prev) => {
            const next = pov.altitude
            const prevB = cameraAltitudeJitterBucket(prev)
            const nextB = cameraAltitudeJitterBucket(next)
            return prevB !== nextB ? next : prev
          })
        }
      })
    }
    const onEnd = () => {
      // Keep paused after a manual drag; users can explicitly toggle rotation via blank click.
      pauseRotation()
      // Pinch/zoom end can emit trailing clicks on mobile; block blank-toggle longer than a single frame.
      suppressBlankClickUntilRef.current = Date.now() + 420
      if (isMobileLikeInput) {
        suppressAfterControlsUntilRef.current = Date.now() + 900
      }
      if (isMobileLikeInput) {
        if (mobileInteractionEndTimerRef.current !== null) {
          window.clearTimeout(mobileInteractionEndTimerRef.current)
        }
        mobileInteractionEndTimerRef.current = window.setTimeout(() => {
          setIsMobileInteracting(false)
          mobileInteractionEndTimerRef.current = null
        }, 140)
      }
      onChange()
    }

    controls.addEventListener("start", onStart)
    controls.addEventListener("end", onEnd)
    controls.addEventListener("change", onChange)
    controlsListenersRef.current = { controls, onStart, onEnd, onChange }

    // Cap DPR to reduce GPU fill-rate, especially on desktop retina displays.
    applyRendererPixelRatio()

    applyPragueViewAndRotation()
    requestAnimationFrame(() => {
      applyPragueViewAndRotation()
    })
  }, [
    applyPragueViewAndRotation,
    applyRendererPixelRatio,
    isMobileLikeInput,
    lockMobileAutoRotate,
    pauseRotation,
  ])

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

  // Keep marker data stable; search/selection visual updates are applied directly to DOM nodes.
  const htmlElementsData = useMemo(() => {
    if (!markersReady) return []
    const companyMarkers = searchScopeCompany
      ? jitteredCompanies.map((c) => ({
          kind: "company" as const,
          ...c,
        }))
      : []
    const useCaseMarkers = searchScopeUseCase
      ? jitteredUseCases.map((u) => ({
          kind: "use_case" as const,
          ...u,
        }))
      : []
    return [...companyMarkers, ...useCaseMarkers]
  }, [
    markersReady,
    jitteredCompanies,
    jitteredUseCases,
    searchScopeCompany,
    searchScopeUseCase,
  ])

  useEffect(() => {
    const host = globeContainerRef.current
    if (!host) return
    const markers = Array.from(
      host.querySelectorAll<HTMLDivElement>(".company-marker, .use-case-marker")
    )
    const chunk = isMobileLikeInput ? 64 : 400
    let i = 0
    let raf = 0
    let cancelled = false
    const runChunk = () => {
      if (cancelled) return
      const end = Math.min(i + chunk, markers.length)
      for (; i < end; i++) {
        const container = markers[i]
        const dot = container.firstElementChild
        if (!(dot instanceof HTMLDivElement)) continue
        const raw = container.dataset.marker
        if (!raw) continue
        try {
          applyMarkerVisualState(container, dot, JSON.parse(raw) as GlobeHtmlMarkerDatum)
        } catch {
          // Ignore stale marker payloads during remounts.
        }
      }
      if (i < markers.length) {
        raf = requestAnimationFrame(runChunk)
      }
    }
    runChunk()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [
    applyMarkerVisualState,
    highlightSearchQuery,
    isMobileLikeInput,
    searchScopeCompany,
    searchScopeUseCase,
    selectedCompanyId,
    selectedUseCaseId,
    selectionRevision,
  ])

  const mobileWebglStyleOpts = useMemo(
    () => ({
      highlightSearchQuery,
      searchScopeCompany,
      searchScopeUseCase,
      selectedCompanyId,
      selectedUseCaseId,
      cameraAltitude,
    }),
    [
      highlightSearchQuery,
      searchScopeCompany,
      searchScopeUseCase,
      selectedCompanyId,
      selectedUseCaseId,
      cameraAltitude,
    ]
  )

  const mobilePointsData = useMemo(() => {
    if (!isMobileLikeInput) return htmlElementsData
    if (htmlElementsData.length <= 1) return htmlElementsData

    const { cellDeg, maxPerCell, keepRatio, maxTotal, useCaseKeepRatio, minVisible } =
      mobileLodConfig(cameraAltitude)
    const ultraFarView = cameraAltitude >= 3.05
    const interactionFar = isMobileInteracting && cameraAltitude >= 2.35
    const activeCellDeg = interactionFar ? cellDeg * 1.4 : cellDeg
    const activeMaxPerCell = interactionFar ? 1 : maxPerCell
    const activeKeepRatio = interactionFar ? Math.min(keepRatio, 0.08) : keepRatio
    const activeUseCaseKeepRatio = interactionFar
      ? Math.min(useCaseKeepRatio, 0.02)
      : useCaseKeepRatio
    const activeMaxTotal = interactionFar ? Math.min(maxTotal, 48) : maxTotal
    const selectedCompany = selectedCompanyId ? String(selectedCompanyId) : null
    const selectedUseCase = selectedUseCaseId ? String(selectedUseCaseId) : null
    const grouped = new Map<string, GlobeHtmlMarkerDatum[]>()

    for (const marker of htmlElementsData) {
      const latKey = Math.round(marker.lat / activeCellDeg)
      const lngKey = Math.round(marker.lng / activeCellDeg)
      const cellKey = `${latKey}:${lngKey}`
      const bucket = grouped.get(cellKey)
      if (bucket) bucket.push(marker)
      else grouped.set(cellKey, [marker])
    }

    const chosen: GlobeHtmlMarkerDatum[] = []
    for (const bucket of grouped.values()) {
      const scored = bucket
        .map((marker) => {
          const state = mobileMarkerMatchState(marker, {
            highlightSearchQuery,
            searchScopeCompany,
            searchScopeUseCase,
            selectedCompanyId,
            selectedUseCaseId,
          })
          const pinnedSelected =
            (marker.kind === "company" && selectedCompany === String(marker.id)) ||
            (marker.kind === "use_case" && selectedUseCase === String(marker.id))
          const score =
            (pinnedSelected || state.isSelected ? 100 : 0) +
            (state.searchApplies && state.isMatch ? 50 : 0) +
            (state.isRecent24h ? 12 : 0) +
            (marker.kind === "company" ? 2 : 1)
          return { marker, score, pinnedSelected }
        })
        .sort((a, b) => b.score - a.score || String(a.marker.id).localeCompare(String(b.marker.id)))

      let kept = 0
      for (const item of scored) {
        if (item.pinnedSelected) {
          chosen.push(item.marker)
          kept += 1
          continue
        }
        if (kept >= activeMaxPerCell) continue
        const hash = stableMarkerHash(`${item.marker.kind}:${item.marker.id}`)
        const kindRatio = item.marker.kind === "use_case" ? activeUseCaseKeepRatio : 1
        if (ultraFarView && item.marker.kind === "use_case" && !item.pinnedSelected) {
          continue
        }
        const finalKeepRatio = activeKeepRatio * kindRatio
        if ((hash % 1000) / 1000 <= finalKeepRatio) {
          chosen.push(item.marker)
          kept += 1
        }
      }
    }

    if (
      selectedCompany &&
      !chosen.some((m) => m.kind === "company" && String(m.id) === selectedCompany)
    ) {
      const fallback = htmlElementsData.find(
        (m) => m.kind === "company" && String(m.id) === selectedCompany
      )
      if (fallback) chosen.push(fallback)
    }
    if (
      selectedUseCase &&
      !chosen.some((m) => m.kind === "use_case" && String(m.id) === selectedUseCase)
    ) {
      const fallback = htmlElementsData.find(
        (m) => m.kind === "use_case" && String(m.id) === selectedUseCase
      )
      if (fallback) chosen.push(fallback)
    }

    if (chosen.length <= activeMaxTotal) {
      if (chosen.length >= minVisible || htmlElementsData.length <= chosen.length) return chosen
      const scoredPool = htmlElementsData
        .map((marker) => {
          const state = mobileMarkerMatchState(marker, {
            highlightSearchQuery,
            searchScopeCompany,
            searchScopeUseCase,
            selectedCompanyId,
            selectedUseCaseId,
          })
          const score =
            (state.isSelected ? 100 : 0) +
            (state.searchApplies && state.isMatch ? 50 : 0) +
            (state.isRecent24h ? 8 : 0) +
            (marker.kind === "company" ? 2 : 1)
          return { marker, score, hash: stableMarkerHash(`${marker.kind}:${marker.id}`) }
        })
        .sort((a, b) => b.score - a.score || a.hash - b.hash)
      const seen = new Set(chosen.map((m) => `${m.kind}:${m.id}`))
      for (const item of scoredPool) {
        if (chosen.length >= Math.min(minVisible, activeMaxTotal)) break
        const key = `${item.marker.kind}:${item.marker.id}`
        if (seen.has(key)) continue
        chosen.push(item.marker)
        seen.add(key)
      }
      if (chosen.length > 0) return chosen
    }

    const selectedSet = new Set<string>()
    if (selectedCompany) selectedSet.add(`company:${selectedCompany}`)
    if (selectedUseCase) selectedSet.add(`use_case:${selectedUseCase}`)

    const scored = chosen
      .map((marker) => {
        const state = mobileMarkerMatchState(marker, {
          highlightSearchQuery,
          searchScopeCompany,
          searchScopeUseCase,
          selectedCompanyId,
          selectedUseCaseId,
        })
        const key = `${marker.kind}:${marker.id}`
        const pinnedSelected = selectedSet.has(key) || state.isSelected
        const score =
          (pinnedSelected ? 100 : 0) +
          (state.searchApplies && state.isMatch ? 50 : 0) +
          (state.isRecent24h ? 10 : 0) +
          (marker.kind === "company" ? 3 : 1)
        return { marker, score, pinnedSelected, hash: stableMarkerHash(key) }
      })
      .sort((a, b) => b.score - a.score || a.hash - b.hash)

    const trimmed: GlobeHtmlMarkerDatum[] = []
    for (const item of scored) {
      if (item.pinnedSelected) {
        trimmed.push(item.marker)
      }
    }
    for (const item of scored) {
      if (trimmed.length >= activeMaxTotal) break
      if (item.pinnedSelected) continue
      trimmed.push(item.marker)
    }
    if (trimmed.length > 0) return trimmed

    // Hard fallback: never return an empty marker set on mobile when source data exists.
    const fallbackTarget = Math.max(24, Math.min(activeMaxTotal, htmlElementsData.length))
    return htmlElementsData.slice(0, fallbackTarget)
  }, [
    cameraAltitude,
    highlightSearchQuery,
    htmlElementsData,
    isMobileLikeInput,
    searchScopeCompany,
    searchScopeUseCase,
    selectedCompanyId,
    selectedUseCaseId,
    isMobileInteracting,
  ])

  const activeHtmlElementsData = useMemo(
    () => (isMobileLikeInput ? [] : htmlElementsData),
    [htmlElementsData, isMobileLikeInput]
  )

  const mobilePointColor = useCallback(
    (obj: object) =>
      mobileWebglPointStyle(obj as GlobeHtmlMarkerDatum, mobileWebglStyleOpts)
        .color,
    [mobileWebglStyleOpts]
  )

  const mobilePointRadius = useCallback(
    (obj: object) =>
      mobileWebglPointStyle(obj as GlobeHtmlMarkerDatum, mobileWebglStyleOpts)
        .radius,
    [mobileWebglStyleOpts]
  )

  const mobilePointAltitude = useCallback(
    (obj: object) =>
      mobileWebglPointStyle(obj as GlobeHtmlMarkerDatum, mobileWebglStyleOpts)
        .altitude,
    [mobileWebglStyleOpts]
  )

  const mobileParticleTextures = useMemo(() => {
    if (!isClient) return undefined
    const mk = (coreColor: string, midColor: string, outerColor: string) => {
      const canvas = document.createElement("canvas")
      canvas.width = 384
      canvas.height = 384
      const ctx = canvas.getContext("2d")
      if (!ctx) return undefined
      const r = canvas.width / 2
      const gradient = ctx.createRadialGradient(r, r, 0, r, r, r)
      gradient.addColorStop(0, coreColor)
      gradient.addColorStop(0.52, midColor)
      gradient.addColorStop(0.9, outerColor)
      gradient.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const texture = new THREE.CanvasTexture(canvas)
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = true
      texture.needsUpdate = true
      return texture
    }
    return {
      company: mk(
        "rgba(14,116,144,1)",
        "rgba(8,145,178,0.9)",
        "rgba(8,145,178,0.24)"
      ),
      useCase: mk(
        "rgba(74,222,128,1)",
        "rgba(34,197,94,0.9)",
        "rgba(34,197,94,0.24)"
      ),
    }
  }, [isClient])
  const mobileFallbackTexture = useMemo(() => new THREE.Texture(), [])

  useEffect(() => {
    return () => {
      mobileParticleTextures?.company?.dispose?.()
      mobileParticleTextures?.useCase?.dispose?.()
      mobileFallbackTexture.dispose?.()
    }
  }, [mobileFallbackTexture, mobileParticleTextures])

  useEffect(() => {
    if (!isClient || !isMobileLikeInput) return
    let raf = 0
    const smoothParticleEdges = () => {
      const scene =
        typeof globeRef.current?.scene === "function"
          ? globeRef.current.scene()
          : null
      if (!scene?.traverse) return
      scene.traverse((obj: any) => {
        if (obj?.__globeObjType !== "particles") return
        const mat = obj.material
        if (!mat) return
        // globe.gl sets alphaTest=0.5 for textured particles, which creates jagged hard edges.
        // For mobile we prefer smooth circular glows.
        mat.alphaTest = 0
        mat.transparent = true
        mat.depthWrite = false
        const maxAniso = globeRef.current?.renderer?.()?.capabilities?.getMaxAnisotropy?.()
        if (mat.map) {
          if (typeof maxAniso === "number" && Number.isFinite(maxAniso)) {
            mat.map.anisotropy = Math.min(8, Math.max(1, maxAniso))
          }
          mat.map.needsUpdate = true
        }
        mat.needsUpdate = true
      })
    }
    raf = window.requestAnimationFrame(() => {
      smoothParticleEdges()
      window.setTimeout(smoothParticleEdges, 80)
    })
    return () => {
      window.cancelAnimationFrame(raf)
    }
  }, [isClient, isMobileLikeInput, mobilePointsData.length])

  const mobileParticlesData = useMemo(
    () => (isMobileLikeInput ? mobilePointsData.map((d) => [d]) : []),
    [isMobileLikeInput, mobilePointsData]
  )

  const firstMarkerFromParticleDatum = useCallback((datum: object): GlobeHtmlMarkerDatum => {
    const arr = datum as GlobeHtmlMarkerDatum[]
    if (Array.isArray(arr) && arr.length > 0) return arr[0]
    return datum as GlobeHtmlMarkerDatum
  }, [])

  const mobileParticleColor = useCallback(
    (datum: object) =>
      mobileWebglPointStyle(firstMarkerFromParticleDatum(datum), mobileWebglStyleOpts).color,
    [firstMarkerFromParticleDatum, mobileWebglStyleOpts]
  )

  const mobileParticleSize = useCallback(
    (datum: object) => {
      const style = mobileWebglPointStyle(firstMarkerFromParticleDatum(datum), mobileWebglStyleOpts)
      const altitude = mobileWebglStyleOpts.cameraAltitude
      const farBoost = altitude >= 2.2 ? 1.34 : altitude >= 1.95 ? 1.18 : 1.05
      const nearBoost =
        altitude <= 0.18
          ? 2.15
          : altitude <= 0.3
            ? 1.72
            : altitude <= 0.5
              ? 1.35
              : 1
      // particlesSize is screen-space px when sizeAttenuation=false.
      // Keep close zoom touch-friendly, especially around alt ~= 0.13.
      return clamp(style.radius * 40 * farBoost * nearBoost, 5.2, 17.5)
    },
    [firstMarkerFromParticleDatum, mobileWebglStyleOpts]
  )

  const mobileParticleAltitude = useCallback(
    (datum: object) =>
      mobileWebglPointStyle(firstMarkerFromParticleDatum(datum), mobileWebglStyleOpts).altitude,
    [firstMarkerFromParticleDatum, mobileWebglStyleOpts]
  )

  const mobileParticleTextureByDatum = useCallback(
    (datum: object) => {
      const marker = firstMarkerFromParticleDatum(datum)
      if (!mobileParticleTextures) return mobileFallbackTexture
      return (
        (marker.kind === "company"
          ? mobileParticleTextures.company
          : mobileParticleTextures.useCase) ?? mobileFallbackTexture
      )
    },
    [firstMarkerFromParticleDatum, mobileFallbackTexture, mobileParticleTextures]
  )

  const handleWebglPointClick = useCallback(
    (point: object) => {
      lockMobileAutoRotate()
      const d = point as GlobeHtmlMarkerDatum
      suppressBlankClickUntilRef.current = Date.now() + 280
      pauseRotation()
      hideSharedTooltip()
      const isCompany = d.kind === "company"
      const { kind: _k, ...rest } = d
      if (isCompany) {
        const c = rest as CompanyWithCoords
        const orig = companies.find((co) => String(co.id) === String(c.id))
        onCompanyClick(orig ? { ...c, lat: orig.lat, lng: orig.lng } : c)
      } else {
        const u = rest as UseCaseWithCoords
        const orig = useCases.find((x) => String(x.id) === String(u.id))
        onUseCaseClick(orig ? { ...u, lat: orig.lat, lng: orig.lng } : u)
      }
    },
    [
      companies,
      hideSharedTooltip,
      onCompanyClick,
      onUseCaseClick,
      pauseRotation,
      useCases,
      lockMobileAutoRotate,
    ]
  )

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
      const currentAltitude =
        typeof globeRef.current?.pointOfView === "function"
          ? globeRef.current.pointOfView()?.altitude
          : undefined
      globeRef.current?.pointOfView(
        {
          lat: flyTo.lat,
          lng: flyTo.lng,
          altitude:
            flyTo.altitude ??
            (typeof currentAltitude === "number" ? currentAltitude : FLY_ALTITUDE),
        },
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
      onTouchStartCapture={handleTouchStartCapture}
      onTouchMoveCapture={handleTouchMoveCapture}
      onTouchEndCapture={handleTouchEndCapture}
    >
      <Globe
        ref={globeRef}
        onGlobeReady={handleGlobeReady}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl=""
        showAtmosphere={!isMobileLikeInput}
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.15}
        // Mobile prototype: 2D circular particles (sprites), desktop keeps HTML markers.
        pointsData={[]}
        pointLat="lat"
        pointLng="lng"
        pointColor={mobilePointColor}
        pointRadius={mobilePointRadius}
        pointAltitude={mobilePointAltitude}
        pointsTransitionDuration={isMobileLikeInput ? 0 : 1000}
        pointResolution={
          isMobileLikeInput
            ? isMobileInteracting
              ? 10
              : 14
            : 12
        }
        onPointClick={undefined}
        particlesData={mobileParticlesData}
        particleLat="lat"
        particleLng="lng"
        particleAltitude={mobileParticleAltitude}
        particlesSize={mobileParticleSize}
        particlesColor={mobileParticleColor}
        particlesTexture={mobileParticleTextureByDatum}
        particlesSizeAttenuation={isMobileLikeInput ? false : true}
        onParticleClick={isMobileLikeInput ? handleWebglPointClick : undefined}
        onGlobeClick={isMobileLikeInput ? handleGlobeSurfaceClick : undefined}
        // Polygons layer for countries
        polygonsData={geoJsonData.features}
        polygonCapColor={() =>
          isMobileLikeInput ? "rgba(20, 40, 80, 0.34)" : "rgba(20, 40, 80, 0.7)"
        }
        polygonSideColor={() => "rgba(20, 40, 80, 0.3)"}
        polygonStrokeColor={() =>
          isMobileLikeInput ? "rgba(34, 211, 238, 0.12)" : "#22d3ee"
        }
        polygonAltitude={isMobileLikeInput ? 0.006 : 0.01}
        polygonLabel={
          isMobileLikeInput
            ? () => ""
            : (d: any) => `
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
      `
        }

        // HTML markers: glow dot + hover tooltip; search dims non-matches
        htmlElementsData={activeHtmlElementsData}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={(obj: object) => {
          const d = obj as GlobeHtmlMarkerDatum
          const isCompany = d.kind === "company"

          const container = document.createElement("div")
          container.className = isCompany ? "company-marker" : "use-case-marker"
          container.dataset.marker = JSON.stringify(d)
          container.style.cssText = `
            cursor: pointer;
            transform: translate(-50%, -50%);
            pointer-events: auto;
            position: relative;
            z-index: 1;
            opacity: 1;
            filter: none;
            transition: ${isMobileLikeInput ? "none" : "opacity 0.25s ease, filter 0.25s ease"};
          `

          const dot = document.createElement("div")
          const dotGradient = isCompany
            ? "radial-gradient(circle, #22d3ee 0%, rgba(34, 211, 238, 0.8) 50%, transparent 100%)"
            : `radial-gradient(circle, ${SEA_GREEN} 0%, rgba(${SEA_GREEN_RGB}, 0.85) 50%, transparent 100%)`
          dot.style.cssText = `
            width: 9.6px;
            height: 9.6px;
            background: ${dotGradient};
            border-radius: 50%;
            box-shadow: none;
            animation: none;
            transition: ${
              isMobileLikeInput
                ? "none"
                : "transform 0.2s ease, width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease, outline 0.2s ease"
            };
            outline: none;
          `

          container.appendChild(dot)
          applyMarkerVisualState(container, dot, d)

          if (!isMobileLikeInput) {
            const syncTooltipPosition = () => {
              showSharedTooltip(d, container)
            }

            container.addEventListener("mouseenter", () => {
              dot.style.transform = "scale(1.5)"
              syncTooltipPosition()
              pauseRotation()
            })

            container.addEventListener("mouseleave", () => {
              dot.style.transform = "scale(1)"
              hideSharedTooltip()
              if (!isPanelOpenRef.current && !userPausedRef.current) {
                resumeRotation()
              }
            })
          }

          if (!isMobileLikeInput) {
            container.addEventListener("wheel", forwardMarkerWheelToGlobe, {
              passive: false,
            })
          }

          container.addEventListener("click", (e) => {
            e.stopPropagation()
            pauseRotation()
          hideSharedTooltip()
            const {
              kind: _k,
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
      <div
        ref={tooltipRef}
        className="pointer-events-none invisible absolute z-20 w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-[calc(100%+20px)] rounded-[10px] border bg-[rgba(2,10,24,0.95)] px-4 py-3 text-white opacity-0 shadow-[0_0_20px] backdrop-blur-xl transition-opacity duration-200"
      />
    </div>
  )
}
