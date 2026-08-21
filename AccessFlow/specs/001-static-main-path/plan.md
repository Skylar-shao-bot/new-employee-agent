# Implementation Plan: 静态主路径页面

**Branch**: `001-static-main-path` | **Date**: 2026-08-20 | **Spec**: [`spec.md`](./spec.md)

## Summary

用 Vite + React + Ant Design 搭一个**无后端的静态工作台**：一页一路由，数据写死陈晨案例。先交付 P-02 与 P-05（P1），再补 P-03 / P-04，最后补 P-01 / P-06。壳层统一 SideLayout，不另起灰度 HTML，不接模型。

## Technical Context

**Language/Version**: TypeScript 5，React 19  

**Primary Dependencies**: Vite；`antd@^6`；`@ant-design/pro-components@^2.7`；`@ant-design/icons@^6`；`react-router`  

**Storage**: 无。演示数据放 `src/mock/chenchen.ts`  

**Testing**: 浏览器走查 + 各页 04-specs 验收清单。本切片不写单测。  

**Target Platform**: 桌面 Chrome，主画板 1440；P-05 按 1024 检查  

**Project Type**: 单仓前端静态预览（不是前后端分离服务）  

**Performance Goals**: 本地启动后页面可立即打开；无接口等待  

**Constraints**: API Key 不得出现；业务样式禁止硬编码色值（ConfigProvider token 除外）；不得新增 PRD 未有的权限项  

**Scale/Scope**: 6 个路由 + 1 个共享壳；约 1 条工单、9 条权限项

## Constitution Check

| Gate | 结果 |
|---|---|
| 不复制 PRD | 通过：本计划只定工程切分 |
| 范围冻结 | 通过：无新页面产品、无真实系统 |
| 静态先行 | 通过：无 DeepSeek / Mock API |
| 一套壳 | 通过：SideLayout；P-02/P-04 的 TopLayout 作废 |
| 视觉跟 antd | 通过：从 Ant Design Skill 复制 token / 壳层 |
| 跳过 contracts / data-model | 通过：本切片无 API |

违规项：无。

## Project Structure

### Documentation (this feature)

```text
specs/001-static-main-path/
├── spec.md
├── plan.md              # 本文件
└── tasks.md
```

不生成本切片的 `research.md`、`data-model.md`、`contracts/`。

### Source Code

```text
AccessFlow/02-wireframe/          # 静态可运行前端（名称保持产品目录约定）
  index.html
  package.json
  vite.config.ts
  src/
    main.tsx
    styles/global-style.css       # 从 Ant Design Skill 复制
    layouts/SideLayout.tsx        # 从 Skill SideLayout 改造
    mock/chenchen.ts              # 冻结业务数据
    routes.tsx
    pages/
      P01Request.tsx
      P02PlanReview.tsx
      P03Confirm.tsx
      P04Progress.tsx
      P05F01.tsx
      P06Result.tsx
    components/                   # 员工摘要、权限表、Steps、结果分组
```

**Structure Decision**: 放在已有 `02-wireframe/`，不新建 `frontend/` 或 `src/` 在仓库根。AccessFlow 继续当产品目录，脑科学仓库根不铺应用代码。

## Implementation Phases

1. **Setup**：Vite 应用、antd ConfigProvider、SideLayout、mock 数据、路由骨架。  
2. **P1**：P-02、P-05。做完即停，先走查 30 秒理解 + F01 四类结果。  
3. **P2**：P-03、P-04。  
4. **P3**：P-01、P-06、索引链接串主路径。  
5. **Review**：对照 spec 验收；壳层一致性；无第二套导航。

## Risks & Mitigations

| 风险 | 缓解 |
|---|---|
| 04-specs 之间壳层冲突 | Constitution 已裁定 SideLayout |
| 先做工程导致改不动版式 | 每页仍以 04-specs 为界面准绳；P1 只做两页 |
| 一上来接模型 | Constitution IV 禁止；mock 文件是唯一数据源 |
| 纯 HTML 与 antd 双轨 | 已放弃纯 HTML |
