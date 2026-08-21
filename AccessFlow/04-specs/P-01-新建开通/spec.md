# AccessFlow 首页 Spec · P-01 新建开通

> 页面类型：Web 工作台首页（需求输入）  
> 设计系统：**Ant Design 5/6 + 本仓库 Ant Design Skill**  
> 布局模板：`SideLayout`  
> 视觉权威：Ant Design Skill（`layout.md` + `global-style.css`）  
> 结构 / 文案参考：[`../00-source/P-01-homepage-hifi.png`](../00-source/P-01-homepage-hifi.png)  
> 行为权威：[`../01-prd/PRD-AccessFlow-v1.1.md`](../01-prd/PRD-AccessFlow-v1.1.md) FR-01  
> 需求源头：[`../00-backlog/project-backlog.md`](../00-backlog/project-backlog.md)  
> 版本：v1.1 · 2026-08-20 · 作者 jiali

## 权威优先级

| 优先级 | 来源 | 管什么 |
|---|---|---|
| 1 | PRD v1.1 | 核对、校验、跳转、异常、F01 事实 |
| 2 | Ant Design Skill | 导航壳、Token、间距、圆角、阴影、组件选型与状态 |
| 3 | 高保真稿 | 模块组成、信息层级、中文文案、陈晨演示数据 |

稿面与 Ant Design 冲突时，**改视觉跟 Ant Design，不改业务跟稿面色值**。文档中的 hex 只说明 Token 当前值，实现必须写 `var(--*)`，禁止在业务样式里硬编码色值（`ConfigProvider.theme.token` 除外，必须传 hex）。

壳层导航是工作台框架，不新增独立列表产品。

---

## 1. 页面目标

用人经理打开 AccessFlow 后，用自然语言提交一条新员工开通需求；同时能接回尚未完成的工单。

| 项 | 内容 |
|---|---|
| 路由 | `/` 或 `/provision/new` |
| PRD 页面 | P-01 需求输入 |
| 导航布局 | **SideLayout**（侧边导航）。菜单少但仍是工作台模块切换，跟稿面左栏一致，不用 TopLayout / MixedLayout |
| 主用户 | 用人经理（界面显示「李经理」） |
| 主操作 | 生成权限开通方案 |
| 次操作 | 查看进行中工单进度 |
| 成功出口 | 生成成功 → P-02 开通方案审阅 |
| 恢复出口 | 「查看进度」→ P-04；若整单已到 F01 → P-05 |
| 面包屑 | **不展示**。本页是一级入口，`breadcrumbRender={false}` |

本页**不创建账号、不执行开通、不代表经理已确认**。提交后只进入 Agent 核对。

---

## 2. 技术栈与 Token 接入

实现按 Ant Design Skill 最小起步，不要混用 TDesign / Arco / 自定义色板。

| 类别 | 包 | 版本 |
|---|---|---|
| UI | `antd` | `^6.0.0` |
| 业务组件 | `@ant-design/pro-components` | `^2.7.0` |
| 图标 | `@ant-design/icons` | `^6.0.0` |
| 框架 | `react` / `react-dom` | `^19.0.0` |
| 语言 | TypeScript | `^5.0.0`，禁止 `any` |

接入清单（实现时必做，本 Spec 先锁定）：

1. 将 Skill 的 `references/global-style.css` 复制为项目 `src/styles/global-style.css`，在入口引入。  
2. 根节点用 `ConfigProvider` + `ProConfigProvider`。  
3. `theme.token` 传 hex，禁止 `'var(--xxx)'` 字符串。  
4. 使用 ProLayout / PageContainer 时清零默认 40px padding。

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 8,
      borderRadiusLG: 8,
    },
  }}
>
  <ProConfigProvider
    token={{
      pageContainer: {
        paddingInlinePageContainerContent: 0,
        paddingBlockPageContainerContent: 0,
      },
    }}
  >
    <App />
  </ProConfigProvider>
