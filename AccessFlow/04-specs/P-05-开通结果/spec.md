# AccessFlow 开通结果 Spec · P-05 F01

> 页面类型：Web 工作台内页（开通结果 · 部分完成）  
> 接在：[`../P-04-跨系统执行进度/spec.md`](../P-04-跨系统执行进度/spec.md) **P-04 到达 F01 之后**，以及侧栏「开通记录」  
> 设计系统：**Ant Design 6 + 本仓库已上线页（P-01～P-04）**  
> 布局模板：与首页 / 审阅 / 确认 / 进度页同一套 **`SideLayout`**，禁止另起 TopLayout / 第二套顶栏  
> 视觉权威：构图跟 [`reference.png`](./reference.png)；颜色、间距、组件跟已上线页 + Ant Design Token  
> 壳层 / Token / 用户区：以首页 Spec [`../P-01-新建开通/spec.md`](../P-01-新建开通/spec.md) 为准  
> 流程 Steps / 员工 / 图标 / 抽屉：以 **P-02 + P-04 实现**为准  
> 行为权威：[`../../01-prd/PRD-AccessFlow-v1.1.md`](../../01-prd/PRD-AccessFlow-v1.1.md) FR-05  
> 需求源头：[`../../00-backlog/project-backlog.md`](../../00-backlog/project-backlog.md)  
> 版本：v1.2 · 2026-08-21 · 作者 jiali

## 权威优先级

| 优先级 | 来源 | 管什么 |
|---|---|---|
| 1 | PRD v1.1 FR-05 | F01 四类结果、幂等、审批、查询/重试、整单不得标完成 |
| 2 | 已实现页面（`02-wireframe`） | 壳、路由、`STAGE_STEPS`、用户名、ICON_MAP、申请单号、抽屉写法 |
| 3 | 本页高保真稿 `reference.png` | **构图**：总览环 + 四格计数、成功 2×2、异常全宽分组、操作文案 |
| 4 | Ant Design Skill | Token、白卡、Tag、Progress、List、Drawer、Modal，禁止自绘色板 |

冲突时：业务对错看 PRD；**壳和步骤跟已上线页**；**结果页区块摆放跟高保真稿**；色值、圆角、间距跟 Token。不要为了稿面把产品改回 TopLayout，也不要把总览拆成四张独立指标卡以致不像那张图。

---

## 0. 和前面页面怎么接

主路径已经跑通：

```text
P-01 `/` 生成方案
  → P-02 `/plan` 审阅（current=1）
  → P-03 `/confirm` 确认（current=2）→ sessionStorage `accessflow.p03.confirmed`
  → P-04 `/progress` 执行中（current=3）
  → 本页 `/f01` 部分完成（current=4）
  → P-06 `/result` 只读摘要（仍是部分完成）
```

| | P-04 跨系统执行进度 | P-05 开通结果 |
|---|---|---|
| 整单状态 | `IN_PROGRESS` | `PARTIAL_COMPLETE` |
| 用户任务 | 谁正在跑、能不能离开 | 四类结果和下一步该谁处理 |
| 列表怎么分组 | 当前执行 / 队列 / 待审批 / 已完成（可收起） | **成功 / 失败 / 待审批 / 结果未知**（稿面顺序） |
| 成功项 | 默认收起 | **展开**，2×2 压缩展示 |
| 设计工具 | 尚未开始或执行中 | **失败：无可用许可证** |
| 文件库 | 尚未开始 | **结果未知：超时，只能查询** |
| 主操作 | 刷新、查看详情 / 日志 | 查看回执、如何处理、审批详情、取消 / 核验 |
| 本页会不会开通 | Agent 仍在跑 | 不再发起新开通；成功项锁定 |

陈晨默认路径（7 项全勾选，P-03 已确认）：

```text
P-04 看见：账号已完成、邮件执行中、其余排队 / 待审批
                ↓ 到达 F01 固定组合（或点 Steps「开通结果」/ 侧栏「开通记录」）
P-05 看见：部分完成 = 4 成功 + 1 失败 + 1 待审批 + 1 未知
           排除 2 项仍不出现
```

不得在 P-04 把整单写成完成后再进本页。

