# AccessFlow Constitution

本文件只锁跨功能硬规则。产品事实仍以 [`01-prd/PRD-AccessFlow-v1.1.md`](../01-prd/PRD-AccessFlow-v1.1.md) 为准；页面怎么画以 [`04-specs/`](../04-specs/) 为准。

**Version**: 1.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20

## Core Principles

### I. 规格分层，禁止平行重写

| 层 | 文件 | 管什么 |
|---|---|---|
| 范围 | `00-backlog/` | MVP / Later / 暂不考虑 |
| 业务 | `01-prd/` | 角色、权限项、状态、F01、硬规则 |
| 实现切片 | `specs/<id>-*/` | 本轮做什么、技术怎么落、任务怎么切 |
| 页面 | `04-specs/P-xx/` | 单页布局、组件、文案、验收 |

新想法先进 Backlog，再决定是否进 PRD。Feature Spec 不得复制整份 PRD。

### II. 范围冻结

未经确认，不得新增权限项、角色、独立列表产品、审批人端或真实企业系统。实现方式可改，业务事实不可改。

### III. 确认 ≠ 审批 ≠ 开通

四个事实必须分开表达。未确认不得执行；成功项不得重复；未知项只能查询。

### IV. 先静态可看，后接能力

当前切片只交付可打开的页面。数据写死陈晨案例。不接 DeepSeek、不接 Mock API、不做登录。

### V. 一套工作台壳

全站只用一种 App Shell：**SideLayout**（侧栏 208 / 64 + 内容区）。  
P-02 / P-04 规格里的 TopLayout 视为过时，实现时改回 SideLayout，内容区信息架构保留。  
流程 `Steps` 放在内容区，禁止第二套顶栏。

依据：P-01 已把壳层写死，P-05 已声明复用 P-01；四张高保真若各用一套导航，静态阶段会先碎掉。

### VI. 视觉跟 Ant Design，业务跟 PRD

稿面与 Token 冲突时，改视觉跟 Ant Design，不改业务跟稿面色值。状态必须有文字，不能只靠颜色。

## 本阶段明确跳过（Spec Kit 取舍）

| Spec Kit 产物 | 决定 | 原因 |
|---|---|---|
| `specify init` / AGENTS.md 脚手架 | 跳过 | 已有 AccessFlow 目录，不另起一套仓库 |
| 全产品 Feature Spec | 跳过 | 与 PRD 重复 |
| `research.md` | 跳过 | 技术栈已由 04-specs 选定 |
| `data-model.md` / `contracts/` | 跳过 | 静态阶段无 API；实体已在 PRD |
| 单元测试 / 契约测试 | 跳过 | 本切片用浏览器打开 + 验收清单 |
| 灰度纯 HTML 线框 | 跳过 | 04-specs 已按 antd 高保真写，再出一套 HTML 会双轨 |

## Governance

- 改业务规则：改 PRD，并在变更记录留痕。
- 改单页布局：改对应 `04-specs/`，不在 Feature Spec 里展开 Token。
- 改本轮技术或任务切分：改 `specs/001-static-main-path/`。
- Constitution 与 PRD 冲突时，停止实现，先改文档。