</ConfigProvider>
```

---

## 3. 画板与 SideLayout 壳层

### 3.1 画板

| 类型 | 尺寸 | 用途 |
|---|---|---|
| 实现主画板 | 1440 × 900 | 默认桌面工作台 |
| 源视觉稿 | 1024 × 684 | 只对模块和文案，不对色值和间距 |
| 窄屏检查 | 1280 × 800 | 内容不横向溢出，主按钮可见 |
| 宽屏检查 | 1920 × 1080 | 内容区随侧栏 208 / 64 偏移，不另做居中限宽 |

禁止给内容区再套 960px `max-width` 居中。左右对齐线由 Content 的 `padding: var(--nav-space-6)`（24px）提供。

### 3.2 布局选型

整体为 **侧边栏 + 与侧栏等宽的固定顶栏 + 右侧主内容区**。顶栏**不铺满视口全宽**，帮助 / 通知 / 用户在侧栏底部用户区，不在内容区上方做第二根 Header。

```text
┌──────── 208 / 64 ──────┬────────────── 主内容区 ──────────────┐
│ 固定顶栏 56px          │                                      │
│ Logo + Access Flow     │  Content padding 24px                │
├────────────────────────┤  .ds-page-shell gap 16px             │
│ 侧边菜单               │    PageHeader                        │
│ 新建开通 ← current     │    PromptCard (ds-page-card)         │
│ 正在执行               │    ResumeSection                     │
│ 开通记录               │      继续处理标题                    │
│ 设置                   │      TaskCard (ds-page-card)         │
│                        │                                      │
│ 用户区 60px            │                                      │
│ 头像 李经理 帮助 通知  │                                      │
└────────────────────────┴──────────────────────────────────────┘
         ▲
   24px 圆形收起触发器，右边界外露 12px
```

同一页面只允许这一套导航，禁止再叠加 TopLayout 或第二套侧栏。

### 3.3 壳层尺寸（只用 Token）

| 区域 | Token / 规格 | 当前值（说明用） |
|---|---|---|
| 顶栏高度 | `var(--nav-header-height)` | 56px |
| 顶栏宽度 | 与侧栏相同 | 208px / 64px |
| 侧栏展开 | `var(--nav-sider-width)` | 208px |
| 侧栏收起 | 固定 64px | 64px |
| 顶栏 / 侧栏 / 画布背景 | `var(--nav-color-bg-canvas)` / `var(--nav-color-sider)` | `#f7f8fa` |
| 主内容区内边距 | `var(--nav-space-6)` | 24px |
| 主内容最小高 | `calc(100vh - var(--nav-header-height))` | — |
| 页面区块间距 | `.ds-page-shell { gap: var(--nav-space-4) }` | 16px |
| 收起过渡 | `var(--nav-transition)` | `0.24s cubic-bezier(0.2, 0, 0, 1)` |

滚动只发生在主内容区或 `.side-menu`。顶栏、侧栏、收起触发器不随内容滚动。

首屏必须看见：品牌、当前菜单「新建开通」、页面标题、输入框、主按钮。有进行中工单时，「继续处理」可在首屏底部露出。

---

## 4. 主内容区结构

导航层不渲染业务标题。本页自己输出 `.ds-page-header`，禁止再用菜单名做第二个 `<h1>`。禁止原生 `<h1>` / `<p>` 拼标题。

```tsx
<div className="ds-page-shell">
  <div className="ds-page-header">
    <Space direction="vertical" size={4}>
      <Title level={4} className="ds-page-title">
        为新员工快速开通账号与权限
      </Title>
      <Text type="secondary">
        告诉 Agent 新员工的入职信息和权限需求，系统将生成方案并持续跟踪执行结果。
      </Text>
    </Space>
    <Space className="ds-page-header-extra">
      {/* 可选：Agent 插画，见 6.3；没有右侧内容则省略 */}
    </Space>
  </div>

  <Card bordered={false} className="ds-page-card">
    {/* PromptCard */}
  </Card>

  {/* 有未结束工单时才渲染 */}
  <section>
    <Title level={5}>继续处理</Title>
    <Card bordered={false} className="ds-page-card">
      {/* TaskCard */}
    </Card>
  </section>
</div>
```

### 4.1 信息层级

1. PageHeader：当前任务  
2. PromptCard + 主按钮：怎么开始  
3. 继续处理：没做完的事  
4. SideLayout 菜单：去其他阶段  

### 4.2 标题规格

| 元素 | 规则 |
|---|---|
| 页面主标题 | `<Title level={4} className="ds-page-title">`，`var(--font-size-heading-4)` 20px / 28px，色 `var(--nav-color-text-active)` |
| 副文案 | `<Text type="secondary">`，14px / 22px |
| 「继续处理」 | `<Title level={5}>`，`var(--font-size-heading-5)` 16px / 24px，字重 500 |
| PageHeader padding | 禁止 `padding-inline` / `padding-bottom` / `margin-bottom`；与卡片间距只由 `.ds-page-shell` 的 gap 承担 |

稿面 28px 营销大标题**不采用**。插画从左侧 Hero 改为 PageHeader 右侧 `ds-page-header-extra`，高度不超过标题区（建议 64–88px），失败时省略，不留破图。

