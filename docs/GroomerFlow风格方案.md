# GetGroomerFlow 视觉与交互风格方案

> **目标**：建立「专业、可信、轻量」的第一印象，符合 **北美 / 英国 / 爱尔兰 / 澳新** 独立宠物美容师的习惯。  
> **核心原则**：克制即高级，清晰即美感；每屏只传达一个核心任务。  
> **与主方案关系**：功能与数据以 **`docs/GroomerFlow方案.md`** 为准；**本文件** 为视觉、交互、**国际化呈现** 真源。

---

## 〇、适用市场与本地化原则

| 项 | 约定 |
| :--- | :--- |
| 首要市场 | 美国、加拿大、英国、爱尔兰、澳大利亚、新西兰（独立美容店） |
| 界面语言 | **仅英文**（MVP）；写法默认 **`en-US`**（拼写、日期习惯）；不混用英式/美式同屏 |
| 本地化实现 | 运行时用 **`Intl`**（`Intl.DateTimeFormat`、`Intl.NumberFormat`）+ 美容师 `profiles.timezone`；**禁止**手写 `MM/DD` 拼接 |
| 文化基调 | 宠物是家庭成员；语气 **友好、专业、直接**，不过度卖萌、不用俚语 |
| MVP 不做 | 多语言 UI、RTL 布局、按国家切换整套 UI 文案 |

**用户常对标的产品**：Calendly（预约）、Square（小店信任感）、iPhone 日历（时间可读性）——布局与步骤清晰度应向这类习惯靠拢，而非国内 SaaS 的信息密度。

---

## 一、品牌色彩体系

| 角色 | 色值 | Tailwind 类名 | 用途 |
| :--- | :--- | :--- | :--- |
| 品牌主色 | `#166534` | `green-800` | 主按钮、关键强调、链接 |
| 品牌浅色 | `#F0FDF4` | `green-50` | 选中态背景、提示条、标签 |
| 文字主色 | `#0F172A` | `slate-900` | 标题、正文 |
| 文字次级 | `#475569` | `slate-600` | 说明文字、辅助信息 |
| 背景白 | `#FFFFFF` | `white` | 页面底色、卡片 |
| 背景灰 | `#F8FAFC` | `slate-50` | 次级背景、侧栏 |
| 边框色 | `#E2E8F0` | `slate-200` | 分割线、输入框、卡片边框 |
| 错误红 | `#DC2626` | `red-600` | 错误提示、删除按钮 |
| 成功绿 | `#16A34A` | `green-600` | 成功提示、完成态 |
| 信息蓝 | `#2563EB` | `blue-600` | 中性提示（非错误/成功时） |

**约束**

- 禁止渐变色、禁止高饱和装饰色
- 彩色控制在 **绿 / 红 / 蓝**；其余灰阶
- **对比度**：正文与背景 ≥ **WCAG 2.1 AA**（4.5:1）；主按钮白字 on `green-800` 须达标；次级文字不用浅于 `slate-500`

---

## 二、字体体系

| 层级 | 字号 | 字重 | 行高 | 用途 |
| :--- | :--- | :--- | :--- | :--- |
| H1 | `text-3xl` / `text-4xl` | `font-bold` | `leading-tight` | 页面主标题 |
| H2 | `text-xl` / `text-2xl` | `font-semibold` | `leading-snug` | 区块标题 |
| H3 | `text-lg` | `font-medium` | `leading-snug` | 卡片标题 |
| Body | `text-sm` / `text-base` | `font-normal` | `leading-relaxed` | 正文 |
| Caption | `text-xs` | `font-normal` | `leading-normal` | 辅助文字、时间戳 |

**字体家族**：`Inter`（`next/font/google`），后备 `system-ui, sans-serif`。Inter 对英文小字号可读性较好，符合欧美 SaaS 常见选择。

**约束**

- 全站单字族；禁止装饰字体
- 每页一个 H1
- UI 文案用 **Sentence case**（`Book my appointment` 仅当品牌固定句式用标题式 **`Book My Appointment`**，全站统一一种）
- 不用全大写长句（`BOOK NOW`）；按钮最多词首大写

