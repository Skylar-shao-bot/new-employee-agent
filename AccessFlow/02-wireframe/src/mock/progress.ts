import {
  defaultPlanItems,
  loadStoredPlan,
  type PlanIconKey,
  type PlanItem,
  type StoredPlan,
} from './plan';

export const PROGRESS_INFO_DISMISS_KEY = 'accessflow-p04-info-dismissed';
export const PROGRESS_TICK_MS = 1400;
/** 到达该 tick 后凑齐 F01，自动进入执行结果 */
export const PROGRESS_F01_TICK = 5;

export const progressCase = {
  requestNo: 'REQ-20240907-0017',
  createdAt: '2024-09-07 09:00',
} as const;

export type ExecStatus =
  | 'NOT_STARTED'
  | 'RUNNING'
  | 'BLOCKED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'UNKNOWN';

export type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type ProgressGroup =
  | 'running'
  | 'queue'
  | 'waiting'
  | 'pendingStart'
  | 'blocked'
  | 'attention'
  | 'done';

export type ProgressAction =
  | 'log'
  | 'approval'
  | 'query'
  | 'detail'
  | 'contactAdmin'
  | 'manualVerify';

/** 文件库人工核验覆盖（与 P-05 对齐） */
export type FilesOverride = 'unknown' | 'verified';

export interface ProgressItem {
  id: string;
  name: string;
  icon: PlanIconKey;
  targetSystem: string;
  scope: string;
  validUntil: PlanItem['validUntil'];
  execStatus: ExecStatus;
  approvalStatus: ApprovalStatus;
  group: ProgressGroup;
  tag: string;
  tagColor: string;
  description: string;
  nextStep: string;
  meta?: string;
  percent?: number;
  handler?: string;
  requestNo?: string;
  reasonCode?: string;
  startedAt?: string;
  submittedAt?: string;
  elapsedSeconds?: number;
  logLines?: string[];
  allowedActions: ProgressAction[];
}

interface SnapshotSeed {
  execStatus: ExecStatus;
  approvalStatus: ApprovalStatus;
  group: ProgressGroup;
  tag: string;
  tagColor: string;
  description: string;
  nextStep: string;
  meta?: string;
  percent?: number;
  handler?: string;
  requestNo?: string;
  reasonCode?: string;
  startedAt?: string;
  submittedAt?: string;
  elapsedSeconds?: number;
  logLines?: string[];
  allowedActions: ProgressAction[];
}

const TARGET_SYSTEM: Record<string, string> = {
  account: '公司账号系统',
  mail: '邮件与即时通信',
  knowledge: '知识库',
  board: 'Atlas 项目看板',
  design: '设计工具',
  dashboard: '产品数据看板',
  files: 'Atlas 项目文件库',
};

const DONE = (description: string, requestNo: string, meta: string): SnapshotSeed => ({
  execStatus: 'SUCCEEDED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'done',
  tag: '已完成',
  tagColor: 'success',
  description,
  nextStep: '已开通，不能重复执行',
  meta,
  requestNo,
  allowedActions: ['detail'],
});

const RUNNING = (
  description: string,
  requestNo: string,
  percent: number,
  logLines: string[],
): SnapshotSeed => ({
  execStatus: 'RUNNING',
  approvalStatus: 'NOT_REQUIRED',
  group: 'running',
  tag: '执行中',
  tagColor: 'processing',
  description,
  nextStep: '无需处理，Agent 正在执行',
  percent,
  requestNo,
  startedAt: '09:02:15',
  elapsedSeconds: 48,
  logLines,
  allowedActions: ['log'],
});

const QUEUE: SnapshotSeed = {
  execStatus: 'NOT_STARTED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'queue',
  tag: '等待中',
  tagColor: 'default',
  description: '等待前序任务完成后自动执行',
  nextStep: '前序任务完成后将自动开始',
  allowedActions: ['detail'],
};

const PENDING_START: SnapshotSeed = {
  execStatus: 'NOT_STARTED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'pendingStart',
  tag: '尚未开始',
  tagColor: 'default',
  description: '等待前置条件满足后执行',
  nextStep: '前置条件满足后将自动继续',
  allowedActions: ['detail'],
};

