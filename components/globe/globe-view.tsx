"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

export interface AICaseData {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  category: string
  description: string
  image: string
  link: string
}

// AI case data with real coordinates - 50 cases worldwide
export const aiCases: AICaseData[] = [
  // North America
  { id: "1", name: "OpenAI GPT-5", city: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194, category: "LLM", description: "OpenAI's latest generation large language model with enhanced reasoning and multimodal understanding capabilities, transforming human-computer interaction.", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop", link: "https://openai.com" },
  { id: "2", name: "Anthropic Claude", city: "San Francisco", country: "USA", lat: 37.7649, lng: -122.4294, category: "LLM", description: "AI safety-focused large language model known for deep thinking and long-context processing capabilities.", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=300&fit=crop", link: "https://anthropic.com" },
  { id: "3", name: "Midjourney", city: "San Francisco", country: "USA", lat: 37.7849, lng: -122.4094, category: "AI Art", description: "Leading AI image generation platform that creates stunning artwork from text descriptions.", image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=300&fit=crop", link: "https://midjourney.com" },
  { id: "4", name: "Tesla FSD", city: "Austin", country: "USA", lat: 30.2672, lng: -97.7431, category: "Autonomous Driving", description: "Tesla's Full Self-Driving system using pure vision approach for end-to-end autonomous driving.", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop", link: "https://tesla.com" },
  { id: "5", name: "Waymo", city: "Mountain View", country: "USA", lat: 37.3861, lng: -122.0839, category: "Autonomous Driving", description: "Alphabet's autonomous driving company operating robotaxi services in multiple cities.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", link: "https://waymo.com" },
  { id: "6", name: "NVIDIA AI", city: "Santa Clara", country: "USA", lat: 37.3541, lng: -121.9552, category: "AI Chips", description: "World's leading AI computing platform, powering the training and inference of most AI models.", image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=300&fit=crop", link: "https://nvidia.com" },
  { id: "7", name: "Meta AI", city: "Menlo Park", country: "USA", lat: 37.4530, lng: -122.1817, category: "LLM", description: "Meta's LLaMA open-source model series, advancing the open AI ecosystem.", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop", link: "https://ai.meta.com" },
  { id: "8", name: "Google Gemini", city: "Mountain View", country: "USA", lat: 37.4220, lng: -122.0841, category: "LLM", description: "Google's most powerful multimodal AI model integrating search, understanding and generation.", image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=300&fit=crop", link: "https://deepmind.google" },
  { id: "9", name: "Microsoft Copilot", city: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321, category: "AI Assistant", description: "Microsoft's AI assistant integrated across all products, redefining workplace productivity.", image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop", link: "https://copilot.microsoft.com" },
  { id: "10", name: "Amazon Bedrock", city: "Seattle", country: "USA", lat: 47.6162, lng: -122.3421, category: "Cloud Services", description: "AWS foundation model service platform providing secure and controllable AI capabilities for enterprises.", image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=300&fit=crop", link: "https://aws.amazon.com/bedrock" },
  { id: "11", name: "Cohere", city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, category: "Enterprise AI", description: "Enterprise-focused NLP solutions company offering secure private deployment options.", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop", link: "https://cohere.ai" },
  { id: "12", name: "Mila Institute", city: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673, category: "Research", description: "World-leading AI research institute founded by Yoshua Bengio.", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=300&fit=crop", link: "https://mila.quebec" },
  // Europe
  { id: "13", name: "DeepMind AlphaFold", city: "London", country: "UK", lat: 51.5074, lng: -0.1278, category: "Biotech", description: "Predicted over 200 million protein structures, revolutionizing drug development.", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop", link: "https://deepmind.com" },
  { id: "14", name: "Stability AI", city: "London", country: "UK", lat: 51.5174, lng: -0.1378, category: "AI Art", description: "Creator of Stable Diffusion, advancing open-source AI image generation.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", link: "https://stability.ai" },
  { id: "15", name: "Mistral AI", city: "Paris", country: "France", lat: 48.8566, lng: 2.3522, category: "LLM", description: "Europe's most influential AI startup, known for efficient open-source models.", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop", link: "https://mistral.ai" },
  { id: "16", name: "Hugging Face", city: "Paris", country: "France", lat: 48.8666, lng: 2.3422, category: "Open Source", description: "Largest AI model open-source community, hosting hundreds of thousands of models and datasets.", image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&h=300&fit=crop", link: "https://huggingface.co" },
  { id: "17", name: "Aleph Alpha", city: "Heidelberg", country: "Germany", lat: 49.3988, lng: 8.6724, category: "Enterprise AI", description: "Leading European enterprise AI company focused on explainable and trustworthy AI.", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop", link: "https://aleph-alpha.com" },
  { id: "18", name: "SAP AI", city: "Walldorf", country: "Germany", lat: 49.3063, lng: 8.6428, category: "Enterprise Software", description: "Deep AI integration into enterprise resource management, enhancing business automation.", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop", link: "https://sap.com" },
  { id: "19", name: "ETH Zurich AI", city: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, category: "Research", description: "Europe's top technical university AI research center with key contributions to ML theory.", image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=300&fit=crop", link: "https://ethz.ch" },
  { id: "20", name: "Spotify AI", city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, category: "Recommendation", description: "AI-powered personalized music recommendations for hundreds of millions of users.", image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop", link: "https://spotify.com" },
  { id: "21", name: "ASML AI", city: "Veldhoven", country: "Netherlands", lat: 51.4416, lng: 5.4697, category: "Semiconductor", description: "AI applications in lithography machine precision control and defect detection.", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", link: "https://asml.com" },
  // Asia
  { id: "22", name: "Baidu ERNIE Bot", city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, category: "LLM", description: "Baidu's knowledge-enhanced large language model supporting Chinese understanding and generation.", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop", link: "https://yiyan.baidu.com" },
  { id: "23", name: "ByteDance AI", city: "Beijing", country: "China", lat: 39.9142, lng: 116.3974, category: "Recommendation", description: "Core recommendation algorithms powering Douyin and TikTok products.", image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop", link: "https://bytedance.com" },
  { id: "24", name: "Zhipu AI", city: "Beijing", country: "China", lat: 39.8942, lng: 116.4174, category: "LLM", description: "Developer of ChatGLM model series, advancing Chinese open-source LLM ecosystem.", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop", link: "https://zhipuai.cn" },
  { id: "25", name: "Alibaba Qwen", city: "Hangzhou", country: "China", lat: 30.2741, lng: 120.1551, category: "LLM", description: "Alibaba's large language model excelling in multilingual understanding and code generation.", image: "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?w=400&h=300&fit=crop", link: "https://tongyi.aliyun.com" },
  { id: "26", name: "Tencent Hunyuan", city: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579, category: "LLM", description: "Tencent's proprietary large model deeply integrated with WeChat ecosystem.", image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=300&fit=crop", link: "https://hunyuan.tencent.com" },
  { id: "27", name: "Huawei Pangu", city: "Shenzhen", country: "China", lat: 22.5531, lng: 114.0679, category: "Industry AI", description: "Huawei's industry-focused large model series covering weather, mining, and finance.", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop", link: "https://huawei.com" },
  { id: "28", name: "SenseTime", city: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, category: "Computer Vision", description: "Asia's leading AI company with extensive applications in facial recognition and autonomous driving.", image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=300&fit=crop", link: "https://sensetime.com" },
  { id: "29", name: "iFlytek", city: "Hefei", country: "China", lat: 31.8206, lng: 117.2272, category: "Voice AI", description: "China's leading voice AI company with internationally competitive speech recognition technology.", image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=300&fit=crop", link: "https://iflytek.com" },
  { id: "30", name: "Samsung AI", city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, category: "Consumer Electronics", description: "Samsung Galaxy AI deeply integrating artificial intelligence into smartphones.", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop", link: "https://samsung.com" },
  { id: "31", name: "Naver AI", city: "Seongnam", country: "South Korea", lat: 37.3595, lng: 127.1053, category: "Search Engine", description: "Korea's largest search engine AI research division, developer of HyperCLOVA.", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop", link: "https://naver.com" },
  { id: "32", name: "University of Tokyo AI", city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, category: "Research", description: "Japan's top AI research institution with significant contributions to robotics.", image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=300&fit=crop", link: "https://www.u-tokyo.ac.jp" },
  { id: "33", name: "Preferred Networks", city: "Tokyo", country: "Japan", lat: 35.6862, lng: 139.6603, category: "Deep Learning", description: "Japan's most valuable AI startup focused on industrial and robotics applications.", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop", link: "https://preferred.jp" },
  { id: "34", name: "Sony AI", city: "Tokyo", country: "Japan", lat: 35.6662, lng: 139.6403, category: "Gaming AI", description: "Sony AI Research Lab focused on gaming and entertainment AI applications.", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop", link: "https://ai.sony" },
  { id: "35", name: "TSMC AI", city: "Hsinchu", country: "Taiwan", lat: 24.8138, lng: 120.9675, category: "Semiconductor", description: "World's most advanced chip manufacturer with dominant AI chip production capacity.", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", link: "https://tsmc.com" },
  { id: "36", name: "Infosys AI", city: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946, category: "Enterprise Services", description: "Indian IT giant's AI transformation providing AI solutions for global enterprises.", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop", link: "https://infosys.com" },
  { id: "37", name: "Flipkart AI", city: "Bangalore", country: "India", lat: 12.9816, lng: 77.6046, category: "E-commerce AI", description: "India's largest e-commerce platform AI system serving hundreds of millions of consumers.", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", link: "https://flipkart.com" },
  { id: "38", name: "Grab AI", city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, category: "Mobility", description: "Southeast Asia's super app AI brain optimizing ride-hailing and delivery efficiency.", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop", link: "https://grab.com" },
  { id: "39", name: "Sea AI", city: "Singapore", country: "Singapore", lat: 1.3621, lng: 103.8298, category: "Gaming/E-commerce", description: "Southeast Asian tech giant with AI driving Shopee and Garena growth.", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop", link: "https://sea.com" },
  // Middle East
  { id: "40", name: "G42 AI", city: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773, category: "National AI", description: "UAE's sovereign AI company building the Middle East's largest AI infrastructure.", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop", link: "https://g42.ai" },
  { id: "41", name: "SDAIA", city: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, category: "National AI", description: "Saudi Data and Artificial Intelligence Authority driving national AI strategy.", image: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=400&h=300&fit=crop", link: "https://sdaia.gov.sa" },
  { id: "42", name: "AI21 Labs", city: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818, category: "LLM", description: "Israeli AI startup that developed the Jurassic series of large language models.", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400&h=300&fit=crop", link: "https://ai21.com" },
  // Oceania
  { id: "43", name: "CSIRO AI", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, category: "Research", description: "Australia's federal research agency AI division focused on agriculture and environmental AI.", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop", link: "https://csiro.au" },
  { id: "44", name: "Canva AI", city: "Sydney", country: "Australia", lat: -33.8588, lng: 151.2193, category: "Design AI", description: "Canva's AI features making design smarter and more accessible.", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop", link: "https://canva.com" },
  { id: "45", name: "Soul Machines", city: "Auckland", country: "New Zealand", lat: -36.8509, lng: 174.7645, category: "Digital Humans", description: "AI company developing realistic digital human technology for customer service and education.", image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=300&fit=crop", link: "https://soulmachines.com" },
  // Africa and South America
  { id: "46", name: "InstaDeep", city: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815, category: "Enterprise AI", description: "Africa's most successful AI startup, acquired by BioNTech.", image: "https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=400&h=300&fit=crop", link: "https://instadeep.com" },
  { id: "47", name: "iMerit", city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, category: "Data Labeling", description: "Providing high-quality data labeling services for global AI companies.", image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400&h=300&fit=crop", link: "https://imerit.net" },
  { id: "48", name: "Nubank AI", city: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, category: "Fintech AI", description: "Latin America's largest digital bank AI system serving over 80 million users.", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop", link: "https://nubank.com.br" },
  { id: "49", name: "MercadoLibre AI", city: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, category: "E-commerce AI", description: "Latin America's largest e-commerce platform AI-powered search and recommendation system.", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", link: "https://mercadolibre.com" },
  { id: "50", name: "Rappi AI", city: "Bogota", country: "Colombia", lat: 4.7110, lng: -74.0721, category: "Delivery AI", description: "Latin American super app's AI dispatch system optimizing instant delivery networks.", image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&h=300&fit=crop", link: "https://rappi.com" }
]

interface GlobeViewProps {
  onMarkerClick: (caseData: AICaseData) => void
}

// GeoJSON URL for countries
const COUNTRIES_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"

export function GlobeView({ onMarkerClick }: GlobeViewProps) {
  const globeRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] })

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
        setCountries(data)
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
    const caseData = aiCases.find(c => c.id === point.id)
    if (caseData) {
      onMarkerClick(caseData)
    }
  }, [onMarkerClick])

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
      backgroundColor="#020a18"
      showAtmosphere={true}
      atmosphereColor="#0ea5e9"
      atmosphereAltitude={0.2}
      // Vector polygon layer for countries
      polygonsData={countries.features}
      polygonAltitude={0.005}
      polygonCapColor={() => "rgba(6, 40, 60, 0.85)"}
      polygonSideColor={() => "rgba(0, 180, 220, 0.15)"}
      polygonStrokeColor={() => "#0ea5e9"}
      polygonLabel={(d: any) => `
        <div style="
          background: rgba(2, 10, 24, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(14, 165, 233, 0.4);
          border-radius: 6px;
          padding: 6px 10px;
          color: #e0f2fe;
          font-family: system-ui, sans-serif;
          font-size: 13px;
        ">
          ${d.properties?.NAME || d.properties?.ADMIN || "Unknown"}
        </div>
      `}
      // HTML elements layer for 2D AI case markers
      htmlElementsData={aiCases}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude={0.01}
      htmlElement={(d: any) => {
        const container = document.createElement("div")
        container.style.cssText = `
          cursor: pointer;
          transform: translate(-50%, -50%);
        `
        container.innerHTML = `
          <div style="
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #22d3ee 0%, rgba(34, 211, 238, 0.8) 50%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 4px 1px rgba(34, 211, 238, 0.6);
            animation: pulse 3s ease-in-out infinite;
          ">
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.9; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          </style>
        `
        container.onclick = () => {
          const caseData = aiCases.find(c => c.id === d.id)
          if (caseData) {
            onMarkerClick(caseData)
          }
        }
        return container
      }}
      // Labels layer for tooltips
      labelsData={aiCases}
      labelLat="lat"
      labelLng="lng"
      labelText={() => ""}
      labelSize={0}
      labelDotRadius={0}
      labelAltitude={0.015}
      labelLabel={(d: any) => `
        <div style="
          background: rgba(2, 10, 24, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(34, 211, 238, 0.5);
          border-radius: 10px;
          padding: 12px 16px;
          color: white;
          font-family: system-ui, sans-serif;
          min-width: 180px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
        ">
          <div style="font-weight: 600; font-size: 14px; color: #22d3ee; margin-bottom: 4px;">${d.name}</div>
          <div style="font-size: 12px; color: #94a3b8;">${d.city}, ${d.country}</div>
          <div style="
            font-size: 11px; 
            margin-top: 8px; 
            padding: 3px 8px;
            background: rgba(34, 211, 238, 0.15);
            border-radius: 4px;
            color: #22d3ee;
            display: inline-block;
          ">${d.category}</div>
        </div>
      `}
    />
  )
}