---

## 1. 页面目标

用人经理在执行到达 F01 后，用一屏看清：哪些已经开通、谁还在处理、哪里要人工、Agent 下一步做什么。

| 项 | 内容 |
|---|---|
| 路由 | `/f01`（与 `App.tsx` / 侧栏「开通记录」已预留路径一致） |
| PRD 页面 | P-05 F01 部分完成 |
| 导航布局 | **同一 SideLayout**。当前菜单「开通记录」 |
| 主用户（壳层） | 与已上线页一致：**李经理** |
| 员工事实 | 陈晨；直属经理字段仍是王璐 |
| 进入 | ① P-04 Steps 第 5 步 / 到达 F01 后 `navigate('/f01')` ② 侧栏「开通记录」③ P-01「查看进度」在 `resumeTicket` 非 `IN_PROGRESS` 时（已有 `resumePath` → `/f01`） |
| 成功出口 | 无「全部完成」。页头 extra「查看结果摘要」→ `/result` |
| 演示整单 | `PARTIAL_COMPLETE`：4 成功 / 1 失败 / 1 待审批 / 1 结果未知 |
| 面包屑 | **不展示** |

本页**不执行开通、不批准权限、不提供成功项重试、不把未知项做成重新申请**。

### 1.1 从进度页带过来的事实

| P-04 / 会话产出 | 本页怎么用 |
|---|---|
| `loadStoredPlan()` | 只渲染 `selectedKeys` 对应项；未勾选项不出现 |
| `hasConfirmed()` / `CONFIRMED_KEY` | 未确认却打开 `/f01`：仍展示陈晨 F01 演示数据（静态可点），不要空白 |
| `progressCase.requestNo` | 同一申请单号 `REQ-20240907-0017` |
| `employeeProfile` | 本页总览不重复员工卡（稿面没有）；抽屉和摘要需要时再用 |
| `ICON_MAP` | 与 P-02 / P-04 **同一套**（`BankOutlined` 等） |
| 排除 2 项 | **整组不渲染**（P-03 / P-04 已如此） |
| 申请编号 | 延续 P-04：`ACC-20240907-001`、`MAIL-20240907-014`、`APV-20240907-003` 等，不要改回稿面 `REQ-001-00x` |

直达 `/f01`（跳过执行页）时，按默认全选 7 项 + F01 固定结果渲染。

### 1.2 硬规则

- 成功项锁定，禁止重复执行
- 未知项只查询原请求，禁止「重新开通」
- 待审批在批准前不得执行；经理确认 ≠ 已批准
- 失败转人工，写清责任角色
- 状态必须图标 + 文字 + 颜色
- 4 项成功时整单仍是「部分完成」

---

## 2. 技术栈与 Token

与首页 **完全相同**，不另起主题。复用已接入的 `global-style.css`、`ConfigProvider`、`ProConfigProvider`。

禁止在本页再包一层 `ConfigProvider` 换主色。禁止混用 TopLayout。

数据：新建 `src/mock/f01.ts`，从 `plan.ts` / `progress.ts` 引用 `loadStoredPlan`、`employeeProfile`、`progressCase`、`PlanIconKey`。不要复制一套员工字段。

样式：复用 `p02.css` 的 `.p02-stat-icon` / `.p02-stat-value`，以及 `p04.css` 的 `.p04-item`、`.p04-item-icon`、抽屉 header。本页只新增 `.p05-*` 差量（总览左右分栏、成功 2 列网格、分组浅底）。

---

## 3. 画板与壳层差量

画板、侧栏、用户区、菜单项定义全部引用首页。本文只写不同的地方。

```text
┌──────── 208 / 64 ──────┬────────────── 主内容区 ──────────────┐
│ 固定顶栏 56px          │  Content padding 24px                │
│ Logo + Access Flow     │  .ds-page-shell gap 16px             │
├────────────────────────┤    Steps（current = 4）               │
│ 新建开通               │    PageHeader + extra                 │
│ 正在执行               │    Alert warning                      │
│ 开通记录 ← current     │    结果总览卡（环 + 四格，稿面构图）  │
│ 设置                   │    成功 2×2                           │
│                        │    失败全宽                           │
│ 用户区 李经理          │    待审批全宽                         │
│ 头像 帮助 通知         │    结果未知全宽                       │
└────────────────────────┴──────────────────────────────────────┘
```

