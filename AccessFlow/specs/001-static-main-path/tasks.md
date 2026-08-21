# Tasks: 静态主路径页面

**Input**: [`spec.md`](./spec.md)、[`plan.md`](./plan.md)  
**Prerequisites**: Constitution 已裁定 SideLayout；页面细节见 `04-specs/`  
**Tests**: 不写自动化测试。每条故事用「独立打开路由」验收。

## Format

- **[P]**：可并行（不同文件）
- **[USn]**：对应 spec 用户故事

---

## Phase 1: Setup

- [ ] T001 在 `AccessFlow/02-wireframe/` 初始化 Vite + React + TypeScript
- [ ] T002 安装 `antd@^6`、`@ant-design/pro-components@^2.7`、`@ant-design/icons@^6`、`react-router`
- [ ] T003 复制 Ant Design Skill 的 `global-style.css` 到 `src/styles/global-style.css`，入口用 ConfigProvider（`colorPrimary: #1677ff`，`borderRadius: 8`）
- [ ] T004 从 Skill 复制并改造 `src/layouts/SideLayout.tsx`：菜单为新建开通 / 正在执行 / 开通记录 / 设置
- [ ] T005 写入 `src/mock/chenchen.ts`：员工事实、7 项建议、2 项排除、F01 固定结果
- [ ] T006 建立 `src/routes.tsx`：`/` ` /plan` `/confirm` `/progress` `/f01` `/result`，先放占位页

**Checkpoint**: `npm run dev` 能看到 SideLayout，菜单可切换占位页。

---

## Phase 2: User Story 1 - 看懂开通方案（P1）

**Independent Test**: 打开 `/plan`，30 秒内识别 7+2。

- [ ] T007 [US1] 实现 `src/pages/P02PlanReview.tsx`：员工摘要、差异/指标、建议表、排除表
- [ ] T008 [US1] 排除项只读且视觉上不是待执行；禁止勾选加入执行
- [ ] T009 [US1] 内容区放四步 `Steps`，当前为方案审阅；主按钮外观「继续确认」，href 到 `/confirm`（可先占位）

**Checkpoint**: 只测 `/plan` 即可，不依赖其他页。

---

## Phase 3: User Story 2 - 看懂部分完成（P1）

**Independent Test**: 1024 宽度打开 `/f01`。

- [ ] T010 [P] [US2] 实现 `src/pages/P05F01.tsx`：整单部分完成、四类分组、Agent 下一步
- [ ] T011 [US2] 成功项无重试；未知项仅「查询结果」外观（静态可禁用并给原因）
- [ ] T012 [US2] 检查 1024 下主操作不消失；侧栏当前项为「开通记录」

**Checkpoint**: P-02 与 P-05 都可独立打开后，暂停等设计走查。

---

## Phase 4: User Story 3 - 确认执行边界（P2）

- [x] T013 [US3] 实现 `src/pages/P03Confirm.tsx`：按执行主体分组（Agent / 人工执行 / 送审），只渲染已勾选项
- [x] T014 [US3] 主按钮文案「确认方案并开始处理」，链接到 `/progress`；排除项不出现；「返回修改方案」回 `/plan`

---

## Phase 5: User Story 4 - 看执行中进度（P2）

- [ ] T015 [US4] 实现 `src/pages/P04Progress.tsx`：整单进度、七项状态、依赖阻塞文案
- [ ] T016 [US4] 列表不包含排除项；成功项操作禁用并解释；侧栏高亮「正在执行」

---

## Phase 6: User Story 5 - 输入与收口（P3）

- [ ] T017 [P] [US5] 实现 `src/pages/P01Request.tsx`：标题、输入卡、主按钮；空内容展示校验文案（无请求）
- [ ] T018 [P] [US5] 实现 `src/pages/P06Result.tsx`：与 F01 事实一致的只读收口
- [ ] T019 [US5] 用真实 `<a>` / Link 串起 `/` → `/plan` → `/confirm` → `/progress` → `/f01` → `/result`

---

## Phase 7: Polish

- [ ] T020 核对全站只有一套 SideLayout，无 TopLayout 残留
- [ ] T021 对照 spec SC-001～SC-004 走查
- [ ] T022 更新 `AccessFlow/README.md`，写明如何 `npm run dev`

## Dependencies

- Phase 1 阻塞所有故事。
- US1 / US2 在 Phase 1 之后可并行。
- US3 / US4 建议在 US1 列表组件稳定后做，以便复用权限项展示。
- US5 最后做，避免首页壳层细节拖住必交高保真页。

## MVP 停点

做完 T001–T012 就停：只有 P-02 和 P-05。确认信息层级没问题，再继续 P-03 / P-04。
