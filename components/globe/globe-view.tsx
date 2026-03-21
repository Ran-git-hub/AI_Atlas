"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import dynamic from "next/dynamic"
import type { CompanyWithCoords } from "@/lib/types"

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

interface GlobeViewProps {
  companies: CompanyWithCoords[]
  onCompanyClick: (company: CompanyWithCoords) => void
  isPanelOpen?: boolean
}

// GeoJSON URL for countries
const COUNTRIES_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
const GLOBE_ROTATION_SPEED = 0.3
const PRAGUE_VIEW = { lat: 50.0755, lng: 14.4378, altitude: 2.2 }

export function GlobeView({ companies, onCompanyClick, isPanelOpen = false }: GlobeViewProps) {
  const globeRef = useRef<any>(null)
  const globeContainerRef = useRef<HTMLDivElement>(null)
  const controlsListenersRef = useRef<{
    controls: { removeEventListener: (ev: string, fn: () => void) => void }
    onStart: () => void
    onEnd: () => void
  } | null>(null)
  const isPanelOpenRef = useRef(isPanelOpen)
  const userPausedRef = useRef(false)
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [geoJsonData, setGeoJsonData] = useState<{ features: any[] }>({ features: [] })
  const [markersReady, setMarkersReady] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)

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

  /** Initial load: face Prague + auto-rotate unless panel open or user paused blank-toggle. */
  const applyPragueViewAndRotation = useCallback(() => {
    const globe = globeRef.current
    const controls = globe?.controls()
    if (!controls) return
    controls.autoRotateSpeed = GLOBE_ROTATION_SPEED
    globe.pointOfView(PRAGUE_VIEW)
    controls.autoRotate = !(isPanelOpenRef.current || userPausedRef.current)
  }, [])

  const handleBlankAreaClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    if (target.closest(".company-marker")) return
    if (!isPanelOpenRef.current) {
      setIsUserPaused((prev) => !prev)
    }
  }, [])
  
  useEffect(() => {
    isPanelOpenRef.current = isPanelOpen
  }, [isPanelOpen])

  useEffect(() => {
    userPausedRef.current = isUserPaused
  }, [isUserPaused])

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
        controlsListenersRef.current = null
      }
    }
  }, [])
  
  // Ensure markers render after globe is ready
  useEffect(() => {
    if (companies.length > 0 && isClient) {
      const timer = setTimeout(() => setMarkersReady(true), 500)
      return () => clearTimeout(timer)
    }
  }, [companies, isClient])

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
      if (!controls) return
      controls.autoRotateSpeed = GLOBE_ROTATION_SPEED
      globe.pointOfView(PRAGUE_VIEW)
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
      controlsListenersRef.current = null
    }

    applyPragueViewAndRotation()

    const onStart = () => {
      pauseRotation()
    }
    const onEnd = () => {
      queueMicrotask(() => {
        if (!isPanelOpenRef.current && !userPausedRef.current) {
          resumeRotation()
        }
      })
    }

    controls.addEventListener("start", onStart)
    controls.addEventListener("end", onEnd)
    controlsListenersRef.current = { controls, onStart, onEnd }

    applyPragueViewAndRotation()
    requestAnimationFrame(() => {
      applyPragueViewAndRotation()
    })
  }, [applyPragueViewAndRotation, pauseRotation, resumeRotation])

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
    <div ref={globeContainerRef} className="h-full w-full" onClickCapture={handleBlankAreaClickCapture}>
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

        // HTML elements layer for company markers with hover and click
        htmlElementsData={markersReady ? companies : []}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.02}
        htmlElement={(d: any) => {
          const container = document.createElement("div")
          container.className = "company-marker"
          container.style.cssText = `
          cursor: pointer;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          position: relative;
        `
          
          // Create marker dot
          const dot = document.createElement("div")
          dot.style.cssText = `
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, #22d3ee 0%, rgba(34, 211, 238, 0.8) 50%, transparent 100%);
          border-radius: 50%;
          box-shadow: 0 0 6px 2px rgba(34, 211, 238, 0.55);
          animation: pulse 3s ease-in-out infinite;
          transition: transform 0.2s ease;
        `
          
          // Create tooltip
          const tooltip = document.createElement("div")
          tooltip.style.cssText = `
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(2, 10, 24, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.5);
          border-radius: 10px;
          padding: 12px 16px;
          color: white;
          font-family: system-ui, sans-serif;
          min-width: 200px;
          max-width: 280px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          z-index: 1000;
          white-space: nowrap;
        `
          tooltip.innerHTML = `
          <div style="font-weight: 600; font-size: 14px; color: #22d3ee; margin-bottom: 4px;">${d.name}</div>
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
          
          container.appendChild(dot)
          container.appendChild(tooltip)
          
          // Hover events - pause rotation on hover
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
          
          // Click event - pause rotation and open panel
          container.addEventListener("click", (e) => {
            e.stopPropagation()
            pauseRotation()
            onCompanyClick(d)
          })
          
          return container
        }}
      />
    </div>
  )
}
