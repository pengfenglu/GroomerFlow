# GetGroomerFlow：独立宠物美容师预约与客户管理（Web）

> **对外品牌 / 域名**：GetGroomerFlow · **getgroomerflow.com**（仓库目录名可为 GroomerFlow，不必改）

> **Cursor / Agent 开发真源**：实现以 **「Agent 必读」**、**「MVP 验收清单」**、**「数据模型草案」**、**「路由与页面」** 为准。  
> 标 **背景 · 非实现范围** 的章节供产品与推广参考，**不得**当作当期编码任务（除非用户当条指定）。

---

## Agent 必读（开发约束）

| 项 | 约束 |
| :--- | :--- |
| 维护者 | **单人开发**；优先可交付、可维护，避免功能堆叠 |
| 交付形态 | **仅 Web（响应式）**：桌面 + 手机浏览器；**禁止** React Native / Flutter / 独立 iOS·Android App（除非用户明确要求） |
| 可选增强 | Phase 3+ 可考虑 **PWA**（加到主屏幕）；仍属同一 Next.js 代码库 |
| ICP | **首选**：欧美 **1 人店 / 夫妻店** 宠物美容，月预约约 50～150，用纸笔 / Excel / 通用日历；**不做**寄宿·日托·多门店连锁为主线的客户 |
| 产品定位 | 极简预约 + 宠物档案 + 提醒；**不**对标 MoeGo「全操作系统」；**不**做寄宿全家桶（Gingr 阵地） |
| 技术栈 | **唯一主线**：Next.js（App Router）+ TypeScript + Tailwind CSS + Supabase + NextAuth.js；部署 Vercel |
| 仓库形态 | **一个** Next.js 项目、**一个** Supabase 项目；**禁止**并行第二套后端 |
| MVP 范围 | §三 **第一层** 四模块 + **极简公开预约页** `/book/[slug]`（见 §三.1、§九） |
| 多租户 | 业务数据归属 **`groomer_id`**；Supabase **RLS** 隔离 |
| 套餐门控 | `lib/subscription.ts` 中 **`canAccessFeature(plan, feature)`**；MVP **恒返回 true**，禁止散落 if |
| 时区 | DB 存 **UTC**（`timestamptz`）；展示按 **`profiles.timezone`**（公开页须标注） |
| 公开预约写入 | **`POST /api/book`**（Route Handler）+ **`SUPABASE_SERVICE_ROLE_KEY`**；**禁止**客户端暴露 service role |
| UI 语言 | 用户可见文案 **默认英文**；代码注释可用中文 |
| 密钥 | 仅环境变量；**禁止**入库实值 |
| 依赖变更 | 改 **`package.json`** 须说明原因并获用户确认；**须**同提交 **`package-lock.json`** |

### MVP 明确不做（除非用户当条指定）

- 原生 App、Electron 桌面客户端
- 寄宿 / 日托 / 犬舍 run 管理、疫苗全流程（Gingr 类能力）
- 移动美容 **车载路线优化**
- 复购提醒、简易记账、宠物主 **登录** 自助端（§三.2 第二层）
- 完整 Linktree 主页生成器、排班 AI（§三.3 第三层）
- 预约订金 / Stripe 收款闭环（Phase 2；MVP 仅预留字段）
- SMS 生产级计费（MVP **邮件**为主；`reminder_logs.channel` 预留 `sms`）
- Lemon Squeezy 完整订阅 webhook（MVP 可占位 `/settings/billing`）
- 试用第 3/10 天营销邮件、永久 Free 档客户上限（见 **§十六**）
- 公开页动态「已有 X 人预约」计数（Phase 2；MVP 可用静态信任文案）

### 建议目录结构

```
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── book/[slug]/          # 公开预约（无需登录）
│   └── api/book/             # 公开预约写入（service role）
├── components/
├── lib/
│   ├── subscription.ts       # canAccessFeature（MVP 恒 true）
│   └── email-templates.ts    # 提醒模板 1～2 套
├── types/
├── supabase/migrations/
├── .env.example
└── package.json
```

---

## 一、项目概览

