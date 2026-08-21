# P-04 跨系统执行进度 — 页面规格

> 对应功能：FR-04  
> 对应 PRD：[`../../01-prd/PRD-AccessFlow-v1.1.md`](../../01-prd/PRD-AccessFlow-v1.1.md)  
> 设计稿：[`design-reference.png`](design-reference.png)  
> 需求源头：[`../../00-backlog/project-backlog.md`](../../00-backlog/project-backlog.md)  
> 设计体系：Ant Design 6 + ProComponents + AccessFlow 业务规则

## 文档信息

| 项 | 内容 |
|---|---|
| 产品 | AccessFlow |
| 页面 | P-04 跨系统执行进度 |
| 文档版本 | v1.1 |
| 上一版本 | v1.0（2026-08-20，按设计稿整理） |
| 日期 | 2026-08-20 |
| 作者 | jiali |
| 视口 | 桌面 Web 1440×900 |
| 保真 | 高保真（四张必交页之一） |
| 主用户 | 用人经理王璐 |
| 本页主状态 | 整单 `IN_PROGRESS`（执行中） |
| 技术栈 | React 19 + TypeScript 5 + `antd@^6` + `@ant-design/pro-components@^2.7` + `@ant-design/icons@^6` |

本文件是 P-04 的设计与实现单一事实源。

- **业务规则**以 PRD v1.1 为准。
- **布局、间距、组件、Token、浮层**以 Ant Design Skill（`layout.md` / 列表 / 指标卡 / 描述列表 / 抽屉）为准。
- **信息架构**（整单摘要、六态计数、按状态分组的七项、详情抽屉）以设计稿为准，视觉实现不得照搬稿上的硬编码色、整行铺色、12px 圆角或「一张大卡包整页」。

冲突时：业务对错看 PRD；怎么画看本 spec 的 Ant Design 映射。

---

## 1. 页面目标

王璐确认方案后进入本页，要立刻说清三件事：

1. **整单到哪了**：7 项里完成了几项，整体是不是还在执行。
2. **现在谁在动**：Agent 正在开通哪一项、外部还在等谁、后面自动跑什么。
3. **要不要我出手**：若无需处理，可以离开；若某步需要她，必须一眼看见。

成功标准：不点开抽屉，也能在 15 秒内说出「正在执行邮件、数据看板在等审批、其余会自动接着做」。

本页**不是**终态页。到达 F01 组合后自动进入 P-05。排除项（客户数据导出、生产系统管理）永不出现在本页列表。

---

## 2. 进入 / 离开

| 方向 | 条件 | 行为 |
|---|---|---|
| 进入 | P-03 确认成功，工单已写 `CONFIRMED` | 跳转 P-04；`Steps.current = 3`（第 4 步） |
| 停留 | 整单 `IN_PROGRESS` | 轮询刷新；用户可手动刷新、打开抽屉 |
| 离开（自动） | 七项到达 F01 固定组合 | 进入 P-05，不在本页把整单写成「完成」 |
| 离开（用户） | 关闭页 / 去别的任务 | 允许。Agent 继续执行；页面说明提示条必须说清 |
| 返回 P-03 | — | **禁止**。确认后不可改方案 |
| 深链重进 | 同一工单仍在执行 | 回到本页最新状态，不重放确认 |

刷新失败不丢已成功项，也不允许因此重跑成功项。

---

## 3. 设计体系

### 3.1 导航选型

AccessFlow 是菜单项少、单工单向导的轻量工作台，**只使用 TopLayout**。禁止 SideLayout / MixedLayout，禁止本页再套第二套导航。

本期无独立模块首页。顶栏一级菜单可只保留当前任务名「权限开通」（`menu-item.active`），或暂不渲染菜单、只留品牌区——二者择一，不得用 `Tabs` / 胶囊 / `Menu mode="horizontal"` 冒充顶导。

### 3.2 组件映射

| 页面区块 | Ant Design / Pro 组件 | Skill 模板 / 规范 | 禁止 |
|---|---|---|---|
| 全局壳 | 复制 `TopLayout.tsx` | `references/layout.md` §2 | 自绘 64px 顶栏；品牌区竖分割线 |
| 主内容 | `.ds-page-shell` + `.ds-page-header` | 页面标题唯一来源 | 布局层再写一个 `<h1>`；大卡包住整页 |
| 四步进度 | `Steps`（展示型，非表单） | 水平 ≤4 步；`current={3}` | `StepsForm`；可点击回退 |
| 页面说明 | `Alert` + `ds-page-inline-alert` | `layout.md` §页面说明提示条 | 自定义蓝底长条；`message` + `description` 双行 |
| 六态指标 | 通栏 `ds-statistic-card` Grid | 同级指标卡 | 并排员工身份卡；把进度环塞进指标卡 |
| 执行总览 | 右区同级指标卡 Grid 3×2 | `02-IconStatisticCard` | 再包一层「执行总览」大卡 |
| 执行明细 | 一张 `Card.ds-list-card` + `List` | 基础列表；组标题在卡内 | 列表项再外包 Card；按状态给整行铺色 |
| 状态 | `Tag` 预设色 / `Badge` | 列表「行背景与业务语义」 | 行背景表达「执行中 / 待审批」 |
| 项内进度 | `Progress type="line"` | 放在 List.Item 内容区 | 自绘 6px 色条 |
| 详情 | 展示类 `Drawer` + `Descriptions` | 抽屉 480；基础描述列表 | 默认右上角关闭；body 里再套白卡 |
| 反馈 | `message` / 动态 `Alert type="warning"` | 复制成功用 message；刷新失败用 warning 条 | 用页面说明条承载错误 |

