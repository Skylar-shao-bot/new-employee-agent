import {
  defaultPlanItems,
  loadStoredPlan,
  type PlanIconKey,
  type PlanItem,
  type StoredPlan,
} from './plan';
import type { ApprovalStatus, ExecStatus } from './progress';

export const F01_INFO_DISMISS_KEY = 'accessflow-p05-info-dismissed';
export const F01_RESULT_SAVE_KEY = 'accessflow.p05.resultSave';
export const F01_CLOSED_KEY = 'accessflow.p05.closed';

export type ResultGroup = 'success' | 'failed' | 'pending' | 'unknown';

export type F01Action =
  | 'viewReceipt'
  | 'viewDetail'
  | 'viewGuide'
  | 'contactAdmin'
  | 'viewApproval'
  | 'remindEmail'
  | 'cancelProvision'
  | 'manualVerify';

export type FilesOverride = 'unknown' | 'cancelled' | 'verified';

export interface F01Item {
  id: string;
  name: string;
  icon: PlanIconKey;
  targetSystem: string;
  scope: string;
  validUntil: PlanItem['validUntil'];
  execStatus: ExecStatus;
  approvalStatus: ApprovalStatus;
  group: ResultGroup;
  tag: string;
  tagColor: string;
  description: string;
  nextStep: string;
  requestNo: string;
  finishedAt?: string;
  handler?: string;
  agentStatus?: string;
  allowedActions: F01Action[];
}