| 维度 | 内容 |
| :--- | :--- |
| 产品名称 | GetGroomerFlow |
| 对外定位（EN） | *Simple booking & client records for independent pet groomers — transparent pricing, no kennel bloat.* |
| 目标用户 | 欧美 **独立** 宠物美容师、小型工作室（1～2 人） |
| 核心价值 | 一个 **预约链接** 减少来回私信；**邮件提醒** 降低爽约；宠物档案集中；**手机浏览器** 可查看今日预约 |
| 商业模式 | 开源核心（MIT）+ **托管云** 订阅；收入以 **订阅** 为主（MVP 不接支付抽成） |
| 部署形态 | 响应式 Web，`groomer.yourbrand.com` |

---

## 二、市场与定位（背景 · 指导优先级）

### 2.1 竞品简表（2026 参考）

| 产品 | 大致月费 | 强项 | GetGroomerFlow 错位 |
| :--- | :--- | :--- | :--- |
| MoeGo | $49～159+ | 移动 van、路由、支付、宠物 CRM | 更重、更贵；SMS 常另收费 |
| Gingr | $99+ | 寄宿 + 多服务 | 单人美容店往往过剩 |
| Square / Calendly | 低～中 | 通用预约 | 缺宠物专业字段与美容记录 |
| GetGroomerFlow | 托管约 $17～25/月 | 极简、低价、开源可自部署 | 不拼全功能 OS |

### 2.2 购买动机假设（调研验证）

Reddit / Facebook 群组优先验证排序（见 §十五）：

1. 少爽约 / 自动提醒  
2. 客户与宠物信息不散落  
3. **在线预约链接**（Instagram bio 一点即约）  
4. 简易收入查看（Pro）  
5. AI 排班 / 寄宿 — **非目标用户刚需**

### 2.3 明确不做（市场边界）

- 以 **寄宿、日托** 为主线的门店（让给 Gingr 等）
- **多门店连锁**、复杂排班劳动力管理（Phase 3+ 再评估）
- 与 MoeGo 正面拼 **支付 GMV 分成 + 车队路由**（无单人开发资源）

### 2.4 北极星指标（产品向）

| 指标 | 说明 |
| :--- | :--- |
| 试用 → 7 日内录入客户数 | 是否真正用起来 |
| 试用 → 30 日内创建预约数 | 核心价值是否成立 |
| 提醒发送成功率 | 邮件通道健康 |
| 付费转化 / 月流失 | 商业健康（§十四） |

第一年商业目标仍为 **50～100 付费**，但文档策略：**先深度服务 20 个活跃用户 > 100 个浅试用**。

---

## 三、产品架构：统一 Web 平台 + 三层模块

单账号、单库（`groomer_id` 隔离）；**仅网页**，模块靠路由划分。

### 3.1 第一层：核心工具（MVP）

**客户信息管理**

- 宠物主：姓名、电话、邮箱  
- 宠物：名字、品种、年龄、照片（URL）、备注  
- **宠物专业字段（MVP 建议录入）**：`temperament`（性情）、`coat_notes`（毛况/打结）、`allergies`（过敏，可选）  
- 一对多：一主人多宠物；列表搜索（姓名 / 宠物名 / 电话）

**在线预约日历**

- 日 / 周视图（MVP **至少周 + 日**）；月视图为增强项  
- 服务项目：名称、时长、价格  
- 可预约时段配置  
- 预约状态：`confirmed` \| `completed` \| `cancelled`  
- **移动端可读**：今日预约、日历在手机浏览器上可操作（响应式，非原生 App）  
- 拖拽改期：Phase 2 增强项  

**极简公开预约（MVP 含 · 市场阻断项）**

- 路径：`/book/[slug]`（`profiles.booking_slug`）  
- 页头展示：**店铺名**、可选 **头像 + 1～2 句 bio**、**「All times in {timezone}」**（如 `America/Los_Angeles`）  
- 主按钮文案：**「Book My Appointment」**；提交成功页：确认文案 + 可选静态句 *Book online in minutes*（**不做** MVP 动态「已有 X 人预约」，见 §十六）  
- 主人 **无需注册**：选服务 → 选可用时段 → 留姓名/电话/邮箱/宠物名 → **`POST /api/book`** 提交  
- 服务端 **时段冲突检测**（与同 `groomer_id` 未取消预约重叠则 409）  
- 生成 `appointments`（`source=public_booking`）+ 自动创建或匹配 `clients`/`pets`  
- 设置页 **复制预约链接**（Instagram bio）  
- **不做**：主人登录、查看历史（属 §3.2 自助端）