### 3.3 Design Token（实现禁止硬编码）

入口必须引入 Skill 的 `global-style.css`（建议 `src/styles/global-style.css`）。颜色、间距、圆角、阴影只用 CSS 变量。`ConfigProvider.theme.token` **必须传 hex**，禁止 `'var(--xxx)'` 字符串。

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1677ff',
      borderRadius: 8,
      borderRadiusLG: 8,
    },
  }}
>
```

| 用途 | Token | 说明值（仅文档，代码用 var / theme.useToken） |
|---|---|---|
| 画布 | `--nav-color-bg-canvas` | `#f7f8fa` |
| 主色 / 执行中 / 链接 | `--color-primary` / `token.colorPrimary` | `#1677ff` |
| 成功 / 已完成 | `--color-success` | `#52c41a` |
| 警告 / 待审批 | `--color-warning` | `#faad14`（不要用稿上的 `#fa8c16`） |
| 错误 / 被阻塞 / 失败 | `--color-error` | `#ff4d4f` |
| 需要处理（辅助） | antd `purple-6` / `purple-1` | `#722ed1` / `#f9f0ff`（Skill 允许的辅助色，须注释来源） |
| 一级文本 | `--color-text` | `rgba(0,0,0,0.88)` |
| 二级文本 | `--color-text-secondary` | `rgba(0,0,0,0.65)` |
| 三级文本 | `--color-text-tertiary` | `rgba(0,0,0,0.45)` |
| 禁用 / 计数 0 | `--color-text-quaternary` | `rgba(0,0,0,0.25)` |
| 白卡背景 | `--color-bg-container` | `#ffffff` |
| 分割 | `--color-border-secondary` | `#f0f0f0` |
| 页面外缘 / 卡内水平 | `--nav-space-6` | 24px |
| 区块间距 / 卡内垂直 | `--nav-space-4` / `--padding` | 16px |
| 同级指标卡 gutter | `--margin-sm` / `token.marginSM` | 12px |
| 白卡圆角 | `--border-radius-lg` | 8px |
| 白卡投影 | `--shadow` | Skill 三层阴影 |
| 顶栏高 | `--nav-header-height` | 56px |
| 页面主标题 | `--font-size-heading-4` + `--font-weight-secondary` | 20px / 28px / 500 |
| 项名 / 正文 | `--font-size-sm` | 14px / 22px |
| 元信息 / Tag | `--font-size-xs` | 12px / 20px |
| 字体 | `--font-family` | PingFang SC 系统栈；工号不用等宽 code 字体 |

`theme.useToken()` 取 `colorPrimaryBg`、`colorSuccessBg`、`colorWarningBg`、`colorErrorBg` 做图标浅底，禁止手写 `#e6f4ff` 等。

---

## 4. 页面结构

不要用设计稿那种「灰底上的一张 1120px 大白卡包住标题、摘要、列表、底栏」。主内容按 TopLayout 内容区规则拆块，块与块之间只由 `.ds-page-shell { gap: var(--nav-space-4) }` 承担 16px，禁止再给 PageHeader 加 `padding-bottom` / `margin-bottom`。

```text
TopLayout（fixed 顶栏 56px，背景 --nav-color-bg-canvas）
└─ Layout.Content / .content
   padding: var(--nav-space-6)          ← 页面唯一 24px 外缘
   min-height: calc(100vh - var(--nav-header-height))
   └─ .ds-page-shell                    ← gap: 16px
        1. Card.ds-page-card            流程 Steps（4 步）
        2. .ds-page-header              标题 + extra 刷新
        3. Alert.ds-page-inline-alert   页面说明（可关闭）
        4. [可选] Alert type="warning"  仅刷新失败时
        5. 六态同级指标卡 Grid（通栏 6 列；窄屏 3×2）
        6. 执行分组卡片                 需要处理 / 执行进度 / 外部审批
详情 Drawer 从右侧滑出，不属于独立页面，不进 shell。
```