---

## 三、间距与留白体系

| 层级 | 间距值 | Tailwind | 用途 |
| :--- | :--- | :--- | :--- |
| 页面外边距 | `px-4`～`px-8` | 16px～32px | 移动 → 桌面 |
| 区块间距 | `py-16`～`py-24` | 64px～96px | Landing 分段 |
| 卡片内边距 | `p-6` | 24px | 卡片、弹窗 |
| 元素间距 | `gap-4`～`gap-6` | 16px～24px | 列表、表单 |

**约束**

- 用留白区分层级，少用过密分割线
- 圆角 `rounded-lg` 为主，不超过 `rounded-xl`
- 阴影 `shadow-sm` / 悬浮 `shadow-md`

欧美用户习惯 **「呼吸感」**：公开预约页单列居中、`max-w-lg`，避免国内后台式满屏表单。

---

## 四、组件一致性

**实现库（与 `base.mdc` 一致）**：优先 **shadcn/ui**；须用本章 Token 覆盖其默认主题（主色 `green-800` 等），勿与风格方案撞色。

| 组件 | 规范 |
| :--- | :--- |
| 主按钮 | `bg-green-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-900 transition-colors disabled:opacity-50` |
| 次按钮 | `bg-white border border-slate-200 text-slate-700 … hover:bg-slate-50` |
| 危险按钮 | `text-red-600 border-red-200` 或实心 `bg-red-600 text-white`；删除须 **二次确认**（文案说明后果） |
| 输入框 | `border-slate-200 rounded-lg … focus:border-green-800 focus:ring-1 focus:ring-green-800`；**可见 focus 环** |
| 卡片 | `bg-white rounded-lg shadow-sm border border-slate-100 p-6` |
| 链接 | `text-green-800 underline-offset-2 hover:underline`；外链加 `rel="noopener"` |

**按钮文案（英文 · 国际习惯）**

| 场景 | 推荐 | 避免 |
| :--- | :--- | :--- |
| 公开预约 | `Book my appointment` 或固定 `Book My Appointment` | `Submit`、`OK`、`Confirm` |
| 注册试用 | `Start free trial` | `Sign up now!!!` |
| 添加客户 | `Add client` | `Create`（过泛） |
| 保存设置 | `Save changes` | `Submit form` |

每视图 **一个** 主按钮；次要操作用次按钮或文字链。

**表单（国际惯例）**

- **Label 在输入框上方**（非仅 placeholder）；placeholder 作示例，不作唯一标签
- 必填标 `*` 或 `(required)`；选填标 `(optional)`
- 公开预约：**Full name** 单字段即可（不强制 First/Last 拆分，减少非英美姓名困扰）
- **Phone**：`type="tel"`，`autocomplete="tel"`；提示 `e.g. +1 555 123 4567`（E.164 友好，不强制美国格式）
- **Email**：`type="email"`，`autocomplete="email"`
- 错误信息 **具体**：`Please enter a valid email address`，而非 `Invalid input`

---

## 五、页面布局规范

### 5.1 Landing Page（产品官网）

```
┌─────────────────────────────────────────┐
│  Logo              Log in  [Start free trial] │
├─────────────────────────────────────────┤
│  H1 + one-line subhead                  │
│  [Start free trial]   (single CTA)      │
│  Product screenshot / GIF               │
├─────────────────────────────────────────┤
│  3 benefit cards (icon + title + line)  │
├─────────────────────────────────────────┤
│  Pricing: Starter $199/yr · Pro $299/yr │
│  “No credit card required” (if true)    │
├─────────────────────────────────────────┤
│  Footer: Terms of Service · Privacy Policy │
│          · Contact · © Year GetGroomerFlow  │
└─────────────────────────────────────────┘
```

**信任元素（欧美习惯）**

- 页脚 **Terms**、**Privacy Policy** 必链（哪怕 MVP 静态页）
- 定价旁注明 **/year**、是否含税（`excl. tax` 或 `Sales tax may apply` — 与 Lemon Squeezy 策略一致后再定）
- 禁止：假倒计时、假「X 人正在看」、退出拦截弹窗