---

## 5. Design Token

实现只引用 `global-style.css` 变量。下表 hex 为 Skill 当前值，改 Token 文件时页面跟着变。

### 5.1 颜色

| Token | 当前值 | 本页用途 |
|---|---|---|
| `--color-primary` / `--nav-color-primary` | `#1677ff` | 主按钮、链接「查看进度」、Progress、焦点 |
| `--color-primary-hover` | `#4096ff` | 主按钮 hover（由 antd 处理） |
| `--color-primary-active` | `#0958d9` | 主按钮 press |
| `--color-primary-bg` | `#e6f4ff` | 仅用于 Tag `processing` 浅底；**禁止**做侧栏选中底 |
| `--color-info` | `#1677ff` | 「执行中」语义 |
| `--color-success` | `#52c41a` | 核对步骤完成 |
| `--color-warning` | `#faad14` | 待审批 Tag |
| `--color-warning-bg` | `#fffbe6` | 待审批 Tag 底（用 `Tag color="warning"`） |
| `--color-error` | `#ff4d4f` | 需要处理 Tag、空提交、通知 Badge |
| `--color-error-bg` | `#fff2f0` | 需要处理 Tag 底 |
| `--color-text` | `rgba(0,0,0,0.88)` | 正文、任务姓名 |
| `--color-text-secondary` | `rgba(0,0,0,0.65)` | 副文案、进度文字、用户名 |
| `--color-text-tertiary` | `rgba(0,0,0,0.45)` | 描述、字数 |
| `--color-text-quaternary` | `rgba(0,0,0,0.25)` | 占位符、禁用 |
| `--color-border` | `#d9d9d9` | 控件默认描边 |
| `--color-border-secondary` | `#f0f0f0` | 分割 |
| `--color-bg-container` / `--nav-color-surface` | `#ffffff` | 页面白卡、输入、下拉 |
| `--nav-color-bg-canvas` | `#f7f8fa` | 页面 / 顶栏背景 |
| `--nav-color-sider` | `#f7f8fa` | 侧栏背景 |
| `--nav-color-sider-hover` | `rgba(0,0,0,0.04)` | 菜单 hover / active 底 |
| `--nav-color-sider-text` | `rgba(0,0,0,0.65)` | 菜单默认文字 |
| `--nav-color-sider-text-active` | `rgba(0,0,0,0.85)` | 菜单选中文字 |
| `--color-bg-mask` | `rgba(0,0,0,0.45)` | Modal / 遮罩 |
| `--color-link` | `#1677ff` | 文字按钮、查看进度 |

**侧栏选中禁止浅蓝底 + 品牌蓝字。** hover / active 一律灰底加深字：`--nav-color-sider-active`。

状态必须同时有文字，不能只靠颜色。

### 5.2 字体

| Token | 当前值 | 用途 |
|---|---|---|
| `--font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", PingFang SC, ...` | 全局 |
| `--font-size-sm` | 14px，行高 22px（字号 + 8px） | 正文、输入、菜单、按钮 |
| `--font-size-xs` | 12px / 20px | Tag、分组标题、字数 |
| `--font-size-lg` | 16px / 24px | 品牌名、小节标题 |
| `--font-size-heading-4` | 20px / 28px | 页面主标题 |
| `--font-weight` | 400 | 正文 |
| `--font-weight-secondary` | 500 | 按钮、强调 |
| `--font-number` | Helvetica Neue / Arial | `4 / 7`、`0 / 2000`，配合 `tabular-nums` |

### 5.3 间距 / 圆角 / 阴影

| 场景 | Token | 当前值 |
|---|---|---|
| 页面外缘 | `--nav-space-6` | 24px |
| 卡片内水平 | `--nav-space-6` | 24px |
| 卡片内垂直 | `--padding` | 16px |
| 模块间距 | `--nav-space-4` | 16px |
| 图标与文字 | `--nav-space-2` | 8px |
| 顶栏功能组间距 | `--nav-space-4` | 16px（本页功能图标在侧栏用户区，组内 4px） |
| 控件圆角 | `--border-radius` | 6px |
| 卡片 / 弹层圆角 | `--border-radius-lg` | 8px |
| Tag 圆角 | `--border-radius-sm` | 4px |
| 页面白卡阴影 | `--shadow` | Skill 基础阴影 |
| 下拉阴影 | `--shadow-tooltip` / `--nav-shadow-dropdown` | 浮层 |

页面级白卡：`ds-page-card`，白底、8px 圆角、`var(--shadow)`、`border: 0`、`bordered={false}`。禁止稿面 12px 大圆角和手写 `0 8px 24px` 投影。禁止 Card 水平方向误用 `--padding`（16px）。

