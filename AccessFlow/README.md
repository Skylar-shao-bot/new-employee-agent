# AccessFlow 项目索引

> 新员工账号与权限开通 Agent · 需求版本 v1.1

当前需求以 [`01-prd/PRD-AccessFlow-v1.1.md`](01-prd/PRD-AccessFlow-v1.1.md) 为准。静态原型在 [`02-wireframe/`](02-wireframe/)。

在线浏览：https://skylar-shao-bot.github.io/AccessFlow/

## 怎么用

| 你要做什么 | 去哪里 |
|---|---|
| 看当前需求 | [`01-prd/PRD-AccessFlow-v1.1.md`](01-prd/PRD-AccessFlow-v1.1.md) |
| 看本期范围 | [`00-backlog/project-backlog.md`](00-backlog/project-backlog.md) |
| 核对原始材料 | [`00-source/`](00-source/) |
| P-01 新建开通 | [`04-specs/P-01-新建开通/spec.md`](04-specs/P-01-新建开通/spec.md) |
| P-02 审阅权限方案 | [`04-specs/P-02-审阅权限方案/spec.md`](04-specs/P-02-审阅权限方案/spec.md) |
| P-03 权限与执行确认 | [`04-specs/P-03-权限与执行确认/spec.md`](04-specs/P-03-权限与执行确认/spec.md) |
| P-04 跨系统执行进度 | [`04-specs/P-04-跨系统执行进度/spec.md`](04-specs/P-04-跨系统执行进度/spec.md) |
| P-05 开通结果 | [`04-specs/P-05-开通结果/spec.md`](04-specs/P-05-开通结果/spec.md) |
| 本轮实现切片 | [`specs/001-static-main-path/spec.md`](specs/001-static-main-path/spec.md) |
| 项目硬规则 | [`specs/constitution.md`](specs/constitution.md) |

## 目录

```text
AccessFlow/
  00-source/          原始材料，不覆盖
  00-backlog/         需求源头与范围
  01-prd/             落地版 PRD
  02-wireframe/       静态可运行前端
  04-specs/           单页规格
  05-presentations/   方案与体验结构
  specs/              Spec Kit：constitution + 本轮切片
```

## 本地运行

```bash
cd AccessFlow/02-wireframe
npm install
npm run dev
```

浏览器打开 http://localhost:5173 。预填陈晨原句：`http://localhost:5173/?demo=chenchen`。
