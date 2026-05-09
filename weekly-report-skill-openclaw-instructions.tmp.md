# Weekly Report Skill 修改说明

请修改 `/Users/clawclaw/.openclaw/workspace-ai-atlas/skills/weekly-report/SKILL.md`，目标是让每周生成的 weekly blog 与 AI Atlas 前端、Supabase `AI_Atlas_Blog_Posts` 表结构、行业页 Related Weekly Reports 功能保持兼容。

## 背景

AI Atlas 前端的 blog 数据读取在：

```txt
/Users/clawclaw/AI_Atlas/lib/data-blog.ts
```

Supabase blog 表结构来自：

```txt
/Users/clawclaw/AI_Atlas/supabase/migrations/20260409120000_ai_atlas_blog_posts.sql
```

核心字段结构是：

```sql
CREATE TABLE IF NOT EXISTS public."AI_Atlas_Blog_Posts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  related_case_ids UUID[] NOT NULL DEFAULT '{}',
  week_start DATE,
  week_end DATE,
  new_use_cases_count INTEGER NOT NULL DEFAULT 0,
  new_companies_count INTEGER NOT NULL DEFAULT 0,
  countries_count INTEGER NOT NULL DEFAULT 0,
  industries_count INTEGER NOT NULL DEFAULT 0,
  data_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

前端类型在：

```txt
/Users/clawclaw/AI_Atlas/lib/types-weekly-report.ts
```

`content` 必须匹配 `WeeklyReportContent`：

```ts
export interface WeeklyReportContent {
  systemHealth: SystemHealth
  overview: {
    newUseCases: number
    newCompanies: number
    countriesCount: number
    industriesCount: number
  }
  agentMetrics: AgentMetrics
  highlights: WeeklyReportHighlight[]
  trends: WeeklyReportTrend[]
  searchStrategy: {
    queryPerformance: QueryPerformance[]
    newQueriesAdded: string[]
  }
  dataQuality: {
    issues: DataQualityIssue[]
  }
  observations: string[]
  nextSteps: NextStep[]
}
```

请按以下要求修改 weekly-report skill。

---

## 1. 修正 `tags` 结构

当前 skill 的 Step 10 使用了对象形式：

```json
"tags": {
  "cycle": ["Weekly"],
  "trend": ["<Top trend 1>", "<Top trend 2>"],
  "status": ["Stable"]
}
```

这是错误的。Supabase 字段是：

```sql
tags TEXT[] NOT NULL DEFAULT '{}'
```

前端也期望：

```ts
tags: string[]
```

请改为 flat string array：

```json
"tags": [
  "Weekly",
  "Stable",
  "<Top trend 1>",
  "<Top trend 2>",
  "<Top industry 1>",
  "<Top industry 2>",
  "<Top industry 3>"
]
```

要求：

- `tags` 必须是 flat `string[]`
- 不允许使用对象 `{ cycle, trend, status }`
- 必须包含 `"Weekly"`
- 必须包含 system health status：
  - `"Stable"`
  - `"Warning"`
  - `"Action-Required"`
- 必须包含 1-3 个具体 trend labels
- 必须包含本周新增 use cases 数量最多的 Top 3 行业名
- 行业名必须使用 `AI_Atlas_Use_Cases.industry` 里的 exact value
- 不要改写、缩写、翻译或 lowercase 行业名

正确示例：

```json
"tags": [
  "Weekly",
  "Stable",
  "Financial AI Deep Automation",
  "Internet Software & Services",
  "Banks",
  "Biotechnology"
]
```

错误示例：

```json
"tags": {
  "cycle": ["Weekly"]
}
```

错误示例：

```json
"tags": [
  "weekly",
  "internet software & services"
]
```

---

## 2. 增加 Top industries 计算规则

在 Step 1 或 Step 10 前增加规则：

从本周新增 use cases 中按 `industry` 分组，计算 Top 3 industries：

```txt
topIndustries = top 3 distinct AI_Atlas_Use_Cases.industry values by new use case count
```

要求：

- 忽略空值或 null industry
- 保留数据库 exact casing
- 不 lowercase
- 不翻译
- 不合并相似行业名，除非数据库本身就是同一个 exact value

这些 Top 3 industries 必须写入：

1. `tags`
2. `summary` 第一或第二句，若语义自然
3. `content.trends` 中，若该行业确实形成趋势

---

## 3. 明确 `related_case_ids` 规则

当前 skill 只要求写 `related_case_ids`，但规则不够明确。请补充：

```txt
related_case_ids must be a deduplicated string array of real AI_Atlas_Use_Cases.id values.
At minimum, include every content.highlights[].use_case_id.
When available, also include use case ids used to derive trends and summary claims.
Never include titles, company names, URLs, or fabricated ids.
```

具体要求：

`related_case_ids` 必须包含：

1. 所有 `content.highlights[].use_case_id`
2. 所有用于生成 trends 的 use case ids，如果可获得
3. 本周 report 覆盖到的主要 use case ids，优先包含本周新增 use cases
4. 只能包含真实的 `AI_Atlas_Use_Cases.id`
5. 不允许放 title、company name、URL 或 fake id
6. 必须去重
7. 输出为 UUID string array，兼容 Supabase `UUID[]`

正确示例：

```json
"related_case_ids": [
  "a382a3c1-5b80-4e70-aad3-2d1f6c1bb2cc",
  "4fb2f971-01f6-4747-a91d-799cad223e21"
]
```

错误示例：

```json
"related_case_ids": [
  "Microsoft Copilot use case",
  "https://example.com/article"
]
```

---

## 4. 强化 highlights 结构

Step 2 已经要求每个 highlight 包含：

```json
{
  "industry": "...",
  "use_case_id": "<uuid>"
}
```

请进一步明确：

- 每个 highlight 必须有真实 `use_case_id`
- 每个 highlight 必须有 `industry`
- `industry` 必须使用数据库中的 exact `AI_Atlas_Use_Cases.industry`
- 如果找不到真实 `use_case_id`，不能把该记录选为 highlight
- `use_case_id` 必须同步进入顶层 `related_case_ids`

正确 highlight 示例：

```json
{
  "id": "1",
  "title": "Example AI deployment",
  "company": "Example Corp",
  "country": "United States",
  "industry": "Internet Software & Services",
  "description": "Short description...",
  "significance": "Verified deployment",
  "use_case_id": "a382a3c1-5b80-4e70-aad3-2d1f6c1bb2cc"
}
```

---

## 5. 修正 `content` JSONB 结构

当前 skill 的 Step 10 content 示例包含这些字段：

```json
"queryPerformance": [],
"newQueriesAdded": [],
"dataQualityStats": {},
"previousNextStepsStatus": [],
"insights": [],
"nextWeekPlan": []
```

这些不符合当前前端 `WeeklyReportContent` 类型。请改成以下结构：

```json
{
  "systemHealth": {
    "status": "green",
    "label": "Stable",
    "warnings": []
  },
  "overview": {
    "newUseCases": 0,
    "newCompanies": 0,
    "countriesCount": 0,
    "industriesCount": 0
  },
  "agentMetrics": {
    "runsThisWeek": 0,
    "totalErrorsIntercepted": 0,
    "errorInterceptionRate": "0%",
    "reflexLoopTriggers": 0,
    "dataQualityScore": 0,
    "recordsFailedQualityGate": 0,
    "searchFallbackChainInvocations": {}
  },
  "highlights": [],
  "trends": [],
  "searchStrategy": {
    "queryPerformance": [],
    "newQueriesAdded": []
  },
  "dataQuality": {
    "issues": []
  },
  "observations": [],
  "nextSteps": []
}
```

要求：

- `queryPerformance` 必须放在 `searchStrategy.queryPerformance`
- `newQueriesAdded` 必须放在 `searchStrategy.newQueriesAdded`
- `dataQualityStats` 不要作为顶层字段；如要展示问题，转成 `dataQuality.issues`
- `insights` 不要作为顶层字段；对应内容放入 `observations`
- `nextWeekPlan` 不要作为顶层字段；对应内容应转成 `nextSteps`，且每个 next step 必须符合当前 `NextStep` 类型
- `previousNextStepsStatus` 当前不是前端类型字段，不要作为前端依赖字段写入，除非前端类型和 renderer 同步更新

当前 `NextStep` 类型是：

```ts
{
  priority: "high" | "medium" | "low",
  file: string,
  issue: string,
  action: string
}
```

---

## 6. 修正 `summary` 规则

当前 Quality Checklist 只要求：

```txt
summary is exactly 2 sentences (progress + next plan)
```

请扩展为：

```txt
summary is exactly 2 sentences:
1. first sentence summarizes weekly progress and mentions the most active 1-2 industries when meaningful
2. second sentence states the next plan or operational focus
```

示例：

```txt
This week added 44 AI deployment use cases, led by Internet Software & Services and Health Care Equipment & Supplies. Next week focuses on improving source verification and expanding under-covered regions.
```

要求：

- 必须 exactly 2 sentences
- 第一话尽量包含 Top 1-2 industries
- 行业名保持 exact casing
- 不要写泛泛的 “AI adoption is growing” 这类无数据支撑句子

---

## 7. 修正 `data_sources`

当前 skill 示例写：

```json
"data_sources": "AI Atlas - Use Case Database"
```

Supabase 字段是：

```sql
data_sources JSONB NOT NULL DEFAULT '{}'::jsonb
```

请改为 JSON object：

```json
"data_sources": {
  "primary": "AI Atlas - Use Case Database",
  "tables": ["AI_Atlas_Use_Cases", "AI_Atlas_Companies"],
  "generated_by": "weekly-report"
}
```

要求：

- 不要写普通字符串
- 保持 JSON object
- 不要包含 secret、API key、service role key

---

## 8. 修正 Top-level report fields 示例

请将 Step 10 的 Top-level report fields 改成类似：

```json
{
  "post_kind": "weekly_report",
  "slug": "weekly-<week_start date>",
  "title": "AI Atlas Weekly Report — <year> Week <ISO week number>",
  "summary": "<exactly 2 sentences>",
  "content": {
    "systemHealth": {},
    "overview": {},
    "agentMetrics": {},
    "highlights": [],
    "trends": [],
    "searchStrategy": {
      "queryPerformance": [],
      "newQueriesAdded": []
    },
    "dataQuality": {
      "issues": []
    },
    "observations": [],
    "nextSteps": []
  },
  "tags": [
    "Weekly",
    "Stable",
    "<Top trend label>",
    "<Exact industry 1>",
    "<Exact industry 2>",
    "<Exact industry 3>"
  ],
  "related_case_ids": ["<uuid1>", "<uuid2>"],
  "week_start": "YYYY-MM-DD",
  "week_end": "YYYY-MM-DD",
  "new_use_cases_count": 0,
  "new_companies_count": 0,
  "countries_count": 0,
  "industries_count": 0,
  "data_sources": {
    "primary": "AI Atlas - Use Case Database",
    "tables": ["AI_Atlas_Use_Cases", "AI_Atlas_Companies"],
    "generated_by": "weekly-report"
  },
  "published_at": "<ISO timestamp>"
}
```

---

## 9. 修正 Quality Checklist

在 Quality Checklist 增加这些检查项：

```md
- [ ] `tags` is a flat string array, not an object
- [ ] `tags` includes "Weekly"
- [ ] `tags` includes system health status: Stable | Warning | Action-Required
- [ ] `tags` includes Top 3 exact industry names from `AI_Atlas_Use_Cases.industry`
- [ ] Industry tags preserve exact database casing and are not lowercased
- [ ] `related_case_ids` is deduplicated and contains only real `AI_Atlas_Use_Cases.id` UUID values
- [ ] `related_case_ids` includes every `content.highlights[].use_case_id`
- [ ] All highlights have exact `industry` values from the database
- [ ] No fabricated ids, company names, URLs, or titles appear in `related_case_ids`
- [ ] `content` matches the frontend `WeeklyReportContent` shape
- [ ] `searchStrategy.queryPerformance` and `searchStrategy.newQueriesAdded` are nested under `searchStrategy`
- [ ] `dataQuality.issues` is used instead of top-level `dataQualityStats`
- [ ] `observations` is used instead of top-level `insights`
- [ ] `nextSteps` follows `{ priority, file, issue, action }`
- [ ] `data_sources` is a JSON object and contains no secrets
```

---

## 10. 移除真实 Supabase keys

当前文件末尾有真实 Supabase keys：

```txt
Service Role Key: ...
Anon Key: ...
```

请删除真实 key，改成环境变量说明：

```md
## Supabase Connection

- URL: use `NEXT_PUBLIC_SUPABASE_URL`
- Service Role Key: use `SUPABASE_SERVICE_ROLE_KEY`
- Anon Key: use `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Table: `AI_Atlas_Blog_Posts`

Never hardcode Supabase keys in this skill file.
Never print service role keys in logs or reports.
```

重要：

- `service_role` key 已经明文出现在 skill 文件中
- 建议在 Supabase Dashboard 里 rotate service role key
- 以后 skill 只能引用环境变量名，不能写真实 key

---

## 11. 与行业页 Related Weekly Reports 的兼容目标

行业页未来会根据以下优先级匹配相关 weekly reports：

1. `related_case_ids` 和当前行业 use case ids 有交集
2. `tags` 包含当前行业 exact name
3. `content.highlights[].industry` 包含当前行业 exact name
4. `title` / `summary` 文本 fallback

所以 weekly-report skill 必须稳定生成：

- 完整、真实、去重的 `related_case_ids`
- exact industry names in `tags`
- exact industry names in `content.highlights[]`
- summary 中尽量提及最活跃行业

这样每周新增 blog 记录后，AI Atlas 行业页可以自动关联到最新周报，无需手动维护。