无底部 Tab、无面包屑。窗口变窄时：六态指标卡改为 3 列两行；「刷新」留在 `ds-page-header-extra`，不得消失。

---

## 5. 全局顶栏（TopLayout）

从 `scripts/layout/TopLayout.tsx` 复制，只替换品牌、菜单、用户信息。保留 `.header` / `.brand-name` / `.user-actions` / `.user-name` 与 hover / active。高度 `var(--nav-header-height)`（56px），不是稿上的 64px。

| 位置 | 元素 | 规格 | 本页行为 |
|---|---|---|---|
| 左 | Logo 图形 + `.brand-name` | `ACCESS FLOW` | 点击不离开当前工单（本期无工作台首页） |
| 左 | 一级菜单 `.menu-item` | 选中：文字加深 + 字重 500，**无背景** | 见 §3.1 |
| 右 | 搜索 | TopLayout 默认有 `Input variant="filled"` | **本期省略**。PRD 无全局搜索，不发明检索产品 |
| 右 | 帮助 | `<Button type="text" icon={<QuestionCircleOutlined />}>` | 本期可空链；`aria-label="帮助文档"` |
| 右 | 通知 | 同上 `BellOutlined`，外裹 `Badge` | 演示 `count={2}`；只读下拉，不做催办 |
| 右 | 用户 | `Avatar size={32}` + `.user-name` 王璐 | 下拉：个人资料 / 意见反馈 / 分割线 / 退出登录。本期无真实登录，菜单可禁用并 Tooltip「演示环境」 |

右侧顺序必须是：帮助 → 通知 → 头像 → 用户名。品牌与菜单之间只用留白，禁止竖线。

设计稿写「李经理」「帮助+文字」：实现统一为 **王璐** + **icon-only 按钮**。角标 `2` 不是 7 项进度。

---

## 6. 流程 Steps

与全站共用 `stageSteps('progress' | 'result')`：**四步**，第四步标题随阶段切换。本页 `current={3}`，标题为「执行进度」。

```tsx
<Steps
  className="ds-flow-steps"
  size="small"
  current={3}
  labelPlacement="vertical"
  items={stageSteps('progress')}
/>
```

| 规则 | 说明 |
|---|---|
| 不可回退 | 点第 0～2 步提示「已进入执行，不可返回修改方案」 |
| Mock 推进 | 约每 1.4s 推进一拍；到达 F01 组合后标题与 Steps 第四步同步改为「执行结果」，并自动进入 `/f01` |
| 未凑齐时 | 页头次按钮「稍后处理」回首页，不改整单状态；Agent 继续执行 |
| 状态三通道 | finish / process 同时有图标、标题、颜色；不能只靠绿勾 |
| 页头标题 | 「执行进度」，与 Steps 第四步一致 |

---

## 7. 页面头

PageHeader **在 Card 外**，结构固定：

```tsx
<div className="ds-page-header">
  <Space direction="vertical" size={4}>
    <Title level={4} className="ds-page-title">执行进度</Title>
    <Text type="secondary">
      申请单号：REQ-20240907-0017
      <Divider type="vertical" />
      <span className="db-descriptions-value-row">
        发起时间：2024-09-07 09:00
        <Button type="text" size="small" className="db-descriptions-action-icon" icon={<CopyOutlined />} />
      </span>
    </Text>
  </Space>
  <Space className="ds-page-header-extra" size={8} align="center">
    <Text type="secondary">最近更新：今天 09:03:03</Text>
    <Button loading={refreshing}>刷新</Button>
  </Space>
</div>
```

| 规则 | 说明 |
|---|---|
| 主标题 | 只此一处。`Title level={4}` + `ds-page-title`，禁止原生 `h1` |
| 申请单号 | 业务编号，用默认字体，**不要** `--font-code` |
| 复制 | `message.success('已复制发起时间')`；icon 与正文 baseline 对齐 |
| 刷新 | **次要操作**：默认 `Button`，不带 icon，不要 `type="primary"` |
| 最近更新 | 放 extra，当天显示「今天 HH:mm:ss」；刷新中保持上一刻，不闪空 |
| 刷新失败 | 不改 extra 文案；在 shell 里插入 `Alert type="warning" showIcon`（不可关闭，成功后再卸）文案见 §15 |
| 轮询 | 建议默认 5s；与手动刷新同一接口；进行中忽略重复点击；抽屉打开时也更新当前项 |

---

## 8. 页面说明提示条

设计稿把说明放在主卡底部。Ant Design 页面信息层级要求：**标题下方、业务卡上方**，使用 `Alert type="info"`。

```tsx
<Alert
  type="info"
  showIcon
  closable
  className="ds-page-inline-alert"
  message={
    <span className="ds-text-main">
      Agent 将继续自动执行后续任务并实时同步状态；需要你处理时会及时通知，期间可以离开此页。
    </span>
  }
/>
```