同一页面只允许这一套导航。流程 `Steps` 仍在 **Content 里**。

### 3.1 本页菜单态

| 菜单 | 本页状态 | 点击 |
|---|---|---|
| 新建开通 | 默认 | 回 P-01 `/`；方案仍在 sessionStorage |
| 正在执行 | 默认 | 已确认 → `/progress` 只读进度；未确认 → `message.info('当前没有正在执行的开通任务')` |
| 开通记录 | `aria-current="page"` | 已在本页则滚到顶部 |
| 设置 | 默认 | 同首页占位 |

侧栏选中规则同首页（灰底加深字，禁止浅蓝底蓝字）。

### 3.2 P-04 接线（实现本页时一并改）

当前 `P04Progress` 点第 5 步只会 Toast「执行尚未结束」。本页上线后改为：

```ts
if (current === 4) {
  navigate('/f01');
  return;
}
```

静态演示允许从进度页直接点进结果页，不必等真实轮询。侧栏「开通记录」已经 `navigate('/f01')`，把占位 `PlaceholderPage` 换成本页即可。

---

## 4. 主内容区结构

导航层不渲染业务标题。本页自己输出 `.ds-page-header`。禁止原生 `<h1>`。

构图对齐高保真稿，组件用 antd：

```tsx
<div className="ds-page-shell p05-page">
  <Steps size="small" current={4} items={STAGE_STEPS} onChange={...} />

  <div className="ds-page-header">
    <Space direction="vertical" size={4}>
      <Space align="center" size={8}>
        <Title level={4} className="ds-page-title">执行结果</Title>
        <Tag bordered={false} color="warning">部分完成</Tag>
      </Space>
      <Text type="secondary">
        申请单号：{progressCase.requestNo}
        <Divider type="vertical" />
        发起时间：{progressCase.createdAt}
        <Button type="text" size="small" icon={<CopyOutlined />} aria-label="复制申请单号" />
      </Text>
    </Space>
    <Button type="link" className="ds-page-header-extra">查看结果摘要</Button>
  </div>

  <Alert type="warning" showIcon closable className="ds-page-inline-alert" message={...} />

  <Card bordered={false} className="ds-page-card p05-overview">{/* 环 + 四格 */}</Card>

  <Card bordered={false} className="ds-page-card p05-group is-success">{/* 2×2 */}</Card>
  <Card bordered={false} className="ds-page-card p05-group is-error">{/* 失败 */}</Card>
  <Card bordered={false} className="ds-page-card p05-group is-warning">{/* 待审批 */}</Card>
  <Card bordered={false} className="ds-page-card p05-group is-unknown">{/* 未知 */}</Card>
</div>
```

PageHeader **禁止** `padding-inline` / `padding-bottom`。间距只由 `.ds-page-shell` 的 `gap: 16px` 承担。

无吸底「全部完成」主按钮。本页底栏提供人工收口：

| 按钮 | 类型 | 行为 |
|---|---|---|
| 保存 | default | 写入会话结果快照；整单仍记 `PARTIAL_COMPLETE` |
| 返回首页 | default | `/`，不改整单事实 |
| 完结权限开通 | primary | 二次确认后标记人工完结：剩余项不再继续执行；进 `/result`。**不是**全部成功 |

完结确认文案须写明：结束后剩余项不再由 Agent 自动推进；已成功项不重复开通；整单仍为部分完成。

### 4.1 流程 Steps

与 P-02～P-04 共用四步模型。本页 `current={3}`，`stageSteps('result')`，第四步标题为「执行结果」（与 P-04 的「执行进度」同一索引）。

| index | title | 对应 | 本页状态 | 点击 |
|---|---|---|---|---|
| 0 | 新建开通 | P-01 `/` | `finish` | 回首页，不重跑生成 |
| 1 | 开通方案审阅 | P-02 `/plan` | `finish` | `message.info('已进入结果阶段，不可返回修改方案')` |
| 2 | 权限与执行确认 | P-03 `/confirm` | `finish` | 同上 |
| 3 | 执行结果 | P-05 `/f01` | `process` | 已在本页则滚顶 |