**新用户引导（MVP）**

- 注册后 **首次进入 dashboard** 显示步骤条（可关闭，**首次强制展示**）：  
  ① 添加第一只宠物（或第一位客户） → ② 设置服务项目 → ③ 复制预约链接  
- 关闭状态存 **`localStorage`**（键名如 `gf_onboarding_dismissed`）或 `profiles.onboarding_dismissed_at`（二选一，实现取简）

**自动提醒**

- 预约创建：**确认邮件**（或 dev mock + `reminder_logs`）  
- 行前 **24h** 提醒（Vercel Cron / Supabase Edge 择一）  
- MVP 模板可固定 1～2 套；状态 `pending` \| `sent` \| `failed`  
- **SMS**：Phase 2 / Pro；文档策略为 **透明定价**（见 §五），不与 MoeGo 一样「隐藏 SMS 加价」

**服务记录**

- 日期、项目、费用；关联宠物；可选关联预约  
- 服务备注（洗发水、表现等）；按宠物查历史  

### 3.2 第二层：增值（Phase 2+ · 非 MVP）

| 模块 | 要点 | 套餐 |
| :--- | :--- | :--- |
| 复购提醒 | 建议下次美容时间 + 邮件含预约链接 | `pro` |
| 简易记账 | 日收支、周月汇总 | `pro` |
| 宠物主自助端 | 主人 **登录** 查预约/历史、发起预约 | `pro` |
| SMS 提醒 | 含额度或按条计费 | `pro` |
| 预约订金 | Stripe / Lemon 收款，降 no-show | `pro` |

### 3.3 第三层：引流与品牌（Phase 3+ · 非 MVP）

| 模块 | 要点 |
| :--- | :--- |
| 美容师主页生成器 | 完整 Linktree 式（MVP 已有 `/book/[slug]` 即可挂 bio） |
| 排班优化建议 | 历史高峰分析 |
| PWA | 可选「加到主屏幕」 |

---

## 四、用户流程

**美容师侧（MVP）**

1. 注册 / 登录（邮箱或 Google）  
2. 设置店铺名、`booking_slug`、时区  
3. 配置服务项目与可预约时段  
4. 添加客户与宠物（或等公开预约自动创建）  
5. 日历管理预约（含公开预约流入）  
6. 完成服务 → 写服务记录  
7. **复制 `/book/{slug}` 链接** 发到 Instagram / 短信  

**宠物主侧（MVP · 公开预约）**

1. 打开 `/book/{slug}`  
2. 选服务、时段，填写联系人与宠物信息  
3. 提交 → 收到确认邮件（若美容师已配置邮件）  

**宠物主侧（Phase 2 · 自助端账号）**

登录后查看历史、再次预约 — **非 MVP**

---

## 五、商业模式与定价

| 套餐 | 价格（建议） | 包含 | 角色 |
| :--- | :--- | :--- | :--- |
| **Self-host** | $0（MIT 自部署） | 第一层核心；自行运维 | 传播、反馈、信任 |
| **Starter** | $19/月 或 **$199/年** | 托管 + 第一层 + 公开预约 + **邮件提醒** | **主卖** |
| **Pro** | $29/月 或 **$299/年** | Starter + 复购提醒 + 记账 + 自助端 + **SMS 额度** | 升级 |
| **Trial** | 14 天 | Starter 能力；**无需信用卡**（实现 Phase 3 支付时落地） | 拉新 |

**价值锚点**：MoeGo 等约 **$588+/年起**；GetGroomerFlow 主打 **solo 可负担、价格透明**（功能更少但够用）。

**收入说明**：MVP **不以支付 GMV 抽成为主**；若 Phase 2 接 Stripe 订金，以 **降 no-show** 为目的，非复制 MoeGo 支付 OS。

**支付接入**：Lemon Squeezy（MoR）；MVP 表结构预留 `subscription_plan`、`subscription_status`、`trial_ends_at`。

**SMS 单位经济（Pro）**：文档约定「每月含 N 条，超出按条或升级」— 实现前在 README 写清，避免利润被短信吃掉。

---

## 六、产品路线图（背景 · 非实现范围）

