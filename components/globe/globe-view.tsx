"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { CountryData } from "@/lib/types"

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

interface GlobeViewProps {
  countries: CountryData[]
  onCountryClick: (country: CountryData) => void
}

// GeoJSON URL for countries
const COUNTRIES_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"

export function GlobeView({ countries, onCountryClick }: GlobeViewProps) {
  const globeRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [geoJsonData, setGeoJsonData] = useState<{ features: any[] }>({ features: [] })
  const [markersReady, setMarkersReady] = useState(false)
  
  // Ensure markers render after globe is ready
  useEffect(() => {
    if (countries.length > 0 && isClient) {
      const timer = setTimeout(() => setMarkersReady(true), 500)
      return () => clearTimeout(timer)
    }
  }, [countries, isClient])

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

  useEffect(() => {
    if (globeRef.current) {
      // Auto-rotate
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 0.3
      
      // Set initial position
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 })
    }
  }, [isClient])

  const handlePointClick = useCallback((point: any) => {
    const countryData = countries.find(c => c.country === point.country)
    if (countryData) {
      onCountryClick(countryData)
    }
  }, [countries, onCountryClick])

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
    <Globe
      ref={globeRef}
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

      // HTML elements layer for country markers with company counts
      htmlElementsData={markersReady ? countries : []}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude={0.02}
      htmlElement={(d: any) => {
        const container = document.createElement("div")
        container.style.cssText = `
          cursor: pointer;
          transform: translate(-50%, -50%);
        `
        const companyCount = d.companies?.length || 0
        container.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: radial-gradient(circle, #22d3ee 0%, rgba(34, 211, 238, 0.6) 50%, transparent 100%);
              border-radius: 50%;
              box-shadow: 0 0 8px 2px rgba(34, 211, 238, 0.5);
              animation: pulse 2.5s ease-in-out infinite;
            "></div>
            <div style="
              background: rgba(2, 10, 24, 0.9);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(34, 211, 238, 0.4);
              border-radius: 12px;
              padding: 2px 8px;
              font-size: 10px;
              font-weight: 600;
              color: #22d3ee;
              font-family: system-ui, sans-serif;
              white-space: nowrap;
            ">${companyCount} ${companyCount === 1 ? 'company' : 'companies'}</div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          </style>
        `
        container.onclick = () => {
          onCountryClick(d)
        }
        return container
      }}

      // Labels layer for tooltips
      labelsData={countries}
      labelLat="lat"
      labelLng="lng"
      labelText={() => ""}
      labelSize={0}
      labelDotRadius={0}
      labelAltitude={0.025}
      labelLabel={(d: any) => `
        <div style="
          background: rgba(2, 10, 24, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.5);
          border-radius: 10px;
          padding: 12px 16px;
          color: white;
          font-family: system-ui, sans-serif;
          min-width: 160px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
        ">
          <div style="font-weight: 600; font-size: 14px; color: #22d3ee; margin-bottom: 4px;">${d.country}</div>
          <div style="font-size: 12px; color: #94a3b8;">${d.companies?.length || 0} AI ${d.companies?.length === 1 ? 'Company' : 'Companies'}</div>
          <div style="
            font-size: 11px; 
            margin-top: 8px; 
            padding: 3px 8px;
            background: rgba(34, 211, 238, 0.15);
            border-radius: 4px;
            color: #22d3ee;
            display: inline-block;
          ">Click to view details</div>
        </div>
      `}
    />
  )
}