| 规则 | 说明 |
|---|---|
| 单行 | 只 `message`，禁止 `description` / `<br />`；超长省略 |
| 高度 | 约 38px（8px 12px padding + 22px 行高） |
| 可关闭 | `closable`；关闭后副标题末尾出 `Button type="link"`「查看说明」 |
| 与错误分离 | 刷新失败用 warning 条，不写进本条 |

「已完成 1 / 待审批 1」等数量**不准**放进 Alert，只进指标卡。

---

## 9. 头区：六态指标（无员工卡）

执行进度页**不展示**开通对象员工身份卡（姓名 / 工号 / 岗位 / 部门）。头区只保留六态同级指标卡通栏，尽快进入执行明细。

整单完成进度放在 `ds-page-header-extra`：`Progress type="circle" size={32}`，中心 `` `${succeededCount}/${total || 7}` ``。整单状态若需 Tag，用下表；陈晨主路径只应看到「执行中」，不得提前 7/7。

| 整单状态 | Tag 文案 | Tag color |
|---|---|---|
| IN_PROGRESS | 执行中 | `processing` |
| NEEDS_ATTENTION | 需要处理 | `purple` |
| PARTIAL_COMPLETE | 部分完成 | `warning` |
| COMPLETE | 已完成 | `success` |

---

## 10. 六态计数（同级指标卡）

六态使用独立 `ds-statistic-card`（项目等价于 `StatisticCard.statistic`），通栏 `.p04-stat-grid`：`grid-template-columns: repeat(6, minmax(0, 1fr))`，`gap: var(--margin-sm)`。禁止再包一层「执行总览」白卡，也禁止再并排员工信息卡。

窄屏（&lt;1280）改为 `repeat(3, …)` 两行；更窄（&lt;596）改为 `repeat(2, …)`。

| title | icon | 图标色 / 浅底 | value 计入 |
|---|---|---|---|
| 已完成 | `CheckCircleOutlined` | `colorSuccess` / `colorSuccessBg` | `SUCCEEDED` |
| 执行中 | `PlayCircleOutlined` | `colorPrimary` / `colorPrimaryBg` | `RUNNING` |
| 待审批 | `ClockCircleOutlined` | `colorWarning` / `colorWarningBg` | `approvalStatus === PENDING` |
| 被阻塞 | `CloseCircleOutlined` | `colorError` / `colorErrorBg` | `BLOCKED` |
| 需要处理 | `FileTextOutlined` | purple-6 / purple-1 | `FAILED` 或 `UNKNOWN` |
| 尚未开始 | `MinusCircleOutlined` | `colorTextTertiary` / `colorFillTertiary` | `NOT_STARTED` 且审批非 PENDING |

图标容器 42×42，icon 24px。数值 28px / 600。值为 **0** 仍渲染。**六格之和必须等于当前队列项数。** 一项只进一格。待审批优先于尚未开始。

---

## 11. 执行明细（基础列表）

一张 `Card bordered={false} className="ds-list-card"`。左上角必须有结果标题，禁止空白 padding 后直接出列表。

- 卡标题：`ds-card-title-row` + `ds-table-title` → 「执行明细」
- 无搜索、无 Tab、无分页（固定 ≤7 条）。无分页时用 `.ds-list-bottom-spacer` 留 16px 底，避免末项贴边。
- 空分组**整组不渲染**（含组标题），不要「暂无数据」空插画。
- 列表项**不再外包 Card**。hover 背景 `var(--nav-color-bg-canvas)`。**禁止**按「执行中 / 待审批」给整行铺蓝、铺橙、铺灰。

### 11.1 分组顺序

组标题不放图标。用 `Typography.Text` + `.p04-group-label`（12px / 500 / `colorTextSecondary`）与队列项区分；系统线型 icon 只出现在 List.Item 左侧，标识具体系统。状态语义留给项上的 Tag，不要靠标题图标重复表达。下表 icon 仅作分组语义对照，不渲染在组标题上。

| 顺序 | 分组 | icon | 出现条件 |
|---|---|---|---|
| 1 | 需要处理 | `FileTextOutlined` | 存在 FAILED / UNKNOWN |
| 2 | 被阻塞 | `CloseCircleOutlined` | 存在 BLOCKED |
| 3 | 当前执行 | `PlayCircleOutlined` | 存在 RUNNING |
| 4 | 执行队列 | `SettingOutlined` | 依赖已满足、等待串行调度的 NOT_STARTED |
| 5 | 等待外部处理 | `ClockCircleOutlined` | 审批 PENDING |
| 6 | 尚未开始 | `MinusCircleOutlined` | 前置未齐的 NOT_STARTED |
| 7 | 已完成 | `CheckCircleOutlined` | 默认不展开；执行中只进指标卡计数 |