| 阶段 | 时间 | 目标 |
| :--- | :--- | :--- |
| Phase 1：验证 | 第 1 周 | r/doggrooming 等痛点调研（§十五） |
| Phase 2：MVP | 第 2～5 周 | 第一层 + `/book/[slug]` + 邮件提醒 |
| Phase 3：冷启动 | 第 6～8 周 | 10 个付费或深度试用 |
| Phase 4：迭代 | 第 9～12 周 | 20 用户；启动 Pro（复购、SMS） |
| Phase 5：扩展 | 第 4～6 月 | 50～100 付费；评估 PWA，**仍不做原生** |

---

## 七、技术架构

| 层级 | 选型 | 说明 |
| :--- | :--- | :--- |
| 客户端 | **响应式 Web only** | Tailwind 断点；日历/今日页优先 mobile layout |
| 框架 | Next.js + TypeScript + Tailwind | App Router |
| 数据 | Supabase（PostgreSQL） | `supabase/migrations` |
| 认证 | NextAuth.js + Supabase | 美容师后台；**公开预约无登录** |
| 邮件 | Resend 或 SMTP | 事务邮件 |
| 支付 | Lemon Squeezy | Phase 3+ 完整 webhook |
| 部署 | Vercel + Cloudflare DNS | |
| 监控 | Sentry（可选） | |
| 开源 | MIT + GitHub | Deploy 按钮；核心四层长期开源 |

**原则**：单应用、单库；**不**为 App 另起代码库。

### 7.1 数据库迁移顺序（必须遵守）

按依赖顺序创建迁移文件，**禁止**乱序导致外键失败：

```
profiles → clients → pets → services → availability_rules → appointments → service_records → reminder_logs
```

### 7.2 时区策略

| 环节 | 规则 |
| :--- | :--- |
| 存储 | `appointments.starts_at` / `ends_at` 等一律 **`timestamptz`（UTC）** |
| 展示 | 后台与 `/book/[slug]` 按 **`profiles.timezone`**（IANA，如 `Europe/London`）转换 |
| 公开页 | 页头固定文案：**All times in {timezone}** |
| 可用时段 | `availability_rules` 为「本地星期 + 本地时刻」；与 UTC 转换逻辑集中在 **`lib/timezone.ts`** |
| Cron 提醒 | 按美容师时区计算「前 24h」触发窗口 |

### 7.3 RLS 与公开预约边界

| 角色 | 权限 |
| :--- | :--- |
| 已登录美容师 | `auth.uid() = groomer_id` 时对自有行 **SELECT/INSERT/UPDATE/DELETE**（按表细化） |
| 匿名 / 宠物主 | **无** 直连写 `appointments`；仅可读 `/book` 所需公开信息（slug 查 profile、可用时段） |
| `service_role` | **仅**服务端 `POST /api/book` 插入预约（及关联 client/pet）；**禁止**出现在浏览器 |

**`appointments` 策略要点**：美容师可读写自己的；`service_role` 可 **INSERT**（供 `/api/book`）；匿名 **无** INSERT。

### 7.4 套餐门控（MVP 预埋）

```typescript
// lib/subscription.ts — MVP 实现示意
export function canAccessFeature(
  plan: 'trial' | 'starter' | 'pro',
  feature: 'sms' | 'rebooking' | 'accounting' | 'owner_portal',
): boolean {
  return true; // MVP：全开；Phase 3 改为按 plan 判断
}
```

UI 与 API 将来宾功能 **统一经此函数**，避免散落 `if (plan === 'pro')`。

### 7.5 邮件模板（MVP 固定 1～2 套）

实现放在 **`lib/email-templates.ts`**（英文）：

| 模板 ID | 触发 | 要点 |
| :--- | :--- | :--- |
| `confirmation` | 预约创建 | 店铺名、宠物名、本地时间、地址/备注可选 |
| `day_before` | 开始前 24h | 提醒时间、店铺联系、取消说明（如有） |

### 环境变量（占位名）