const WAITING_APPROVAL: SnapshotSeed = {
  execStatus: 'NOT_STARTED',
  approvalStatus: 'PENDING',
  group: 'waiting',
  tag: '待审批',
  tagColor: 'warning',
  description: '已提交给数据负责人审批',
  nextStep: '等待数据负责人审批，批准前不会开通',
  meta: '当前处理人 数据负责人 · 提交时间 09:02',
  handler: '数据负责人',
  submittedAt: '09:02',
  requestNo: 'APV-20240907-003',
  allowedActions: ['approval'],
};

const DESIGN_FAILED: SnapshotSeed = {
  execStatus: 'FAILED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'attention',
  tag: '失败',
  tagColor: 'error',
  description: '无可用许可证',
  nextStep: '联系设计工具管理员补充许可证',
  handler: '设计工具管理员',
  requestNo: 'DES-20240907-005',
  reasonCode: 'NO_LICENSE',
  allowedActions: ['detail', 'contactAdmin'],
};

const FILES_UNKNOWN: SnapshotSeed = {
  execStatus: 'UNKNOWN',
  approvalStatus: 'NOT_REQUIRED',
  group: 'attention',
  tag: '结果未知',
  tagColor: 'default',
  description: '请求超时，无法判断是否已开通',
  nextStep: '可查询原请求，或确认已开通（不会重新提交）',
  requestNo: 'FILE-20240907-007',
  reasonCode: 'TIMEOUT',
  allowedActions: ['query', 'manualVerify'],
};

const FILES_VERIFIED: SnapshotSeed = {
  execStatus: 'SUCCEEDED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'done',
  tag: '已完成',
  tagColor: 'success',
  description: '已按人工核验标记为成功',
  nextStep: '已开通，不能重复执行',
  meta: '完成时间 人工核验',
  requestNo: 'FILE-20240907-007',
  allowedActions: ['detail'],
};

/**
 * Mock 节拍（与 PRD F01 组合对齐）
 * 0 账号完成 / 邮件执行中
 * 1 邮件完成 / 知识库执行中
 * 2 知识库完成 / 看板执行中
 * 3 看板完成 / 设计工具失败
 * 4 文件库结果未知（F01 凑齐）
 * ≥5 保持 F01，触发跳转结果页
 */
function seedFor(id: string, tick: number): SnapshotSeed {
  const t = Math.max(0, tick);

  if (id === 'account') {
    return DONE('标准员工账号已开通', 'ACC-20240907-001', '完成时间 09:01');
  }

  if (id === 'dashboard') {
    return WAITING_APPROVAL;
  }

  if (id === 'mail') {
    if (t === 0) {
      return RUNNING('Agent 正在添加普通成员权限', 'MAIL-20240907-014', 45, [
        '09:02:15 开始调用邮件与即时通信',
        '09:02:40 正在写入普通成员权限',
      ]);
    }
    return DONE('普通成员权限已开通', 'MAIL-20240907-014', '完成时间 09:03');
  }

  if (id === 'knowledge') {
    if (t === 0) {
      return QUEUE;
    }
    if (t === 1) {
      return RUNNING('Agent 正在开通全员内容只读', 'KB-20240907-008', 52, [
        '09:03:10 开始调用知识库',
        '09:03:25 正在写入只读权限',
      ]);
    }
    return DONE('全员内容只读已开通', 'KB-20240907-008', '完成时间 09:04');
  }

  if (id === 'board') {
    if (t <= 1) {
      return QUEUE;
    }
    if (t === 2) {
      return RUNNING('Agent 正在开通项目成员权限', 'BOARD-20240907-021', 60, [
        '09:04:05 开始调用 Atlas 项目看板',
        '09:04:20 正在写入项目成员',
      ]);
    }
    return DONE('项目成员权限已开通', 'BOARD-20240907-021', '完成时间 09:05');
  }

  if (id === 'design') {
    if (t <= 2) {
      return PENDING_START;
    }
    if (t === 3) {
      return RUNNING('Agent 正在检查许可证', 'DES-20240907-005', 30, [
        '09:05:10 开始调用设计工具',
        '09:05:20 正在查询可用许可证',
      ]);
    }
    return DESIGN_FAILED;
  }

  if (id === 'files') {
    if (t <= 3) {
      return PENDING_START;
    }
    if (t === 4) {
      return RUNNING('Agent 正在开通项目目录读写', 'FILE-20240907-007', 40, [
        '09:06:00 开始调用 Atlas 项目文件库',
        '09:06:20 等待系统响应',
      ]);
    }
    return FILES_UNKNOWN;
  }

  return PENDING_START;
}