组标题与列表项之间不要再插 Divider 造成 32px；条目间分割线用 `.list-item-hover::after`。组与组之间 `var(--nav-space-4)`。

同一分组内顺序：公司账号 → 邮件与即时通信 → 知识库 → Atlas 项目看板 → 设计工具 → 产品数据看板 → Atlas 项目文件库。

主视觉稿没有「需要处理 / 被阻塞 / 已完成」时这三组为 0 条、不出现；实现必须保留映射，供后续节拍和异常。

### 11.2 List.Item 字段

使用基础列表：`title`（项名 + Tag）+ `description`（Agent 说明 / 等待原因）+ `extra`（操作链接）。元信息放 description 第二行 `Text type="secondary"`。

| 分组 | Tag | Tag color | description 示例 | extra |
|---|---|---|---|---|
| 当前执行 | 执行中 | `processing` | Agent 正在添加普通成员权限；`开始时间 09:02:15 · 已耗时 00:00:48` | `Typography.Link` 查看执行日志 |
| 执行队列 | 等待中 | `default` | 等待前序任务完成后自动执行；有 ETA 则「预计开始 09:03」 | 整行可点打开抽屉 |
| 等待外部处理 | 待审批 | `warning` | 已提交给数据负责人审批；`当前处理人 数据负责人 · 提交时间 09:02` | 查看审批详情 |
| 尚未开始 | 尚未开始 | `default` | 等待前置条件满足后执行 | 打开抽屉 |
| 被阻塞 | 被阻塞 | `error` | 等待公司账号开通完成后再执行 | 打开抽屉 |
| 需要处理 · 失败 | 失败 | `error` | 原因 + 责任角色 | 查看原因 + 联系管理员（无重新开通） |
| 需要处理 · 未知 | 结果未知 | `default` | 请求超时，无法判断是否已开通 | 查询结果 + 确认已开通（人工核验） |
| 已完成（若展开） | 已完成 | `success` | 回执摘要 | 只读详情；重试禁用 |

当前执行项在 description 下增加 `Progress type="line" percent={45} showInfo`，`strokeColor: token.colorPrimary`。同时最多 1 条 RUNNING。耗时每秒更新。

**执行队列**进入条件：`NOT_STARTED` + 审批 `NOT_REQUIRED` 或 `APPROVED` + 依赖均 `SUCCEEDED`。仍在等公司账号的项必须进「被阻塞」，不要进队列。

操作链接：`Typography.Link` 或 `Button type="link" size="small"`，不要自绘 chevron 当主按钮。禁用操作必须用可见文字解释，不能只靠 hover。

依赖失败：说明改为「因公司账号失败，本项未执行」，状态保持 BLOCKED，不自动改 FAILED。

设计工具在查到「无许可证」前留在「尚未开始」；失败后进入「需要处理」。

---

## 12. 权限项字段字典

列表精简；完整字段进抽屉。前端不得编造 `allowedActions`。

| 字段 | 列表 | 抽屉 | 规则 |
|---|---|---|---|
| 项名 | ✓ | ✓ | 七项固定名称 |
| 目标系统 | — | ✓ | |
| 权限范围 | 执行中说明带出 | ✓ | 如「普通成员」 |
| 执行状态 | Tag | Tag | |
| 审批状态 | 待审批 Tag | 与执行分列 | |
| Agent 正在做什么 | description | ✓ | 人话，不暴露 tool 名 |
| 当前处理人 | 外部处理组 | ✓ | 显示角色，不是具体人名 |
| 依赖 | 阻塞/队列说明 | ✓ | 邮件、知识库依赖公司账号 |
| 开始时间 | 执行中 | ✓ | 未开始则省略，不写「—」 |
| 已耗时 | 执行中 | ✓ | `HH:mm:ss` |
| 预计开始 | 队列 | ✓ | 无 ETA 则省略 |
| 最近更新 | — | ✓ | |
| 申请编号 / 调用编号 | — | ✓ | 未发起则「尚未生成」 |
| 结果 / 原因 / 原因码 | 失败/未知说明 | ✓ | |
| 有效期 | — | ✓ | 产品数据看板须展示 12 月 31 日 |
| 可用操作 | extra 链接 | ✓ | 完全以 `allowedActions` 为准 |

---

## 13. 详情抽屉

展示类浮层：只读详情 + 轻操作。宽度档位 `FLOATING_LAYER_WIDTHS.detailDrawer`（480），`width={\`min(480px, 80vw)\`}`。尺寸写进局部常量，禁止在 `styles` 里散落裸数字。

```tsx
const FLOATING_LAYER_TOKENS = {
  headerHeight: 56,
  contentPadding: 24,
  separator: '1px solid var(--color-border-secondary)',
} as const;
```