---

## 6. 组件规格

组件优先用 antd / `@ant-design/icons`。禁止手写 SVG 替代帮助、通知、设置、语音等系统图标。

### 6.1 SideLayout 顶栏（仅侧栏宽）

从 `scripts/layout/SideLayout.tsx` 复制改造，只换 Logo、产品名、菜单、用户信息。

| 项 | 规则 |
|---|---|
| 定位 | `position: fixed; inset: 0 auto auto 0` |
| 底边 | `1px solid var(--nav-color-border-light)` |
| 右边 | `1px solid var(--nav-color-sider-divider)` |
| 内边距 | `padding: 0 var(--nav-space-4)` |
| Logo | 24×24，`.logo-mark` / `.logo-icon`，背景可用 `--nav-color-primary` |
| 品牌名 | 「Access Flow」，`.brand-name`，16px / 400 / 24px，色 `--nav-color-text-active` |
| 收起 | 只隐藏 `.brand-name`，Logo 图形保留并居中 |

本页顶栏**不放**帮助、通知、头像、搜索。

### 6.2 侧栏菜单

菜单无需业务域分组，**不生成分组标题**。设置是菜单项，禁止放进底部用户区。

| 菜单 | 图标 | 本页状态 | 点击 |
|---|---|---|---|
| 新建开通 | `PlusCircleOutlined`（稿面圆内横线改为 AntD 常规「新建」语义） | `aria-current="page"` | 已在本页则聚焦输入框 |
| 正在执行 | `ClockCircleOutlined` | 默认 | 有 `IN_PROGRESS` / `NEEDS_ATTENTION` → P-04；否则 `message.info('当前没有正在执行的开通任务')` |
| 开通记录 | `FileTextOutlined` | 默认 | 有已结束工单 → P-05 / P-06；否则 `message.info('暂无开通记录')`。不新开历史列表 |
| 设置 | `SettingOutlined` | 默认可见 | `message.info('设置将在后续版本提供')`，或 `disabled` + Tooltip「本期不可用」 |

菜单项：高度 40px，`padding: 0 var(--nav-space-4)`，圆角 `var(--nav-radius-sm)`，图标 16px，图标与文字 `var(--nav-space-2)`。

| 态 | 背景 | 文字 / 图标 |
|---|---|---|
| default | 无 | `--nav-color-sider-text` |
| hover | `--nav-color-sider-hover` | `--nav-color-sider-text-active` |
| active | `--nav-color-sider-active`（与 hover 同色，灰底） | 文字 `--nav-color-sider-text-active`，图标 `--nav-color-sider-icon-active` |
| disabled | 无 | `--color-text-quaternary`，必须有文字原因 |

当前项只高亮「新建开通」。收起后只留图标居中，选中仍保留灰底。

### 6.3 收起触发器（必做）

| 项 | 规则 |
|---|---|
| 类名 | `.collapse-trigger` 或 `.toggle-sidebar` |
| 尺寸 | 24×24 圆，`border-radius: var(--nav-radius-pill)` |
| 位置 | 贴侧栏右边界，外露 12px；展开在 208px 边，收起跟 64px 边 |
| 样式 | 背景 `--nav-color-surface`，边框 `--nav-color-border`，阴影 `--nav-shadow-dropdown` |
| 图标 | 10px chevron：展开向左，收起向右 |
| 无障碍 | 可聚焦，`aria-label="收起侧边栏"` / `"展开侧边栏"` |

除触发器外，Logo、菜单、用户区均不得越过侧栏右边界。

### 6.4 侧栏用户区

绝对定位在侧栏底部，高 60px，内容 44px + 上下各 8px。只放头像、用户名、帮助、通知。**禁止**再放「设置」菜单。

| 控件 | Ant Design 实现 | 本期行为 |
|---|---|---|
| 头像 | `<Avatar size={32}>`，无图时背景 `--nav-color-primary`、白字「李」 | 点击展开用户下拉 |
| 用户名 | `.user-name`「李经理」 | 14px / 22px / `--nav-color-text-secondary`，单行省略 |
| 帮助 | `<Button type="text" className="icon-button" icon={<QuestionCircleOutlined />} aria-label="帮助文档" />` | 热区 28×28，图标 16px。Drawer 或 `message.info('演示环境请按主路径完成开通。')` |
| 通知 | 同上 + `BellOutlined`，外包 `<Badge count={2} size="small">` | 下拉 240–280px；空态「暂无通知」。不做通知中心页 |
| 用户下拉 | antd `Dropdown`，宽 132px | 本期只展示当前身份，不提供切换账号 / 退出（PRD 不做登录） |

