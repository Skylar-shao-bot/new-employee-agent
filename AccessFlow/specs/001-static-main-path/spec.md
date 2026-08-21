# Feature Specification: 静态主路径页面

**Feature Branch**: `001-static-main-path`  
**Created**: 2026-08-20  
**Status**: Draft  
**Input**: 先生成可打开的静态页面设计，不接 Agent / 后端。参考 Spec Kit 做切片，不重写 PRD。

**权威引用**

- 业务：[`../../01-prd/PRD-AccessFlow-v1.1.md`](../../01-prd/PRD-AccessFlow-v1.1.md)
- 范围：[`../../00-backlog/project-backlog.md`](../../00-backlog/project-backlog.md)
- 页面：[`../../04-specs/`](../../04-specs/)
- 规则：[`../constitution.md`](../constitution.md)

## User Scenarios & Testing *(mandatory)*

每条故事打开对应路由即可独立验收，不依赖真实模型。

### User Story 1 - 看懂开通方案（Priority: P1）

王璐打开方案审阅页，要在 30 秒内分清 7 项建议和 2 项排除，并知道这还不是执行。

**Why this priority**: 这是本期要验证的核心假设，也是 1440 高保真必交页。

**Independent Test**: 只打开 `/plan`，不经过输入页，仍能看懂建议 / 排除 / 差异。

**Acceptance Scenarios**:

1. **Given** 陈晨方案已生成，**When** 打开审阅页，**Then** 看见员工摘要、7 项建议、2 项排除，排除项不能看起来像待执行。
2. **Given** 在审阅页，**When** 查看来源差异，**Then** 能区分岗位标准、用户申请、Agent 建议、已排除。
3. **Given** 在审阅页，**When** 试图把「客户数据导出」勾进执行，**Then** 不能加入；有文字说明历史权限不能照搬。

---

### User Story 2 - 看懂部分完成（Priority: P1）

王璐打开 F01，要判断下一步：许可证转人工、数据权限等审批、文件库先查询。不能把四项成功当成全部完成。

**Why this priority**: 评分硬门槛；没有这页，主路径验收不成立。

**Independent Test**: 只打开 `/f01`（1024 画板），能说出四类结果和下一步。

**Acceptance Scenarios**:

1. **Given** 到达 F01 固定结果，**When** 打开结果页，**Then** 整单为「部分完成」，分组为 4 成功 / 1 失败 / 1 待审批 / 1 未知。
2. **Given** 设计工具失败，**When** 看该项，**Then** 说明无可用许可证、转工具管理员，没有「重新开通」。
3. **Given** 文件库结果未知，**When** 看可用操作，**Then** 只有「查询结果」，没有重试。
4. **Given** 1024 宽度，**When** 查看页面，**Then** 主操作链仍可见。

---

### User Story 3 - 确认执行结果（Priority: P2）

王璐在确认页看到确认后谁来执行：6 项交给 Agent，1 项送审。排除项不再出现。她明白确认不是审批。

**Why this priority**: 主路径不可缺，但可以在 P-02 / P-05 结构稳定后再画。

**Independent Test**: 只打开 `/confirm`，按执行主体分组完整；客户数据导出、生产系统管理均不出现。

**Acceptance Scenarios**:

1. **Given** 方案已审阅且 7 项勾选，**When** 打开确认页，**Then** Agent 组含账号及依赖项与设计工具，产品数据看板在「将送交人工审批」，两项历史权限不出现。
2. **Given** 在确认页，**When** 阅读主按钮说明，**Then** 文案是确认后开始处理，而不是「已批准」或「已开通」。
3. **Given** 在确认页，**When** 点「返回修改方案」，**Then** 回到 `/plan`，勾选与修改仍在。

---

### User Story 4 - 看执行中进度（Priority: P2）

王璐在进度页知道整单还在跑、谁被阻塞、成功项不能再点执行。

**Independent Test**: 只打开 `/progress`，七项（不含排除项）状态可读。

**Acceptance Scenarios**:

1. **Given** 经理已确认，**When** 打开进度页，**Then** 不出现两项排除权限。
2. **Given** 公司账号仍在执行，**When** 查看邮件/知识库，**Then** 显示因依赖被阻塞。
3. **Given** 某项已成功，**When** 查看操作，**Then** 无重复执行，并有文字原因。

---

### User Story 5 - 输入与收口（Priority: P3）

输入页和最终结果页可较低保真，但必须能从索引点到，且结果页不得写成全部完成。

**Independent Test**: 打开 `/` 能看到输入区；打开 `/result` 与 F01 事实一致。

**Acceptance Scenarios**:

1. **Given** 打开输入页，**When** 不填内容点生成，**Then** 静态页用禁用/错误文案表达「请先填写开通需求」（本切片不做真请求）。
2. **Given** 打开最终结果，**When** 阅读整单，**Then** 仍是部分完成，未完成三项写清。

---

### Edge Cases

- 静态页用 `<a>` 串联主路径即可；不模拟生成失败、多人重名、网络断开。
- 修改方案抽屉、查询结果的真实返回，本切片不做，只保留入口外观（禁用或说明「静态演示」）。
- 侧栏「正在执行 / 开通记录」可点到对应静态页；无工单时的 empty message 可后补。
- 用户显示名：业务是王璐，P-01 稿为李经理。本切片壳层跟 P-01 用「李经理」，员工事实仍用陈晨 / 王璐直属关系，不在静态页解释双名称。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-S001**: 系统 MUST 提供可在浏览器直接打开的页面（本地 Vite dev 或静态预览），每条 P1 故事对应独立路由。
- **FR-S002**: 系统 MUST 使用同一 SideLayout 壳；内容区按各页 `04-specs` 组织。
- **FR-S003**: 系统 MUST 写死陈晨 7 项建议 + 2 项排除 + F01 四类结果，不得调用模型。
- **FR-S004**: 系统 MUST 用图标 + 文字 + 颜色同时表达状态。
- **FR-S005**: 系统 MUST 在页面索引中列出主路径，便于评审点击。
- **FR-S006**: 本切片 MUST NOT 实现登录、DeepSeek、Mock Connector、审批人端、邮件催办。

### Key Entities

沿用 PRD，本切片只渲染：

- **OnboardingCase**：陈晨工单，整单状态按页面写死（审阅 / 待确认 / 执行中 / 部分完成）。
- **AccessItem**：7 条建议项 + 2 条排除项。

## Success Criteria *(mandatory)*

- **SC-001**: 不看 PRD，只看 P-02，能在 30 秒内指出 7 项建议和 2 项排除。
- **SC-002**: 不看 PRD，只看 P-05，能说出四类结果和下一步责任人。
- **SC-003**: 1440 下 P-02/P-03/P-04 首屏能看到标题、主操作、核心列表开头；1024 下 P-05 主操作不消失。
- **SC-004**: 全站没有第二套导航壳。

## Assumptions

- 04-specs 已选定 antd 6 + React 19 + TypeScript；本切片跟随，不再改回纯 HTML。
- P-03 以 [`04-specs/P-03-权限与执行确认/spec.md`](../../04-specs/P-03-权限与执行确认/spec.md) 为准，挂 P-02 同一 SideLayout。
- 本切片验收方式是打开页面走查，不写自动化测试。