P-04 → P-05 为同一申请单的相邻阶段：申请单号、ICON、项列表语言连续；分组从「执行态」切到「结果态」。到达 F01 后由进度页自动进入，也可从侧栏「开通记录」进入。  
当前步同时用 `process`、字重、主色。`aria-current="step"`。不要把第四步画成绿勾满步。

---

## 5. 结果总览（稿面核心，用 P-04 总览写法）

**不要**做成 4 张独立 `StatisticCard` 铺在画布上——会不像稿，也和 P-04「执行总览」脱节。

做成 **一张** `ds-page-card`，左右分栏，对齐 `reference.png`：

```text
┌─────────────────────────────────────────────────────────────┐
│ [Progress 环 72]  部分完成          │  4 成功  1 失败  1 待审批  1 未知 │
│                   存在待人工处理…    │  （四格等分，图标 + 数字 + 名）    │
└─────────────────────────────────────────────────────────────┘
```

| 元素 | 实现 | 对齐稿面 |
|---|---|---|
| 环 | antd `Progress type="circle"` `size={72}` | 左侧未完成环 |
| percent | `Math.round(4 / 7 * 100)` ≈ 57 | **不要**画成满环或绿色成功环 |
| stroke | `token.colorWarning` | 稿面橙色 = 部分完成，用 warning Token |
| trail | `token.colorBorderSecondary` | |
| format | `() => '4/7'`，`--font-number` | 稿面环心不必写字，实现用 4/7 更可读 |
| 结论 | `Typography` 20px / 600 + `Tag color="warning"` 可二选一，不要重复两次「部分完成」：环侧标题用「部分完成」，页头 Tag 可保留 |
| 说明 | `Text type="secondary"` 单行 | 「存在待人工处理或结果未知的项，请查看详情并处理。」 |
| 四格 | 复用 `.p02-stat-icon` + `.p02-stat-value`，`grid-template-columns: repeat(4, minmax(0, 1fr))`，`gap: 12px` | 稿面右侧四格；不要再套一层灰底大容器 |

四格：

| title | value | icon | tone（已有 class） |
|---|---|---|---|
| 成功 | 4 | `CheckCircleOutlined` | `is-success` |
| 失败 | 1 | `CloseCircleOutlined` | `is-error` |
| 待审批 | 1 | `ClockCircleOutlined` | `is-warning` |
| 结果未知 | 1 | `QuestionCircleOutlined` | `is-purple`（P-04 已有） |

点击某一格：滚动到对应分组。`aria-label` 如「1 项失败，跳转到失败分组」。

窄屏：总览改为上下堆叠；四格 2×2。1024 宽度下环和四格仍要同时看见。

无障碍：环 `role="progressbar"` `aria-valuenow={4}` `aria-valuemax={7}` `aria-label="7 项中 4 项已开通，整单部分完成"`。

---

## 6. 分组卡（稿面色块 → Token 浅底）

稿面用绿 / 红 / 橙 / 紫整组底。实现用 **白卡 + 语义浅底**，禁止手写 `#E8FFEA` 等 hex。

```css
.p05-group.is-success { background: var(--color-success-bg); }
.p05-group.is-error { background: var(--color-error-bg); }
.p05-group.is-warning { background: var(--color-warning-bg); }
.p05-group.is-unknown { background: #f9f0ff; } /* antd purple-1，与 P-04 is-purple 同源，注释写明 */
```

卡片仍 `bordered={false}` `className="ds-page-card p05-group is-*"`。浅底是分组识别，**列表行不要再整行铺色**（跟 P-04 列表规则一致）。

标题行与 P-04 `SectionCard` 相同：`ds-card-title-row` + 语义色图标 + `ds-table-title`（成功 / 失败 / 待审批 / 结果未知）。不要写「成功（4）」。

某类计数为 0：整组不渲染。演示四组都有数据。

内部条目复用 P-04 `.p04-item`：左图标圆底、标题 + Tag、描述、元信息、右侧 `Typography.Link`。这样结果页和进度页是同一套「权限项」。