收起态：只留 32px 头像居中；隐藏用户名和整个 `.user-action-icons`；`.user-actions { gap: 0 }`；头像 `flex: 0 0 32px; min-width: 32px`。

通知 Badge：`count > 99` 显示 `99+`；`aria-label="2 条未读通知"`。

### 6.5 Agent 插画

| 规则 | 说明 |
|---|---|
| 位置 | `ds-page-header-extra`，不单独做营销 Hero 行 |
| 尺寸 | 64–88px 高，不拉伸 |
| 资产 | `assets/agent-hero.png`（或 WebP），透明底 |
| `alt` | `AccessFlow Agent` |
| 动效 | 默认静态；`prefers-reduced-motion: reduce` 时禁止悬浮 |
| 失败 | 不渲染 extra，标题区正常 |

### 6.6 PromptCard

`<Card bordered={false} className="ds-page-card">`。padding 由卡片规则承担：上下 16px、左右 24px，打在 `.ant-card-body`。

用 `Form` + `Input.TextArea`，不要手写无边框大输入。

```tsx
<Form form={form} layout="vertical" onFinish={onGenerate}>
  <Form.Item
    name="rawRequest"
    rules={[{ required: true, whitespace: true, message: '请先填写开通需求' }]}
  >
    <Input.TextArea
      showCount
      maxLength={2000}
      autoSize={{ minRows: 4, maxRows: 8 }}
      placeholder="请描述新员工需要开通的权限，注意说清楚姓名、入职部门和日期、参与项目等信息。"
    />
  </Form.Item>
  <Flex justify="space-between" align="center">
    <Button
      type="text"
      icon={<AudioOutlined />}
      aria-label="语音输入"
      onClick={() => message.info('演示环境暂不支持语音输入')}
    />
    <Button type="primary" htmlType="submit" loading={analyzing}>
      生成权限开通方案
    </Button>
  </Flex>
</Form>
```

| 项 | 规格 |
|---|---|
| 字段 | `rawRequest`，1–2000 字，Unicode 码点，trim 后校验 |
| 字数 | 用 `showCount`，不要再手写 `0 / 2000` |
| 占位 | 占位符不是值；空态计数为 0 |
| 满字 | `maxLength` 截断粘贴，不报红 |
| 核对中 | `disabled` / `readOnly`，按钮 `loading` |
| 空提交 | Form 校验，输入框 error 态 + 「请先填写开通需求」，不发请求 |
| 主按钮 | `type="primary"`，默认 32px 高、6px 圆角、字重 500。空内容时仍可点以触发校验，不要一开始就 `disabled` 且无解释 |
| loading 文案 | 按钮进入 loading 后可用 `正在生成…`，宽度避免跳动 |

语音不申请麦克风。

### 6.7 继续处理 / TaskCard

无未结束工单时**整节不渲染**，不要 Empty 插画。本期最多 1 张卡，不用 List 分页。

交互型单卡允许细描边表达 hover，但页面级外观仍是 `ds-page-card` 投影，不要用描边替代投影。

稿面演示数据：

| 字段 | 值 |
|---|---|
| 摘要 | 陈晨 · 软件产品设计师 · 上海产品研发部 |
| 状态 | 执行中 |
| 进度 | 4 / 7 已完成 |
| 异常 | 1 待审批 / 1 需要处理 / 1 结果未知 |
| 操作 | 查看进度 |

```text
[Avatar 40]  陈晨 · 软件产品设计师 · 上海产品研发部   [Tag 执行中]
             4 / 7 已完成  [Progress]  [待审批][需要处理][结果未知]
                                                              查看进度
```

| 元素 | Ant Design |
|---|---|
| 头像 | `<Avatar size={40} icon={<UserOutlined />} style={{ background: 'var(--color-primary)' }} />`，不用照片 |
| 姓名行 | 14px；姓名 `font-weight: 500`；` · ` 分隔；超长 `Typography.Text ellipsis` + Tooltip |
| 执行中 | `<Tag bordered={false} color="processing">执行中</Tag>`，不要手写「•」 |
| 进度条 | `<Progress percent={Math.round(4/7*100)} showInfo={false} size="small" />`，左侧文案「4 / 7 已完成」。`aria-label="4 / 7 已完成"` |
| 待审批 | `<Tag bordered={false} color="warning">1 待审批</Tag>` |
| 需要处理 | `<Tag bordered={false} color="error">1 需要处理</Tag>` |
| 结果未知 | `<Tag bordered={false}>1 结果未知</Tag>`（default） |
| 查看进度 | `<Typography.Link>查看进度</Typography.Link>` 或 `<Button type="link">`，不要手写 `>`；可用 `RightOutlined` |
| 计数为 0 | 对应 Tag 不渲染 |
| 点击 | 整卡可点，与链接同一出口；`hoverable` 或细描边 `var(--color-primary-border)` |