| 变量 | 用途 |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅服务端（公开预约写入等） |
| `NEXT_PUBLIC_APP_URL` | 对外站点根 URL（预约链接），生产 **`https://getgroomerflow.com`** |
| `NEXTAUTH_URL` / `AUTH_SECRET` | 会话；生产同域名，本地开发用 `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google 登录 |
| `RESEND_API_KEY` 或 `SMTP_*` | 邮件 |

---

## 八、数据模型草案

命名：**PostgreSQL `snake_case`**。

| 表 | 主要字段 | 说明 |
| :--- | :--- | :--- |
| `profiles` | `id`, `business_name`, `booking_slug`, `bio`, `avatar_url`, `timezone`, `subscription_plan`, `subscription_status`, `trial_ends_at`, `onboarding_dismissed_at?` | `bio` 1～2 句；头像可选 URL |
| `clients` | `id`, `groomer_id`, `full_name`, `phone`, `email`, `notes` | 宠物主 |
| `pets` | `id`, `groomer_id`, `client_id`, `name`, `breed`, `age_years`, `temperament`, `coat_notes`, `allergies`, `photo_url`, `notes` | 宠物 |
| `services` | `id`, `groomer_id`, `name`, `duration_minutes`, `price_cents`, `is_active` | 服务项目 |
| `availability_rules` | `id`, `groomer_id`, `day_of_week`, `start_time`, `end_time` | 可预约时段 |
| `appointments` | `id`, `groomer_id`, `client_id`, `pet_id`, `service_id`, `starts_at`, `ends_at`, `status`, `source`, `notes` | `starts_at`/`ends_at` 为 **timestamptz（UTC）**；`source`: `staff` \| `public_booking`；**重叠未取消预约须拒绝写入** |
| `service_records` | `id`, `groomer_id`, `pet_id`, `appointment_id?`, `performed_at`, `service_id`, `amount_cents`, `notes` | |
| `reminder_logs` | `id`, `groomer_id`, `appointment_id`, `kind`, `channel`, `status`, `sent_at` | `kind`: confirmation \| day_before；`channel`: email \| sms |

**Phase 2 预留（MVP 可不建表）**：`appointments.deposit_cents`、`payments` 表。

**关系**：`clients` 1—N `pets`；`appointments` 关联 `clients`、`pets`、`services`。

---

## 九、路由与页面（草案）

| 路径 | 页面 | MVP |
| :--- | :--- | :--- |
| `/login` | 登录 | 是 |
| `/register` | 注册 | 是 |
| `/dashboard` | 今日预约概览（**移动端友好**） | 是 |
| `/clients` | 客户列表 | 是 |
| `/clients/[id]` | 客户 + 宠物 | 是 |
| `/calendar` | 预约日历（周/日） | 是 |
| `/appointments/[id]` | 预约详情 | 是 |
| `/records` | 服务记录 | 是 |
| `/settings` | 服务、时段、slug、提醒模板 | 是 |
| `/settings/billing` | 订阅占位 | 占位 |
| **`/book/[slug]`** | **公开预约（无需登录）** | **是** |
| **`POST /api/book`** | 公开预约写入（service role、冲突检测） | **是** |

---

## 十、MVP 验收清单

完成一项勾一项（Agent 同轮 `[ ]` → `[x]`）：

- [ ] 美容师注册、登录、登出（邮箱或 Google）
- [ ] **新用户首次进入 dashboard 显示引导步骤条**（①宠物/客户 ②服务项 ③复制链接）；可关闭且再次登录不强制
- [ ] 设置 `booking_slug`、`timezone`、`bio`（可选头像）并可复制公开链接
- [ ] **`/book/[slug]`** 展示店铺名 + **All times in {timezone}** + 主按钮 **Book My Appointment**
- [ ] **`POST /api/book`** 无需登录，服务端用 **service_role** 写入；客户端无 service role
- [ ] 公开预约 **时段冲突检测**（重叠返回错误，不双订）
- [ ] 留资 → `appointments` 且 `source=public_booking`
- [ ] **所有预约时间** 按美容师 `timezone` 展示；库内为 UTC
- [ ] CRUD 客户与宠物（含 `temperament` / `coat_notes` 至少其一可编辑）
- [ ] CRUD 服务项目
- [ ] 配置每周可预约时段；公开预约仅可选可用时段
- [ ] 后台日历展示预约（周/日）；**手机宽度下可阅读/操作今日与日历**
- [ ] 预约状态可改为 completed / cancelled
- [ ] 服务记录 CRUD；按宠物查历史
- [ ] 确认邮件 + 24h 提醒使用 **`lib/email-templates.ts`** 固定模板（`confirmation` + `day_before`）；`reminder_logs` 可追踪
- [ ] **全业务表 RLS** 已启用；迁移顺序符合 §7.1
- [ ] **`canAccessFeature`** 已存在于 `lib/subscription.ts`（MVP 恒 `true`）
- [ ] `.env.example` + README 本地启动
- [ ] `npm run lint` 与 `npm run build` 通过

---

## 十一、开源策略

- **协议**：MIT；**第一层核心能力长期保持开源**（含自部署公开预约）。  
- **云版增值**：托管运维、邮件代发、SMS 额度、Pro 模块 — 可仅云提供，避免社区认为「阉割开源」。  
- **README**：英文产品介绍、GIF（**预约链接 → 选时段**）、Deploy to Vercel。  
- **转化**：*Like self-hosting but want zero ops? Use our cloud.*  

---

## 十二、推广策略（背景 · 非实现范围）

| 渠道 | 动作 | 挂钩产品 |
| :--- | :--- | :--- |
| r/doggrooming、Facebook 群组 | 痛点帖 + 14 天试用 | no-show、纸笔日历 |
| Instagram | bio 放 **`/book/slug`** | 演示 GIF 用公开预约 |
| Product Hunt | 角度：**open-source groomer booking for solos** | 非「又一个 MoeGo」 |
| SEO | 英文长尾 | *pet grooming appointment software solo*、*simple alternative grooming software* |
| 付费广告 | **10 个深度用户前不投** | |

**调研帖 3 问**（Phase 1）：现用什么管理预约？最大痛点？愿为简化工具付多少/月？

---

## 十三、风险与应对

| 风险 | 应对 |
| :--- | :--- |
| MoeGo 推低价 solo 档 | 极简 + 透明价 + 开源信任；不拼功能数 |
| SMS 成本侵蚀利润 | 默认邮件；SMS 仅 Pro + 额度 |
| 用户要寄宿/疫苗 | 文档与落地页 **明确 out of scope** |
| 新品牌信任弱 | Terms/Privacy、数据导出、可自部署 |
| 功能膨胀 | §三 分层 + Agent 必读禁止项 |
| 一人维护过载 | **仅 Web**；禁原生双端 |

---

## 十四、关键指标（第一年）

| 指标 | 目标 |
| :--- | :--- |
| 深度活跃用户 | 20（再冲 50～100 付费） |
| 付费用户 | 50～100 |
| 年费占比 | >70% |
| MRR | $1,500～$2,500 |
| 年收入 | $18,000～$30,000 |
| 月流失 | <3% |
| 公开预约占比 | 跟踪 `source=public_booking` 比例 |

---

## 十五、本地启动与验证（开发）

**初始化（首次）**

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false
npm install @supabase/supabase-js next-auth @auth/supabase-adapter
```