---

## 7. 成功 · 2×2（稿面网格）

成功组内：

```css
.p05-success-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--margin); /* 16px */
}
```

`< 596px` 改为 1 列。无分页、无勾选、无「新建」。

条目用 `.p04-item`，不要再套一层 AntD `Card`（避免双投影）。操作文字链，不加图标。

| id | 系统 | 申请编号 | 完成 | Tag | 操作 |
|---|---|---|---|---|---|
| account | 公司账号 | ACC-20240907-001 | 09:02 | `success` 已完成 | 查看回执 |
| mail | 邮件与即时通信 | MAIL-20240907-014 | 09:02 | `success` 已完成 | 查看回执 |
| knowledge | 知识库 | KB-20240907-008 | 09:02 | `success` 成功 | 查看详情 |
| board | Atlas 项目看板 | BOARD-20240907-021 | 09:02 | `success` 成功 | 查看详情 |

描述统一：「不可重复处理」。  
禁止「重试 / 再次开通」。`allowedActions`: `viewReceipt` 或 `viewDetail`（抽屉字段相同）。

图标必须走 P-02 `ICON_MAP`，不要换一套。

---

## 8. 异常 · 全宽（稿面横卡）

每组 1 条，`.p04-item-stack` 单列。操作 `Button type="link"`，1024 下不得折进「更多」。

### 8.1 失败 · 设计工具

| 字段 | 值 |
|---|---|
| id | `design` |
| 申请编号 | DES-20240907-005 |
| Tag | `error` 失败 |
| 描述 | 原因：无可用许可证 |
| 处理人 | 设计工具管理员 |
| 下一步 | 补充许可证后 Agent 将自动继续 |
| 操作 | 查看如何处理 / 联系管理员 |
| allowedActions | `viewGuide`, `contactAdmin` |

### 8.2 待审批 · 产品数据看板

| 字段 | 值 |
|---|---|
| id | `dashboard` |
| 申请编号 | APV-20240907-003（与 P-04 同一条审批单） |
| Tag | `warning` 待审批 |
| 描述 | 审批前不得执行。审批通过后 Agent 自动继续 |
| 审批人 | 数据负责人 |
| 操作 | 邮件提醒 / 查看审批详情 |
| allowedActions | `viewApproval`（`remindEmail` 不进后端；按钮仍画出来走占位） |

### 8.3 结果未知 · Atlas 项目文件库

| 字段 | 值 |
|---|---|
| id | `files` |
| 申请编号 | FILE-20240907-007 |
| Tag | `default` 结果未知（文字必须有；图标可用 purple） |
| 描述 | 请求超时，当前无法判断是否已经开通。只能查询结果 |
| 处理人 | Agent |
| Agent | 正在查询最终状态 |
| 下一步 | 确认结果后更新状态 |
| 操作 | 取消开通 / 人工核验已开通 |
| allowedActions | `cancelProvision`, `manualVerify` |

进入本页即视为已开始查询，**不**再放「查询结果」主按钮（P-04 执行中才需要那条）。禁止「重新开通」。

---

## 9. Drawer / Modal

与 P-02 / P-04 **同一套浮层**：`p02-drawer-header` + body padding 24px，宽 `min(480px, 80vw)`，`closable={false}` `title={null}`。展示类无 footer。

### 9.1 回执 / 详情 / 如何处理 / 审批详情

`Descriptions` `column={1}` `size="small"` `className="ds-descriptions"`，`items` 数组。字段对齐 P-04 抽屉：目标系统、权限范围、有效期、执行状态、审批状态、申请编号、下一步。

成功项额外写死可用操作：「无。该项已开通，不能重复执行」。  
如何处理：发生了什么 / 为什么 / 谁负责 / 经理现在 / Agent 下一步（见文案表）。  
审批详情：**无批准 / 驳回**。有效期写「若开通，将于 12 月 31 日自动失效」。

**联系管理员**：不打开抽屉。`message.info('请联系设计工具管理员补充许可证。本期不提供管理员工作台。')`

**邮件提醒**：`message.info('演示环境暂不支持邮件提醒')`，不发信。按钮保持可点。