≤1280：Tag 换行，「查看进度」不能被挤出。

异常与 F01：待审批 = 产品数据看板；需要处理 = 设计工具失败；结果未知 = 文件库超时。首页只给数量。

---

## 7. 文案

| 位置 | 文案 |
|---|---|
| 品牌 | Access Flow |
| 导航 | 新建开通 / 正在执行 / 开通记录 / 设置 |
| 用户区 | 帮助文档（aria）/ 消息通知（aria）/ 李经理 |
| 主标题 | 为新员工快速开通账号与权限 |
| 副文案 | 告诉 Agent 新员工的入职信息和权限需求，系统将生成方案并持续跟踪执行结果。 |
| 输入占位 | 请描述新员工需要开通的权限，注意说清楚姓名、入职部门和日期、参与项目等信息。 |
| 主按钮 | 生成权限开通方案 |
| 主按钮 loading | 正在生成… |
| 分区标题 | 继续处理 |
| 任务状态 | 执行中 |
| 进度 | {done} / {total} 已完成 |
| 标签 | {n} 待审批 / {n} 需要处理 / {n} 结果未知 |
| 链接 | 查看进度 |
| 空提交 | 请先填写开通需求 |
| 生成成功 | 已生成开通方案（`message.success`，随即进 P-02） |
| 生成失败 | 方案生成失败，已保留你的原文，请重试 |
| 超时 >15s | 生成超时，请重试 |
| 网络异常 | 网络异常，请检查连接后重试。原文未丢失 |
| 权限不足 | 本工作台仅用人经理可提交开通需求 |
| 语音 | 演示环境暂不支持语音输入 |
| 无执行中 | 当前没有正在执行的开通任务 |
| 无记录 | 暂无开通记录 |
| 设置不可用 | 设置将在后续版本提供 |
| 询问示例 | 你填写的入职日期为 9 月 7 日，人事记录为 9 月 14 日。请确认以哪个日期为准 |

核对过程（`Steps` 或 `List`，PRD 原文）：

1. 正在核对陈晨的人事信息  
2. 已匹配软件产品设计师岗位模板  
3. 已读取 Atlas 项目权限规则  
4. 已发现 2 项同岗位历史特殊权限，未纳入默认方案  
5. 已生成开通方案  

反馈组件：成功 / 信息用 `message`；表单错用 `Form.Item`；生成失败用卡片内 `Alert type="error"`；询问用 `Alert type="info"`。不要自定义 Toast 色板。语气对经理说话，不出现工单号、错误码、模型名。

---

## 8. 交互与状态

### 8.1 页面状态机

| 状态 | 进入 | 界面 | 退出 |
|---|---|---|---|
| `idle` | 打开首页 | 输入可用；有未结束工单则显示继续处理 | 点击生成 |
| `validating` | 点击生成 | Form 校验 | 通过 → `analyzing`；失败 → `idle` + error |
| `analyzing` | 请求已发出 | 见 8.3 | 成功 / 询问 / 失败 |
| `need_input` | Agent 必须追问 | 保留原文 + Alert + 单问题 | 补全后重新核对 |
| `failed` | 接口或超时 | 保留原文 + Alert + 可再提交 | 重试 |
| `navigating` | 方案已生成 | `message.success` 后进 P-02 | — |

陈晨主路径：`idle` → `analyzing` → P-02，不进入 `need_input`。

### 8.2 提交

```text
点击「生成权限开通方案」
  ├─ trim 后为空 → Form error，焦点回 TextArea，不请求
  ├─ 正在 analyzing → Button loading，忽略重复 submit
  └─ 合法
        按钮 loading，TextArea disabled
        卡内展示核对步骤
        ├─ 成功 → message.success → P-02
        ├─ 需询问 → 停留本页，一次一个问题，原文保留
        └─ 失败 / 超时 → Alert + 原文保留 + 允许再生成
```

默认打开为空，占位符引导经理写清姓名、部门、入职日期和项目。演示可用 `?demo=chenchen` 预填原句：

> 9月7日，陈晨将作为软件产品设计师加入上海产品研发部，参与 Atlas 项目。请参考同岗位员工，在第一天 9:00 前把公司账号、日常工具和项目权限准备好，尽量别反复问我。