| 规则 | 说明 |
|---|---|
| 类型 | 展示类：`footer={null}` |
| Header | 自定义固定栏 56px：左 `CloseOutlined` + 标题（项名），右可放轻操作；底部分割线拉满 |
| 关闭 | `title={null}` `closable={false}`；点遮罩、Esc、左上关闭 |
| Body | 唯一滚动区；padding 24px；**不要**再套 `ds-page-card` |
| 内容 | 基础 `Descriptions`，`column={1}` |

抽屉结构：

1. **结论**：`Tag` + 一句「发生了什么」
2. **证据**：系统、操作、调用编号、时间、原因码
3. **下一步**：谁负责、经理要不要做
4. **允许的操作**：只渲染 `allowedActions`

长编号 / 原因码用 `db-descriptions-long-text`。复制按钮用 `db-descriptions-action-icon`。

| 状态 | 允许的操作 | 禁止 |
|---|---|---|
| RUNNING | 无，或只读「执行日志」时间线 | 取消开通、重试 |
| NOT_STARTED / BLOCKED / 队列 | 无主按钮 | 手动插队、跳过依赖 |
| PENDING | 无（只读审批记录） | 催办、经理代批 |
| SUCCEEDED | 无 | 重新执行。禁用原因写在控件旁：「已开通，不能重复执行」 |
| FAILED | 无开通类按钮 | 重试开通 |
| UNKNOWN | 仅「查询结果」`Button type="primary"` 放在 header 右侧 | 重新开通、生成新编号 |

查询中按钮 `loading`。演示可继续返回未知。成功则改为 SUCCEEDED 并锁定；仍未知则 `message.info('仍无法确认结果，未创建新申请')`。

---

## 14. 状态机

### 14.1 整单（本页相关）

```text
AWAITING_CONFIRMATION
        │ P-03 确认成功
        ▼
   IN_PROGRESS     ← P-04 主状态
        │
        ├─ 出现 FAILED / UNKNOWN 且仍在本页 → 可留在 IN_PROGRESS，
        │    「需要处理」>0；到达 F01 后切 PARTIAL_COMPLETE 并进 P-05
        └─ 七项全 SUCCEEDED → COMPLETE（陈晨演示不走）
```

### 14.2 单项执行

```text
NOT_STARTED
    ├─ 需审批且未批 → 「等待外部处理」（执行仍 NOT_STARTED，审批 PENDING）
    ├─ 依赖未成功 → BLOCKED
    ├─ 依赖已齐且轮到 → RUNNING
    └─ 尚未轮到且前置未齐 → 「尚未开始」
RUNNING
    ├─ 成功 → SUCCEEDED（锁定）
    ├─ 明确失败 → FAILED（转人工）
    └─ 超时无结果 → UNKNOWN（只能查询）
BLOCKED
    ├─ 依赖 SUCCEEDED → NOT_STARTED 或 RUNNING
    └─ 依赖 FAILED → 保持 BLOCKED，说明改为因依赖失败未执行
```

审批维度独立：`NOT_REQUIRED / PENDING / APPROVED / REJECTED`。拒绝则停止该项自动执行，进入需要处理。

前端禁止用一个 `pending` 同时表示「经理已确认、审批中、系统排队」。

### 14.3 依赖

| 项 | 依赖 | 确认后分组（P-03） |
|---|---|---|
| 公司账号 | 无 | 可直接执行 |
| 邮件与即时通信 | 公司账号 SUCCEEDED | 可直接执行 |
| 知识库 | 公司账号 SUCCEEDED | 可直接执行 |
| Atlas 项目看板 | 无额外审批 | 可直接执行 |
| 设计工具 | 执行时须有可用许可证 | 可直接执行 |
| 产品数据看板 | 数据负责人批准；有效期至 12 月 31 日 | 需要审批 |
| Atlas 项目文件库 | 无额外审批 | 可直接执行 |

公司账号仍 RUNNING 时：邮件、知识库必须 BLOCKED（或尚未开始且文案写明等待公司账号），「被阻塞」>0。  
公司账号已 SUCCEEDED 后：禁止再写「等待公司账号开通完成」。

---

## 15. 陈晨演示快照（高保真主状态）

设计稿对应「确认后约 3 分钟、邮件开通进行中」。实现与验收用下面这一版，保证 7 项、六格加总、依赖同时成立。

| 项 | 执行 | 审批 | 列表分组 | 说明 | 指标卡桶 |
|---|---|---|---|---|---|
| 公司账号 | SUCCEEDED | NOT_REQUIRED | 不展开 | — | 已完成 |
| 邮件与即时通信 | RUNNING 45% | NOT_REQUIRED | 当前执行 | Agent 正在添加普通成员权限 | 执行中 |
| 知识库 | NOT_STARTED | NOT_REQUIRED | 执行队列 | 等待前序任务完成后自动执行；预计开始 09:03 | 尚未开始 |
| Atlas 项目看板 | NOT_STARTED | NOT_REQUIRED | 执行队列 | 同上 | 尚未开始 |
| 产品数据看板 | NOT_STARTED | PENDING | 等待外部处理 | 已提交给数据负责人审批 | 待审批 |
| 设计工具 | NOT_STARTED | NOT_REQUIRED | 尚未开始 | 等待前置条件满足后执行 | 尚未开始 |
| Atlas 项目文件库 | NOT_STARTED | NOT_REQUIRED | 尚未开始 | 等待前置条件满足后执行 | 尚未开始 |