### 9.2 取消开通 / 人工核验

操作类 `Modal` `centered` 宽 480，三段式，禁止默认 `top: 100px`。

| | 取消开通 | 人工核验已开通 |
|---|---|---|
| 标题 | 确认取消开通？ | 确认该项已开通？ |
| 正文 | 将停止对该项的后续开通尝试，不会重新提交申请。已成功的其他项不受影响。 | 请确认已在目标系统看到该权限生效。核验后将标记为成功，且不可重复开通。 |
| 主按钮 | `danger` 确认取消 | `primary` 确认已开通 |
| 成功 Toast | 已取消该项开通，未创建新申请 | 已按人工核验标记为成功，不会重复开通 |

确认中 `loading`。Esc / 遮罩 = 不提交。整单仍为部分完成。

查询返回仍未知：`message.info('仍无法确认结果，未创建新申请')`，保持 UNKNOWN。

---

## 10. 数据 · `src/mock/f01.ts`

```ts
export type ResultGroup = 'success' | 'failed' | 'pending' | 'unknown';

export function buildF01Items(plan = loadStoredPlan()): F01Item[] {
  // 仅 selectedKeys；套 F01_SNAPSHOT
}
```

`F01_SNAPSHOT` 固定：

| id | exec | approval | group |
|---|---|---|---|
| account | SUCCEEDED | NOT_REQUIRED | success |
| mail | SUCCEEDED | NOT_REQUIRED | success |
| knowledge | SUCCEEDED | NOT_REQUIRED | success |
| board | SUCCEEDED | NOT_REQUIRED | success |
| design | FAILED | NOT_REQUIRED | failed |
| dashboard | NOT_STARTED | PENDING | pending |
| files | UNKNOWN | NOT_REQUIRED | unknown |

公司账号若被取消勾选：依赖项按 P-04 逻辑标阻塞，不进成功组。演示默认 7 项全选，不走这条。

计数由 `buildF01Items` 聚合，不要在 JSX 写死 4/1/1/1（演示数据会得到这个数）。

---

## 11. 交互与状态

```text
打开 /f01
  → 读 plan + F01_SNAPSHOT
  → 渲染部分完成
  → 文件库显示「正在查询」
        ├─ 查看* → Drawer
        ├─ 邮件提醒 / 联系管理员 → message 占位
        ├─ 取消 / 核验 → Modal → 更新该项 → 整单仍部分完成
        └─ 查看结果摘要 → /result
```

| 场景 | 处理 |
|---|---|
| 刷新 | 重新 `buildF01Items`；不得把 4 成功写成完成 |
| 浏览器后退 | 回 `/progress` |
| Logo / 新建开通 | 回 `/` |
| 未确认直达 | 仍渲染演示 F01，不空白 |
| 加载失败 | `Alert type="error"` + 重试 |

页面状态：`loading` / `partial` / `load_failed`。陈晨演示进入即 `partial`。

---

## 12. 文案

| 场景 | 文案 |
|---|---|
| 标题 | 开通结果 |
| Tag | 部分完成 |
| Alert | 存在待人工处理或结果未知的项，请查看详情并处理。已成功的项目不会重复开通。 |
| 复制 | 已复制申请单号（复制 `REQ-20240907-0017`） |
| 成功锁定 | 不可重复处理 |
| 失败 | 原因：无可用许可证 |
| 失败下一步 | 补充许可证后 Agent 将自动继续 |
| 待审批 | 审批前不得执行。审批通过后 Agent 自动继续 |
| 未知 | 请求超时，当前无法判断是否已经开通。只能查询结果 |
| 查询仍未知 | 仍无法确认结果，未创建新申请 |
| 核验成功 | 已按人工核验标记为成功，不会重复开通 |
| 取消成功 | 已取消该项开通，未创建新申请 |
| 不可返回改方案 | 已进入结果阶段，不可返回修改方案 |
| extra | 查看结果摘要 |
| 加载失败 | 结果暂时无法加载，请重试。已成功的项目不会重复执行 |

对经理说话。不出现 Mock、错误码、模型名。责任人只用角色。

---

## 13. Design Token