### 8.3 核对中

在 PromptCard **内部**用 `Steps size="small" direction="vertical"` 或带 `CheckCircleOutlined` / `LoadingOutlined` 的 List，不要整页 Spin 白屏。

- 五条步骤按序出现；完成 `finish`，当前 `process` + spinner  
- 主按钮 `loading`  
- 继续处理可见，点击 `message.info('正在生成方案')`，不打断请求  
- 浏览器后退：取消未完成请求，回到 `idle`，原文保留  
- `aria-live="polite"`

### 8.4 必要信息缺失

- PromptCard 下方 `Alert type="info"` + `Input`（1–200 字）  
- 主按钮文案改为「继续生成」  
- 一次只问一个问题  
- 与方案无关的缺失不问  

### 8.5 继续处理

| 整单状态 | Tag | 进度 | 异常 Tag | 去向 |
|---|---|---|---|---|
| `IN_PROGRESS` | 执行中 | 已成功数 / 7 | 有则显示 | P-04 |
| `NEEDS_ATTENTION` / `PARTIAL_COMPLETE` | 执行中 | 4 / 7 | 待审批 + 需要处理 + 结果未知 | P-05 |
| 无工单 | 整节不渲染 | — | — | — |

### 8.6 离开与刷新

| 场景 | 处理 |
|---|---|
| 有内容未提交，刷新 | 可用 `sessionStorage`；不做跨会话草稿 |
| 有内容，点其他菜单 | 低风险直接走，不弹 Modal |
| analyzing 中关页 | `beforeunload` |
| 生成失败后刷新 | 保留原文 |

本页无删除，无二次确认弹窗。若以后做 Modal：普通业务弹窗 `centered`，操作类 header / body / footer 三段，body 唯一滚动。

---

## 9. 字段

| 字段 | 组件 | 必填 | 长度 | 校验 | 错误 |
|---|---|---|---|---|---|
| 需求描述 | `Input.TextArea` | 是 | 1–2000 | `whitespace: true` | 请先填写开通需求 |
| 补充信息 | `Input` | 仅询问出现时 | 1–200 | 非空 | 请确认后再继续 |

任务卡只读：员工名、岗位、部门、完成数、待审批数、需处理数、未知数。

---

## 10. 响应式

跟随 SideLayout，不另做移动端产品。

| 视口 | 规则 |
|---|---|
| ≥1440 | 侧栏 208px 展开 |
| 1280–1439 | 侧栏仍展开；副文案换行；任务卡 Tag 换行 |
| ≤1120 | Skill 默认缩小搜索；本页无顶栏搜索，忽略 |
| ≤760 | 侧栏可 `translateX(-100%)` 滑出；内容 `margin-left: 0; padding: var(--nav-space-4)` |
| 缩放 200% | 标题、输入、主按钮可用，允许滚动 |

本期不强制做 ≤760 的完整移动端，但收起 64px 必须可用。不使用底部 TabBar。

---

## 11. 无障碍

- 图标按钮都有 `aria-label`  
- 当前菜单 `aria-current="page"`  
- Form 错误由 antd 绑定 `aria-invalid`  
- 核对步骤 `aria-live="polite"`  
- Tab 顺序：收起触发器 → 菜单 → 用户区（帮助、通知、头像）→ 输入 → 语音 → 主按钮 → 任务卡  
- 不去掉 antd 焦点轮廓  
- 超长文本用 `ellipsis` + `Tooltip`，不用原生 `title` 凑合  
- 进度：`Progress` 自带 progressbar 语义，补 `aria-label`  

---

## 12. 动效

| 场景 | 规格 |
|---|---|
| 侧栏收起 | `var(--nav-transition)`，内容区 `margin-left` 同步 |
| 主按钮 loading | antd Button loading，不改宽度 |
| 核对步骤 | 跟随 Steps 默认；不要额外 stagger 大动画 |
| 任务卡 hover | antd `hoverable` 或边框 120ms |
| 进 P-02 | 立即切页 |

`prefers-reduced-motion: reduce`：取消插画悬浮与步骤逐条出现，步骤一次给齐。不给键盘操作加装饰动画。

---

## 13. 资产

| 文件 | 用途 | 规格 |
|---|---|---|
| `P-01-homepage-hifi.png` | 文案 / 模块对照 | `00-source/` |
| `global-style.css` | Design Token | 从 Skill 复制到项目 |
| `logo-access-flow.svg` | `.logo-mark` | 24×24 |
| `agent-hero.png` | PageHeader extra | 透明底，至少 2x |
| `avatar-manager.png` | 用户头像 | 可选；无则 Avatar 字母 |
| 功能图标 | 全部 `@ant-design/icons` | 16px 线性 |