摘要应显示：

- 环形 **1/7 已完成**，Tag「执行中」
- 已完成 1 · 执行中 1 · 待审批 1 · 被阻塞 0 · 需要处理 0 · 尚未开始 4

时间轴（演示）：

| 时刻 | 事件 |
|---|---|
| 09:00 | 发起申请 |
| 09:01 | 公司账号开通成功（进入本页时已发生，故列表不展开） |
| 09:02 | 产品数据看板提交审批 |
| 09:02:15 | 开始开通邮件与即时通信 |
| 09:03:03 | 「最近更新」示例 |

之后 Mock 串行：邮件成功 → 知识库 RUNNING → 看板成功 → 设计工具 FAILED（无许可证）→ 文件库 UNKNOWN。产品数据看板保持 PENDING。凑齐 F01 后跳 P-05。

更早一拍（可选，不必单独高保真）：公司账号 RUNNING，邮件/知识库 BLOCKED，被阻塞 = 2。用于证明依赖，不代替主状态。

---

## 16. 交互

| 操作 | 反馈 |
|---|---|
| 进入 | 摘要卡 + 指标卡 + 列表用 `Skeleton`；不用空状态插画 |
| 刷新 / 轮询 | 原地更新；RUNNING 的 `Progress` 可动；禁止整页白屏 |
| 复制发起时间 | `message.success`，约 2s |
| 查看执行日志 / 审批详情 / 点击行 | 打开对应 Drawer |
| 查询结果 | 仅 UNKNOWN；见 §13 |
| 已完成入口 | 抽屉只读回执；重试按钮禁用并写原因 |
| 到达 F01 | 可 `message.info('执行结果已更新')` 后进 P-05 |
| 关闭说明条 | 副标题出「查看说明」 |

无删除工单、无改方案、无新增权限项。取消勾选发生在 P-02，本页不可逆。本期无催办（Backlog Later）。

---

## 17. 文案

语气：短、具体、不讲内部系统黑话。先事实，后下一步。

| 场景 | 文案 |
|---|---|
| 页面说明 | Agent 将继续自动执行后续任务并实时同步状态；需要你处理时会及时通知，期间可以离开此页。 |
| 队列组说明 | 完成后将自动执行（写在组标题旁 `Text type="secondary"`） |
| 执行中 | Agent 正在添加普通成员权限 |
| 队列等待（依赖已齐） | 等待前序任务完成后自动执行 |
| 依赖阻塞 | 等待公司账号开通完成后再执行 |
| 依赖失败 | 因公司账号失败，本项未执行 |
| 待审批 | 已提交给数据负责人审批 |
| 尚未开始 | 等待前置条件满足后执行 |
| 成功锁定 | 已开通，不能重复执行 |
| 许可证失败 | 设计工具无可用许可证，请联系工具管理员处理。AccessFlow 不会重复开通已成功的项目 |
| 未知 | 请求超时，结果未知。请先查询，不要重新开通 |
| 查询中 | 正在查询原开通请求的结果，不会重新提交申请 |
| 查询仍未知 | 仍无法确认结果，未创建新申请 |
| 刷新失败 | 进度暂时无法刷新，请重试。已成功的项目不会重复执行 |
| 复制成功 | 已复制发起时间 |
| Tag | 执行中 / 等待中 / 待审批 / 尚未开始 / 被阻塞 / 失败 / 结果未知 / 已完成 |

---

## 18. 异常与边界

| 异常 | 处理 | 界面 |
|---|---|---|
| 首屏失败 | 保留 TopLayout 与 Steps 卡 | 摘要位置 `Result status="error"` + 「重新加载」 |
| 轮询失败 | 不覆盖已有数据 | `Alert type="warning"`，见刷新失败文案 |
| 六格加总 ≠ 7 | 实现缺陷 | 不得上屏 |
| 排除项出现 | 前后端双拦 | 验收失败 |
| 成功项重试 | 前端不渲染，后端再拒 | 抽屉写锁定原因 |
| 未知项「重新开通」 | 禁止 | 只留查询 |
| 待审批画成已开通 | 禁止 | 保持 `Tag color="warning"` |
| 经理确认画成审批通过 | 禁止 | |
| 依赖未成功却 RUNNING | 禁止 | |
| 环形分子 >7 | 禁止 | |
| 未调用显示「—」 | 写「尚未生成」 | |
| 空插画「暂无执行任务」 | 禁止 | 七项进入时一定存在 |