### 5.2 Dashboard（美容师后台）

```
┌──────────┬──────────────────────────────────┐
│ Nav (≤5) │  Page title (H1)                 │
│ Today    │  Appointment cards               │
│ Clients  │  Time · Pet · Service · Status   │
│ Calendar │                                  │
│ Records  │                                  │
│ Settings │                                  │
└──────────┴──────────────────────────────────┘
```

**约束**

- 导航 **图标 + 英文标签**（不单图标）
- 时间展示跟 **`profiles.timezone`** + 用户浏览器 locale（见 §八）
- 移动：**底部 Tab**（Today / Clients / Calendar / More）

### 5.3 公开预约页 `/book/[slug]`

```
┌─────────────────────────────────────────┐
│  [Avatar]  Business name                │
│  Short bio (1–2 sentences)              │
│  All times shown in Eastern Time (US)   │  ← IANA 友好名称
├─────────────────────────────────────────┤
│  1. Select a service   (price + duration) │
│  2. Pick a date & time (calendar + slots) │
│  3. Your details       (name, email, phone, pet) │
│  [ Book My Appointment ]                │
├─────────────────────────────────────────┤
│  Small print: Privacy · powered by …    │  ← 一行即可，不抢 CTA
└─────────────────────────────────────────┘
```

**约束**

- 步骤感清晰（可标 `Step 1 of 3` 或分节标题）
- 成功页：**预约摘要**（本地日期时间、服务、店铺名）+ `Add to calendar`（`.ics` 链接为 Phase 2 增强）
- 无侧边推销、无强制注册账号

---

## 六、动效与微交互

| 场景 | 规范 |
| :--- | :--- |
| 悬停 | 150～200ms 颜色/阴影 |
| 路由 | 无动画或极短淡入 |
| 加载 | 骨架屏 > 全屏 spinner |
| 反馈 | 顶部 toast，3～5s 自动消失 |
| 系统偏好 | 尊重 **`prefers-reduced-motion`**，减少非必要动画 |

**不做**：退出意图弹窗、飞入动画、自动播放视频、震动反馈。

---

## 七、无障碍（国际底线）

目标：**WCAG 2.1 Level AA**（欧美 B2B/SaaS 常见承诺）。

- 触控目标 ≥ **44×44px**
- 键盘：**Tab 顺序合理**；`focus-visible` 清晰（勿 `outline-none` 无替代）
- 表单：`label` 关联；错误用 `aria-invalid` + 文字说明
- 图标按钮：`aria-label` 或可见文字
- 状态不只靠颜色（成功/错误/警告：图标 + 文案 + 边框）
- 图表/徽章：不只用红绿色区分（考虑图案或文字）

### 7.1 颜色对比度自检（UI 改动后建议）

将 WCAG AA 从「设计约定」落实为「已核对」；**零成本**，发版或大改页面前执行一次。

1. Chrome **DevTools** → **CSS Overview**（或 **Lighthouse** → Accessibility）→ 查看 **Contrast issues**。  
2. **重点扫描**：正文 on 白/`slate-50`、次级字 `slate-600`、主按钮白字 on `green-800`、错误文案 on 白/红框、链接 `green-800` on 白。  
3. 若有 AA 告警：加深字色或调高背景对比，直至消除该项（与 §一 色值表一致）。  
4. **Agent 无法代替此步**；自动化仅覆盖 lint/build，对比度由开发者或负责人在浏览器确认。

---

## 八、国际化：时间、货币与数字

与主方案 **§7.2** 一致；呈现层约定如下。

### 8.1 时区与时间