---

## 14. 与稿面 / PRD 的差异

| 点 | 高保真稿 | PRD v1.1 | 本 Spec（Ant Design） |
|---|---|---|---|
| 顶栏 | 全宽 Header，右上角用户 | 未规定壳层 | SideLayout：顶栏仅侧栏宽；用户区在侧栏底 |
| 菜单选中 | 浅蓝底 + 品牌蓝字 | — | 灰底加深字，禁止 primary-bg |
| 主标题 | 约 28px 营销标题 | 可低保真 | `Title level={4}` 20px |
| 插画 | 左侧大 Hero | 无 | 收进 PageHeader extra，可省略 |
| 输入卡 | 12px 圆角、重投影、无边框 textarea | 1–2000 字 | `ds-page-card` 8px + `Input.TextArea` `showCount` |
| 主色 | 约 `#2B6BF3` | — | `#1677ff` |
| 画布 | 略偏蓝灰 | — | `#f7f8fa` |
| 内容限宽 | 视觉居中约 960 | — | 不限宽，24px 页边 |
| 正在执行 / 开通记录 | 有菜单 | 不新开列表 | 菜单可点，落到 P-04/P-05/P-06 或 message |
| 用户名 | 李经理 | 王璐 | UI 李经理 |
| 语音 | 有麦克风 | 未写 | `AudioOutlined` 占位 |
| 设置 / 帮助 / 通知 | 有 | 不做登录与用户管理 | 壳层保留；设置在菜单，帮助通知在用户区 |
| 继续处理 | 有任务卡 | P-01 未写 | 本页恢复入口；Tag / Progress 用 antd |

---

## 15. 验收清单

### Ant Design 壳层

- [ ] 使用 SideLayout，未混用 TopLayout / MixedLayout  
- [ ] 画布 / 顶栏 / 侧栏背景为 `#f7f8fa`  
- [ ] 侧栏 208px，收起 64px，有独立 24px 圆形收起触发器  
- [ ] 选中菜单是灰底，不是浅蓝底蓝字  
- [ ] 帮助、通知在侧栏用户区；设置在菜单列表  
- [ ] 收起后 Logo 图形仍在，只藏品牌文字；用户区只剩头像  
- [ ] 入口已引入 `global-style.css`；业务样式无硬编码色值  
- [ ] `ConfigProvider` 的 `colorPrimary` 为 `#1677ff`，`borderRadius` / `borderRadiusLG` 为 8  
- [ ] 无面包屑；只有一个 `.ds-page-title`  
- [ ] 页面白卡 `bordered={false}` + `ds-page-card`，左右 24px、上下 16px  

### 主路径

- [ ] 空提交不出请求，出现「请先填写开通需求」  
- [ ] `showCount` + `maxLength={2000}` 截断粘贴  
- [ ] 提交后 Button loading，原文不丢，忽略二次点击  
- [ ] 陈晨原句成功后进入 P-02  
- [ ] 失败后原文仍在，可重试  

### 继续处理

- [ ] 演示工单文案正确  
- [ ] `4 / 7 已完成` + Progress  
- [ ] 三个 Tag 语义色正确（warning / error / default），0 不出现  
- [ ] 「查看进度」进入 P-04 或 P-05  
- [ ] 无工单时整节消失  

### 范围

- [ ] 未确认前不调用开通  
- [ ] 不出现历史工单表格、筛选、导出  
- [ ] 设置不做配置页  
- [ ] 语音不申请麦克风  

---

## 16. 实现备注

- 壳层从 Skill `scripts/layout/SideLayout.tsx` 复制，只替换业务字段。  
- 首页只定义 `.ds-page-shell` 内容；后续 P-02 起继续用同一 SideLayout，流程 Stepper 放在页面内容区，不要再做第二套顶栏。  
- 前端不得把「生成方案」做成直接开通。  
- 任务卡数字以后端汇总为准；陈晨 4/7 由 Mock 提供。  
- 生成成功出口已接到 P-02：[`P-02-审阅权限方案/spec.md`](P-02-审阅权限方案/spec.md)（路由 `/plan`）。该页壳层、Token、用户区引用本文第 3、5、6 节，只写审阅差量。  
- P-05 见 [`P-05-开通结果/spec.md`](P-05-开通结果/spec.md)。P-03 / P-04 同样只写差量，不要另起 TopLayout。