interface SnapshotSeed {
  execStatus: ExecStatus;
  approvalStatus: ApprovalStatus;
  group: ResultGroup;
  tag: string;
  tagColor: string;
  description: string;
  nextStep: string;
  requestNo: string;
  finishedAt?: string;
  handler?: string;
  agentStatus?: string;
  allowedActions: F01Action[];
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

const F01_SNAPSHOT: Record<string, SnapshotSeed> = {
  account: {
    execStatus: 'SUCCEEDED',
    approvalStatus: 'NOT_REQUIRED',
    group: 'success',
    tag: '已完成',
    tagColor: 'success',
    description: '不可重复处理',
    nextStep: '已开通，不能重复执行',
    requestNo: 'ACC-20240907-001',
    finishedAt: '09:02',
    allowedActions: ['viewReceipt'],
  },
  mail: {
    execStatus: 'SUCCEEDED',
    approvalStatus: 'NOT_REQUIRED',
    group: 'success',
    tag: '已完成',
    tagColor: 'success',
    description: '不可重复处理',
    nextStep: '已开通，不能重复执行',
    requestNo: 'MAIL-20240907-014',
    finishedAt: '09:02',
    allowedActions: ['viewReceipt'],
  },
  knowledge: {
    execStatus: 'SUCCEEDED',
    approvalStatus: 'NOT_REQUIRED',
    group: 'success',
    tag: '成功',
    tagColor: 'success',
    description: '不可重复处理',
    nextStep: '已开通，不能重复执行',
    requestNo: 'KB-20240907-008',
    finishedAt: '09:02',
    allowedActions: ['viewDetail'],
  },
  board: {
    execStatus: 'SUCCEEDED',
    approvalStatus: 'NOT_REQUIRED',
    group: 'success',
    tag: '成功',
    tagColor: 'success',
    description: '不可重复处理',
    nextStep: '已开通，不能重复执行',
    requestNo: 'BOARD-20240907-021',
    finishedAt: '09:02',
    allowedActions: ['viewDetail'],
  },
  design: {
    execStatus: 'FAILED',
    approvalStatus: 'NOT_REQUIRED',
    group: 'failed',
    tag: '失败',
    tagColor: 'error',
    description: '原因：无可用许可证',
    nextStep: '补充许可证后 Agent 将自动继续',
    requestNo: 'DES-20240907-005',
    finishedAt: '09:02',
    handler: '设计工具管理员',
    allowedActions: ['viewGuide', 'contactAdmin'],
  },
  dashboard: {
    execStatus: 'NOT_STARTED',
    approvalStatus: 'PENDING',
    group: 'pending',
    tag: '待审批',
    tagColor: 'warning',
    description: '审批前不得执行。审批通过后 Agent 自动继续',
    nextStep: '等待数据负责人审批，批准前不会开通',
    requestNo: 'APV-20240907-003',
    finishedAt: '09:02',
    handler: '数据负责人',
    allowedActions: ['remindEmail', 'viewApproval'],
  },
  files: {
    execStatus: 'UNKNOWN',
    approvalStatus: 'NOT_REQUIRED',
    group: 'unknown',
    tag: '结果未知',
    tagColor: 'default',
    description: '请求超时，当前无法判断是否已经开通。只能查询结果',
    nextStep: '确认结果后更新状态',
    requestNo: 'FILE-20240907-007',
    finishedAt: '09:02',
    handler: 'Agent',
    agentStatus: '正在查询最终状态',
    allowedActions: ['cancelProvision', 'manualVerify'],
  },
};

const ORDER = defaultPlanItems.map((item) => item.id);

const SUCCESS_FROM_VERIFY: SnapshotSeed = {
  execStatus: 'SUCCEEDED',
  approvalStatus: 'NOT_REQUIRED',
  group: 'success',
  tag: '成功',
  tagColor: 'success',
  description: '不可重复处理',
  nextStep: '已按人工核验标记为成功，不会重复开通',
  requestNo: 'FILE-20240907-007',
  finishedAt: '09:02',
  allowedActions: ['viewDetail'],
};

function withTarget(item: PlanItem, seed: SnapshotSeed): F01Item {
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

export function buildF01Items(
  plan: StoredPlan = loadStoredPlan(),
  filesOverride: FilesOverride = 'unknown',
): F01Item[] {
  const accountSelected = plan.selectedKeys.includes('account');
  const selected = plan.items.filter((item) => plan.selectedKeys.includes(item.id));

  return ORDER.map((id) => selected.find((item) => item.id === id))
    .filter((item): item is PlanItem => Boolean(item))
    .map((item) => {
      if (item.dependsOnAccount && !accountSelected) {
        return withTarget(item, {
          execStatus: 'BLOCKED',
          approvalStatus: 'NOT_REQUIRED',
          group: 'failed',
          tag: '失败',
          tagColor: 'error',
          description: '因公司账号未开通，本项未执行',
          nextStep: '因公司账号失败，本项未执行',
          requestNo: '尚未生成',
          allowedActions: ['viewDetail'],
        });
      }

      if (item.id === 'files' && filesOverride === 'verified') {
        return withTarget(item, SUCCESS_FROM_VERIFY);
      }

      if (item.id === 'files' && filesOverride === 'cancelled') {
        return withTarget(item, {
          execStatus: 'FAILED',
          approvalStatus: 'NOT_REQUIRED',
          group: 'failed',
          tag: '已取消',
          tagColor: 'default',
          description: '已取消该项开通，未创建新申请',
          nextStep: '不会重新提交申请',
          requestNo: 'FILE-20240907-007',
          finishedAt: '09:02',
          allowedActions: ['viewDetail'],
        });
      }

      const seed = F01_SNAPSHOT[item.id] ?? F01_SNAPSHOT.files;
      return withTarget(item, seed);
    });
}

export function f01Stats(items: F01Item[]) {
  return {
    succeeded: items.filter((item) => item.group === 'success').length,
    failed: items.filter((item) => item.group === 'failed').length,
    pending: items.filter((item) => item.group === 'pending').length,
    unknown: items.filter((item) => item.group === 'unknown').length,
    total: items.length,
  };
}

export function actionLabel(action: F01Action): string {
  switch (action) {
    case 'viewReceipt':
      return '查看回执';
    case 'viewDetail':
      return '查看详情';
    case 'viewGuide':
      return '查看如何处理';
    case 'contactAdmin':
      return '联系管理员';
    case 'viewApproval':
      return '查看审批详情';
    case 'remindEmail':
      return '邮件提醒';
    case 'cancelProvision':
      return '取消开通';
    case 'manualVerify':
      return '确认已开通';
    default:
      return '查看详情';
  }
}

export function drawerTitle(item: F01Item, action: F01Action): string {
  if (action === 'viewReceipt') {
    return `${item.name} · 回执`;
  }
  if (action === 'viewGuide') {
    return `${item.name} · 如何处理`;
  }
  if (action === 'viewApproval') {
    return `${item.name} · 审批详情`;
  }
  return `${item.name} · 详情`;
}

export interface SavedF01Result {
  savedAt: string;
  filesOverride: FilesOverride;
  closed: boolean;
  /** 整单事实始终为部分完成，禁止写成全部完成 */
  ticketStatus: 'PARTIAL_COMPLETE';
  succeeded: number;
  failed: number;
  pending: number;
  unknown: number;
  total: number;
}

export function saveF01Result(input: Omit<SavedF01Result, 'savedAt' | 'ticketStatus'>): void {
  const payload: SavedF01Result = {
    ...input,
    savedAt: new Date().toISOString(),
    ticketStatus: 'PARTIAL_COMPLETE',
  };
  sessionStorage.setItem(F01_RESULT_SAVE_KEY, JSON.stringify(payload));
}

export function markF01Closed(): void {
  sessionStorage.setItem(F01_CLOSED_KEY, '1');
}

export function isF01Closed(): boolean {
  return sessionStorage.getItem(F01_CLOSED_KEY) === '1';
}