| 规则 | 说明 |
| :--- | :--- |
| 存储 | UTC（`timestamptz`） |
| 展示 | 美容师 `profiles.timezone`（IANA） |
| 公开页 | 固定文案：**All times shown in {Timezone label}**（如 `Eastern Time (US & Canada)`，可用 `Intl` 长名称） |
| 格式 | 用 `Intl.DateTimeFormat(locale, { timeZone, … })`；**不**硬编码 `AM/PM` 字符串 |
| 12h / 24h | 跟 **`navigator.language`**（`en-US` → 12h，`en-GB` → 24h 常见） |
| 周起始日 | 日历组件跟 locale（美国常周日始、英国常周一始）；Phase 2 可在设置覆盖 |

**示例（同一时刻）**

- `en-US`：`Wed, Mar 4, 2026 at 9:00 AM`
- `en-GB`：`Wed 4 Mar 2026, 09:00`

### 8.2 货币与价格

| 规则 | 说明 |
| :--- | :--- |
| MVP 货币 | **USD**（`en-US`） |
| 展示 | `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` → `$45.00` |
| 服务定价 | 公开预约与后台一致；注明 **Prices in USD**（若仅支持美元） |
| 订阅 | `$199/year` 或 `$19/month`，避免仅写 `$199` |

### 8.3 电话与地址

- 电话：国际化输入，**不**强制 `(XXX) XXX-XXXX` 掩码（非美国用户友好）
- MVP 可不收集街道地址；若未来加，按 **Country → State/Province → Postal code** 分区

---

## 九、文案语气与信任合规

### 9.1 语气

- **短句、主动语态**：`Send reminders automatically`，而非 `Reminders will be sent by the system`
- **避免**：夸张营销（`Best groomer software ever`）、法律恐吓式 Privacy、内部缩写（`Appt` → `Appointment`）
- **宠物相关**：用 `pet parent` / `client` 均可，全站统一；公开页可用 `Your details`

### 9.2 信任与隐私（海外用户敏感点）

| 元素 | MVP 建议 |
| :--- | :--- |
| Privacy Policy | 静态页链接；说明收集姓名/邮箱/电话/宠物信息用于预约 |
| Terms of Service | 静态页；订阅与试用条款可简版 |
| 邮件 | 含店铺名、退订/联系邮箱（事务邮件） |
| Cookie | 若仅用必要会话 Cookie，页脚一句说明；若接分析（Plausible 等）再补 **Cookie notice**（欧盟访客） |
| 数据 | 设置页预留 **Export my data**（Phase 2，呼应 GDPR 预期） |

### 9.3 空状态与错误页

- 空日历：`No appointments today` + 引导 `Add appointment` 或分享预约链接
- 404：`Page not found` + 回首页链接
- 网络错误：`Something went wrong. Please try again.` + 重试按钮（不暴露 stack trace）

---

## 十、对标参照

| 产品 | 参考点 |
| :--- | :--- |
| **Calendly** | 公开预约步骤、时区提示、成功页摘要 |
| **Linear** | 后台密度、导航、卡片 |
| **Square Dashboard** | 小店主的信任感、简洁报表 |
| **Plausible** | 克制配色、可读图表 |

---

## 十一、给 Cursor 的约束片段

```text
GetGroomerFlow UI targets independent pet groomers in the US/UK/CA/AU.
Use Inter, green-800 (#166534) primary, slate neutrals, rounded-lg,
shadow-sm, no gradients. One primary CTA per screen. All copy in English
(en-US spelling default). Use Intl for dates/times/currency. Show groomer
timezone on /book/[slug] ("All times shown in …"). Labels above inputs;
accessible focus rings; 44px touch targets; WCAG 2.1 AA contrast.
Friendly, professional tone—no dark patterns, no exit popups.
Mobile-first responsive dashboard with bottom nav on small screens.
```

---

## 十二、文档维护说明

- **Cursor 执行 UI**：**`.cursor/rules/base.mdc` → Agent 执行流程**（步骤 1、3）；组件库回退见该文件与 §四。
- 与主方案冲突：**功能以主方案为准，视觉以本文件为准**。
- 实现驱动改主色/布局/组件时，同 PR 简短修订本文件对应节。  
- 新页面或全局换色后：按 **§7.1** 做对比度自检（可在 PR 描述写「Contrast checked via DevTools」）。