const ORDER = defaultPlanItems.map((item) => item.id);

function withTarget(item: PlanItem, seed: SnapshotSeed): ProgressItem {
  return {
    id: item.id,
    name: item.name,
    icon: item.icon,
    targetSystem: TARGET_SYSTEM[item.id] ?? item.name,
    scope: item.scope,
    validUntil: item.validUntil,
    ...seed,
  };
}

const ACCOUNT_BLOCKED: SnapshotSeed = {
  execStatus: 'BLOCKED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'blocked',
  tag: '被阻塞',
  tagColor: 'error',
  description: '因公司账号失败，本项未执行',
  nextStep: '因公司账号失败，本项未执行',
  allowedActions: ['detail'],
};

function isOpenDependent(item: ProgressItem): boolean {
  return (
    item.execStatus !== 'SUCCEEDED' &&
    item.execStatus !== 'FAILED' &&
    item.execStatus !== 'UNKNOWN' &&
    item.approvalStatus !== 'PENDING'
  );
}

export function buildProgressItems(
  plan: StoredPlan = loadStoredPlan(),
  tick = 0,
  filesOverride: FilesOverride = 'unknown',
): ProgressItem[] {
  const accountSelected = plan.selectedKeys.includes('account');
  const selected = plan.items.filter((item) => plan.selectedKeys.includes(item.id));
  const dependentIds = new Set(
    selected.filter((item) => item.dependsOnAccount).map((item) => item.id),
  );

  const rows = ORDER.map((id) => selected.find((item) => item.id === id))
    .filter((item): item is PlanItem => Boolean(item))
    .map((item) => {
      const blockedByAccount = Boolean(item.dependsOnAccount && !accountSelected);
      if (blockedByAccount) {
        return withTarget(item, ACCOUNT_BLOCKED);
      }
      const seed = seedFor(item.id, tick);
      if (
        item.id === 'files' &&
        filesOverride === 'verified' &&
        (seed.execStatus === 'UNKNOWN' || seed.group === 'attention')
      ) {
        return withTarget(item, FILES_VERIFIED);
      }
      return withTarget(item, seed);
    });

  const accountFailed = rows.find((item) => item.id === 'account')?.execStatus === 'FAILED';
  if (!accountFailed) {
    return rows;
  }

  return rows.map((item) => {
    if (!dependentIds.has(item.id) || !isOpenDependent(item)) {
      return item;
    }
    return { ...item, ...ACCOUNT_BLOCKED };
  });
}

export function isF01Ready(tick: number): boolean {
  return tick >= PROGRESS_F01_TICK;
}

export function progressStats(items: ProgressItem[]) {
  return {
    succeeded: items.filter((item) => item.execStatus === 'SUCCEEDED').length,
    running: items.filter((item) => item.execStatus === 'RUNNING').length,
    waiting: items.filter((item) => item.approvalStatus === 'PENDING').length,
    blocked: items.filter((item) => item.group === 'blocked').length,
    attention: items.filter((item) => item.group === 'attention').length,
    failed: items.filter((item) => item.execStatus === 'FAILED').length,
    pendingStart: items.filter(
      (item) => item.group === 'queue' || item.group === 'pendingStart',
    ).length,
    total: items.length,
  };
}

export function approvalLabel(status: ApprovalStatus): string {
  if (status === 'PENDING') {
    return '待审批';
  }
  if (status === 'APPROVED') {
    return '已批准';
  }
  if (status === 'REJECTED') {
    return '已拒绝';
  }
  return '无需审批';
}

export function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatClock(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function actionLabel(action: ProgressAction): string {
  if (action === 'log') {
    return '查看执行日志';
  }
  if (action === 'approval') {
    return '查看审批详情';
  }
  if (action === 'query') {
    return '查询结果';
  }
  if (action === 'contactAdmin') {
    return '联系管理员';
  }
  if (action === 'manualVerify') {
    return '确认已开通';
  }
  return '查看详情';
}

export function primaryActionLabel(item: ProgressItem, action: ProgressAction): string {
  if (item.execStatus === 'FAILED' && action === 'detail') {
    return '查看原因';
  }
  return actionLabel(action);
}