**跟随首页 §5 与 P-04 总览。** 本页额外：

| 用途 | Token |
|---|---|
| 部分完成环 / Tag | `--color-warning` `#faad14` |
| 成功组浅底 / 成功格 | `--color-success-bg` / `--color-success` |
| 失败组浅底 | `--color-error-bg` / `--color-error` |
| 待审批组浅底 | `--color-warning-bg` |
| 未知组浅底 / 第四格 | purple-1 / purple-6（与 P-04 `is-purple` 相同） |
| 卡片 | `--shadow`、`--border-radius-lg` 8px |
| 内容线 | 水平 24px、垂直 16px |
| 数字 | `--font-number` |

禁止业务 CSS 写 `#2B6BF3`、`#F77234`、12px 大圆角。`ConfigProvider` 只传 hex。

---

## 14. 与稿面 / 旧 Spec / 已上线页

| 点 | 高保真稿 | 已上线 P-01～P-04 | 本 Spec |
|---|---|---|---|
| 壳 | 无侧栏向导顶栏 | SideLayout + 李经理 | **跟已上线页** |
| 步骤 | 四步「基本信息」等 | `STAGE_STEPS` 五步 | **五步，current=4** |
| 用户 | 李经理 | 李经理 | 李经理；员工经理字段王璐 |
| 总览 | 环 + 右侧四格 | P-04 已是「环 + 计数」一张卡 | **一张总览卡**，不要 4 张独立指标卡 |
| 分组底 | 绿红橙紫色块 | 白卡 | 白卡 + Token 浅底，贴近稿面识别 |
| 成功 | 2×2 | P-04 成功默认收起 | **展开 2×2** |
| 申请编号 | REQ-001-00x | ACC / MAIL / APV… | **跟 P-04 编号体系** |
| 邮件提醒 | 有 | Later | 入口保留，message 占位 |
| 未知操作 | 取消 / 人工核验 | P-04 为「查询结果」 | 查询自动进行；稿面两个操作保留；禁止重试 |
| 壳层 TopLayout（v1.1 本文） | — | 实际是 SideLayout | **作废 TopLayout** |

---

## 15. 验收

### 接上主路径

- [ ] 路由 `/f01`，侧栏当前「开通记录」
- [ ] `STAGE_STEPS` 文案与 P-02～P-04 完全相同，本页 `current={4}`
- [ ] P-04 点「开通结果」进入本页；侧栏「开通记录」进入本页
- [ ] 申请单号 `REQ-20240907-0017`，图标与 P-04 `ICON_MAP` 相同
- [ ] 只出现已勾选的 7 项，排除 2 项不出现
- [ ] 壳层「李经理」，无第二套顶栏

### 像那张结果图（构图）

- [ ] 首屏能同时看到：Steps、开通结果、部分完成、环、四格计数
- [ ] 总览是 **一张卡**：左环右四格，不是四张独立指标卡
- [ ] 环是 warning、约 4/7，不是绿色满环
- [ ] 成功 2×2；失败 / 待审批 / 未知各一条全宽
- [ ] 分组能靠浅底 + 标题区分四类（不是纯白堆叠看不出稿面分区）

### F01 事实

- [ ] Tag / 结论为「部分完成」，不是开通成功
- [ ] 计数 4 / 1 / 1 / 1
- [ ] 设计工具：无可用许可证，设计工具管理员
- [ ] 产品数据看板：数据负责人，抽屉不能批准
- [ ] 文件库：只能查询，没有重新开通
- [ ] 成功项只有查看回执 / 详情

### Ant Design

- [ ] 无业务硬编码品牌色
- [ ] Drawer 480 + `p02-drawer-header`；Modal `centered` 三段式
- [ ] 1024 下失败 / 未知操作链可见
- [ ] 状态同时有图标、文字、颜色

---

## 16. 实现备注

- 页面文件建议 `src/pages/P05Result.tsx` + `p05.css`；在 `App.tsx` 替换 `/f01` 占位。
- 同时改 `P04Progress` 的 `onStepChange(4)`。
- TypeScript 禁止 `any`。
- P-06 `/result` 仍可占位，但 extra 链要能点进去；摘要不得写成全部完成。