**日常验证（仓库根）**

```powershell
npm run lint
npm run build
npm run dev
```

默认端口 `3000`；占用时记入 README。

**人工调研**：Reddit r/doggrooming — 见 §十二，**非 Agent 编码任务**。

---

## 十六、Phase 2+ 增长与商业化（背景 · 非 MVP）

以下项**有价值但不在 MVP 实现**，避免单人 scope 膨胀；启动条件建议 **≥10 个深度试用用户**。

| 项 | 说明 | 触发时机 |
| :--- | :--- | :--- |
| 社交证明计数 | 公开页「已有 X 位宠物主通过此链接预约」（统计 `public_booking`） | 有稳定预约量后 |
| 试用邮件序列 | 注册第 3 天：教挂 Instagram bio；第 10 天：预约数据 + 年费优惠；**Vercel Cron** | 邮件通道稳定后 |
| 永久 **Free** 档 | 1 美容师、≤20 活跃客户、预约链接可用；超限提示升级 **不硬断** | 需计费与计数逻辑后 |
| 动态套餐门控 | `canAccessFeature` 按 `trial` / `starter` / `pro` / `free` 真实返回 | Lemon Squeezy webhook 接入后 |

**Free 档（规划，非 MVP）**：`subscription_plan = free`；与 Self-host 区别为**托管但限额**，用于扩大漏斗，见 §五 Starter 主卖策略。
