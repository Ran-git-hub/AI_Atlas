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
  // 北美洲
  { id: "1", name: "OpenAI GPT-5", city: "旧金山", country: "美国", lat: 37.7749, lng: -122.4194, category: "大语言模型", description: "OpenAI 最新一代大语言模型，具备更强的推理能力和多模态理解能力，正在改变人机交互方式。", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop", link: "https://openai.com" },
  { id: "2", name: "Anthropic Claude", city: "旧金山", country: "美国", lat: 37.7649, lng: -122.4294, category: "大语言模型", description: "注重 AI 安全的大语言模型，以其深度思考和长文本处理能力著称。", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=300&fit=crop", link: "https://anthropic.com" },
  { id: "3", name: "Midjourney", city: "旧金山", country: "美国", lat: 37.7849, lng: -122.4094, category: "AI 绘画", description: "领先的 AI 图像生成平台，可根据文本描述创作出令人惊叹的艺术作品。", image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=300&fit=crop", link: "https://midjourney.com" },
  { id: "4", name: "Tesla FSD", city: "奥斯汀", country: "美国", lat: 30.2672, lng: -97.7431, category: "自动驾驶", description: "特斯拉全自动驾驶系统，利用纯视觉方案实现端到端自动驾驶。", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop", link: "https://tesla.com" },
  { id: "5", name: "Waymo", city: "山景城", country: "美国", lat: 37.3861, lng: -122.0839, category: "自动驾驶", description: "Alphabet 旗下的自动驾驶公司，已在多个城市提供无人驾驶出租车服务。", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", link: "https://waymo.com" },
  { id: "6", name: "NVIDIA AI", city: "圣克拉拉", country: "美国", lat: 37.3541, lng: -121.9552, category: "AI 芯片", description: "全球领先的 AI 计算平台，GPU 驱动着大部分 AI 模型的训练和推理。", image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=300&fit=crop", link: "https://nvidia.com" },
  { id: "7", name: "Meta AI", city: "门洛帕克", country: "美国", lat: 37.4530, lng: -122.1817, category: "大语言模型", description: "Meta 的 LLaMA 系列开源大模型，推动了开源 AI 生态的发展。", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop", link: "https://ai.meta.com" },
  { id: "8", name: "Google Gemini", city: "山景城", country: "美国", lat: 37.4220, lng: -122.0841, category: "大语言模型", description: "Google 最强大的多模态 AI 模型，整合了搜索、理解和生成能力。", image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=300&fit=crop", link: "https://deepmind.google" },
  { id: "9", name: "Microsoft Copilot", city: "西雅图", country: "美国", lat: 47.6062, lng: -122.3321, category: "AI 助手", description: "微软全线产品整合的 AI 助手，重新定义办公效率。", image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&h=300&fit=crop", link: "https://copilot.microsoft.com" },
  { id: "10", name: "Amazon Bedrock", city: "西雅图", country: "美国", lat: 47.6162, lng: -122.3421, category: "云服务", description: "AWS 的基础模型服务平台，为企业提供安全可控的 AI 能力。", image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=300&fit=crop", link: "https://aws.amazon.com/bedrock" },
  { id: "11", name: "Cohere", city: "多伦多", country: "加拿大", lat: 43.6532, lng: -79.3832, category: "企业 AI", description: "专注企业级 NLP 解决方案的 AI 公司，提供安全的私有化部署。", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop", link: "https://cohere.ai" },
  { id: "12", name: "Mila 研究所", city: "蒙特利尔", country: "加拿大", lat: 45.5017, lng: -73.5673, category: "学术研究", description: "由 Yoshua Bengio 创立的世界顶级 AI 研究机构。", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=300&fit=crop", link: "https://mila.quebec" },
  // 欧洲
  { id: "13", name: "DeepMind AlphaFold", city: "伦敦", country: "英国", lat: 51.5074, lng: -0.1278, category: "生物科技", description: "已预测超过 2 亿种蛋白质结构，为药物研发带来革命性突破。", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop", link: "https://deepmind.com" },
  { id: "14", name: "Stability AI", city: "伦敦", country: "英国", lat: 51.5174, lng: -0.1378, category: "AI 绘画", description: "Stable Diffusion 的创造者，推动开源 AI 图像生成技术的发展。", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", link: "https://stability.ai" },
  { id: "15", name: "Mistral AI", city: "巴黎", country: "法国", lat: 48.8566, lng: 2.3522, category: "大语言模型", description: "欧洲最具影响力的 AI 创业公司，以高效开源模型著称。", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop", link: "https://mistral.ai" },
  { id: "16", name: "Hugging Face", city: "巴黎", country: "法国", lat: 48.8666, lng: 2.3422, category: "开源平台", description: "最大的 AI 模型开源社区，托管数十万个模型和数据集。", image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&h=300&fit=crop", link: "https://huggingface.co" },
  { id: "17", name: "Aleph Alpha", city: "海德堡", country: "德国", lat: 49.3988, lng: 8.6724, category: "企业 AI", description: "欧洲领先的企业级 AI 公司，专注于可解释和可信赖的 AI。", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop", link: "https://aleph-alpha.com" },
  { id: "18", name: "SAP AI", city: "瓦尔多夫", country: "德国", lat: 49.3063, lng: 8.6428, category: "企业软件", description: "将 AI 深度整合到企业资源管理中，提升业务流程自动化。", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop", link: "https://sap.com" },
  { id: "19", name: "ETH Zurich AI", city: "苏黎世", country: "瑞士", lat: 47.3769, lng: 8.5417, category: "学术研究", description: "欧洲顶尖理工学府的 AI 研究中心，在机器学习理论方面有重要贡献。", image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400&h=300&fit=crop", link: "https://ethz.ch" },
  { id: "20", name: "Spotify AI", city: "斯德哥尔摩", country: "瑞典", lat: 59.3293, lng: 18.0686, category: "推荐系统", description: "利用 AI 为数亿用户提供个性化音乐推荐体验。", image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop", link: "https://spotify.com" },
  { id: "21", name: "ASML AI", city: "费尔德霍芬", country: "荷兰", lat: 51.4416, lng: 5.4697, category: "半导体", description: "将 AI 应用于光刻机的精密控制和缺陷检测。", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", link: "https://asml.com" },
  // 亚洲
  { id: "22", name: "百度文心一言", city: "北京", country: "中国", lat: 39.9042, lng: 116.4074, category: "大语言模型", description: "百度推出的知识增强大语言模型，支持中文理解和生成。", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop", link: "https://yiyan.baidu.com" },
  { id: "23", name: "字节跳动 AI", city: "北京", country: "中国", lat: 39.9142, lng: 116.3974, category: "推荐系统", description: "驱动抖音、TikTok 等产品的核心推荐算法。", image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop", link: "https://bytedance.com" },
  { id: "24", name: "智谱 AI", city: "北京", country: "中国", lat: 39.8942, lng: 116.4174, category: "大语言模型", description: "ChatGLM 系列模型的开发者，推动中文大模型开源生态。", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop", link: "https://zhipuai.cn" },
  { id: "25", name: "阿里通义千问", city: "杭州", country: "中国", lat: 30.2741, lng: 120.1551, category: "大语言模型", description: "阿里巴巴的大语言模型，在多语言理解和代码生成方面表现出色。", image: "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?w=400&h=300&fit=crop", link: "https://tongyi.aliyun.com" },
  { id: "26", name: "腾讯混元", city: "深圳", country: "中国", lat: 22.5431, lng: 114.0579, category: "大语言模型", description: "腾讯自研大模型，深度整合微信生态和企业服务。", image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=300&fit=crop", link: "https://hunyuan.tencent.com" },
  { id: "27", name: "华为盘古", city: "深圳", country: "中国", lat: 22.5531, lng: 114.0679, category: "行业大模型", description: "华为面向行业的大模型系列，覆盖气象、矿山、金融等领域。", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop", link: "https://huawei.com" },
  { id: "28", name: "商汤科技", city: "上海", country: "中国", lat: 31.2304, lng: 121.4737, category: "计算机视觉", description: "亚洲领先的 AI 公司，在人脸识别和自动驾驶领域有广泛应用。", image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=300&fit=crop", link: "https://sensetime.com" },
  { id: "29", name: "科大讯飞", city: "合肥", country: "中国", lat: 31.8206, lng: 117.2272, category: "语音 AI", description: "中国领先的语音 AI 公司，语音识别技术处于国际领先水平。", image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=300&fit=crop", link: "https://iflytek.com" },
  { id: "30", name: "Samsung AI", city: "首尔", country: "韩国", lat: 37.5665, lng: 126.978, category: "消费电子", description: "三星 Galaxy AI 将人工智能深度整合到智能手机中。", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop", link: "https://samsung.com" },
  { id: "31", name: "Naver AI", city: "城南", country: "韩国", lat: 37.3595, lng: 127.1053, category: "搜索引擎", description: "韩国最大搜索引擎的 AI 研究部门，开发了 HyperCLOVA 大模型。", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop", link: "https://naver.com" },
  { id: "32", name: "东京大学 AI 研究", city: "东京", country: "日本", lat: 35.6762, lng: 139.6503, category: "学术研究", description: "日本顶尖 AI 研究机构，在机器人学领域有重要贡献。", image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=300&fit=crop", link: "https://www.u-tokyo.ac.jp" },
  { id: "33", name: "Preferred Networks", city: "东京", country: "日本", lat: 35.6862, lng: 139.6603, category: "深度学习", description: "日本最具价值的 AI 创业公司，专注工业和机器人应用。", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop", link: "https://preferred.jp" },
  { id: "34", name: "Sony AI", city: "东京", country: "日本", lat: 35.6662, lng: 139.6403, category: "游戏 AI", description: "索尼 AI 研究实验室，专注于游戏和娱乐领域的 AI 应用。", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop", link: "https://ai.sony" },
  { id: "35", name: "台积电 AI", city: "新竹", country: "中国台湾", lat: 24.8138, lng: 120.9675, category: "半导体", description: "全球最先进芯片制造商，AI 芯片产能占据主导地位。", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop", link: "https://tsmc.com" },
  { id: "36", name: "Infosys AI", city: "班加罗尔", country: "印度", lat: 12.9716, lng: 77.5946, category: "企业服务", description: "印度 IT 巨头的 AI 转型，为全球企业提供 AI 解决方案。", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop", link: "https://infosys.com" },
  { id: "37", name: "Flipkart AI", city: "班加罗尔", country: "印度", lat: 12.9816, lng: 77.6046, category: "电商 AI", description: "印度最大电商平台的 AI 系统，服务数亿消费者。", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", link: "https://flipkart.com" },
  { id: "38", name: "Grab AI", city: "新加坡", country: "新加坡", lat: 1.3521, lng: 103.8198, category: "出行服务", description: "东南亚超级应用的 AI 大脑，优化出行和配送效率。", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop", link: "https://grab.com" },
  { id: "39", name: "Sea AI", city: "新加坡", country: "新加坡", lat: 1.3621, lng: 103.8298, category: "游戏/电商", description: "东南亚科技巨头，AI 驱动 Shopee 和 Garena 业务增长。", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop", link: "https://sea.com" },
  // 中东
  { id: "40", name: "G42 AI", city: "阿布扎比", country: "阿联酋", lat: 24.4539, lng: 54.3773, category: "国家 AI", description: "阿联酋主权 AI 公司，正在建设中东最大的 AI 基础设施。", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop", link: "https://g42.ai" },
  { id: "41", name: "SDAIA", city: "利雅得", country: "沙特阿拉伯", lat: 24.7136, lng: 46.6753, category: "国家 AI", description: "沙特数据和人工智能管理局，推动国家 AI 战略实施。", image: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=400&h=300&fit=crop", link: "https://sdaia.gov.sa" },
  { id: "42", name: "AI21 Labs", city: "特拉维夫", country: "以色列", lat: 32.0853, lng: 34.7818, category: "大语言模型", description: "以色列 AI 创业公司，开发了 Jurassic 系列大语言模型。", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400&h=300&fit=crop", link: "https://ai21.com" },
  // 大洋洲
  { id: "43", name: "CSIRO AI", city: "悉尼", country: "澳大利亚", lat: -33.8688, lng: 151.2093, category: "学术研究", description: "澳大利亚联邦科研机构的 AI 部门，专注农业和环境 AI。", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop", link: "https://csiro.au" },
  { id: "44", name: "Canva AI", city: "悉尼", country: "澳大利亚", lat: -33.8588, lng: 151.2193, category: "设计 AI", description: "设计平台 Canva 的 AI 功能，让设计更加智能化。", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop", link: "https://canva.com" },
  { id: "45", name: "Soul Machines", city: "奥克兰", country: "新西兰", lat: -36.8509, lng: 174.7645, category: "数字人", description: "开发逼真数字人技术的 AI 公司，应用于客服和教育。", image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=300&fit=crop", link: "https://soulmachines.com" },
  // 非洲和南美
  { id: "46", name: "InstaDeep", city: "突尼斯市", country: "突尼斯", lat: 36.8065, lng: 10.1815, category: "企业 AI", description: "非洲最成功的 AI 创业公司，已被 BioNTech 收购。", image: "https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=400&h=300&fit=crop", link: "https://instadeep.com" },
  { id: "47", name: "iMerit", city: "开罗", country: "埃及", lat: 30.0444, lng: 31.2357, category: "数据标注", description: "为全球 AI 公司提供高质量数据标注服务。", image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400&h=300&fit=crop", link: "https://imerit.net" },
  { id: "48", name: "Nubank AI", city: "圣保罗", country: "巴西", lat: -23.5505, lng: -46.6333, category: "金融 AI", description: "拉丁美洲最大数字银行的 AI 系统，服务超过 8000 万用户。", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop", link: "https://nubank.com.br" },
  { id: "49", name: "MercadoLibre AI", city: "布宜诺斯艾利斯", country: "阿根廷", lat: -34.6037, lng: -58.3816, category: "电商 AI", description: "拉丁美洲最大电商平台的 AI 驱动搜索和推荐系统。", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop", link: "https://mercadolibre.com" },
  { id: "50", name: "Rappi AI", city: "波哥大", country: "哥伦比亚", lat: 4.7110, lng: -74.0721, category: "配送 AI", description: "拉丁美洲超级应用的 AI 调度系统，优化即时配送网络。", image: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&h=300&fit=crop", link: "https://rappi.com" }
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
          <div className="text-cyan-400/80 text-sm tracking-wide">正在加载地球...</div>
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