---

## 19. 验收清单

### Ant Design / Skill

- [ ] 仅 TopLayout；顶栏 56px；帮助/通知为 `Button type="text"`；用户下拉三项齐全
- [ ] 引入 `global-style.css`；页面背景 `#f7f8fa`；白卡 8px 圆角 + `var(--shadow)`、无描边
- [ ] PageHeader 在 Card 外；主标题只有一处 `Title level={4}`
- [ ] 刷新是默认按钮、不带 icon；说明条是 `ds-page-inline-alert` 单行可关闭
- [ ] 无员工身份卡；六态为独立通栏 `ds-statistic-card`（宽屏 6 列），不包进执行总览大卡
- [ ] 列表一张 `ds-list-card`；不按状态铺行背景；状态只用 Tag
- [ ] 抽屉 480、左关闭、无 footer、body 不再套白卡
- [ ] 实现无业务 hex（ConfigProvider 与 purple-6/1 注释除外）；无 `any`

### 业务

- [ ] 只出现 7 项建议权限；2 项排除永不出现
- [ ] 六格之和 = 7；环形分母 = 7；主状态 1/7
- [ ] 公司账号未成功时邮件/知识库不得 RUNNING
- [ ] 确认、审批、执行分开展示
- [ ] 操作遵循 `allowedActions`；成功项无重试；未知项只有查询
- [ ] P-03 确认后进入本页；可开邮件抽屉与数据看板审批抽屉
- [ ] 跑到 F01 后进 P-05，本页不曾显示「全部完成」

---

## 20. 与设计稿 / PRD 的对齐

| 点 | 设计稿 | 本 spec | 实现采用 |
|---|---|---|---|
| 设计体系 | 自定义色、12px 卡、32px 内边距 | Ant Design Token + Skill 模板 | **Skill** |
| 整页容器 | 一张 1120 大白卡 | PageShell 多区块 | **拆卡** |
| 顶栏 | 64px，帮助带文字，李经理 | 56px icon 按钮，王璐 | **TopLayout + 王璐** |
| 说明条 | 主卡底部蓝条 | 标题下 `Alert` info | **页面说明提示条** |
| 六态计数 | 摘要卡内 2×3 宫格 | 同级指标卡 Grid 4+2 | **独立 StatisticCard** |
| 列表行 | 执行中蓝底 / 待审批橙底 | 白底 + Tag | **禁止行铺色** |
| 环形 / 已完成 | 2/7，已完成 2 | 该帧仅公司账号成功 | **1/7，已完成 1** |
| 尚未开始计数 | 3 | 队列 2 + 未开始 2 | **4** |
| 队列文案 | 等待公司账号 | 被阻塞为 0，账号应已成功 | **等待前序任务完成后自动执行** |
| 警告色 | `#fa8c16` | `--color-warning` | **`#faad14`** |
| 圆角 | 主卡 12px | `--border-radius-lg` | **8px** |
| 搜索 | 无 | TopLayout 默认有 | **本期按 PRD 省略** |
| 详情抽屉 | 稿上未画 | PRD + 展示类 Drawer | **必须做** |
| 催办 | 无 | Backlog Later | **不做** |

若后续改设计稿以匹配 1/7 或 Ant Design 拆卡，回写本节。

---

## 21. 给工程的接口要点

页面只读。建议默认轮询 `GET /cases/{id}`，返回整单 + 7 条 `AccessItem`。

每项至少包含：`id, name, targetSystem, scope, executionStatus, approvalStatus, approverRole, dependsOn[], startedAt, updatedAt, requestId, reason, reasonCode, progressPercent, etaStartAt, elapsedSeconds, allowedActions[], validUntil`。

整单包含：`id, orderStatus, requestNo, createdAt, updatedAt, employee{name, employeeNo, role, department, avatar}`。

Mock 节拍由后端驱动，前端不写死 F01；演示数据必须能走到 4 成功 / 1 失败 / 1 待审批 / 1 未知。

脚手架建议 Vite + React Router。根节点 `ConfigProvider` + 引入 `global-style.css`。从 Skill 复制的模板须删掉 `import '../../references/global-style.css'`，改为项目内路径。

---

## 22. 变更记录

### 2026-08-20 v1.1

按 Ant Design Skill 重写视觉与组件映射：TopLayout、PageShell、Token、同级指标卡、基础列表、展示类抽屉、页面说明提示条。业务快照与 FR-04 规则保持不变；修正设计稿 2/7 加总错误，并明确「行铺色 / 大卡包页 / 硬编码色」为实现禁止项。

### 2026-08-20 v1.0

首次根据高保真设计稿与 PRD v1.1 FR-04 整理本页 spec。
