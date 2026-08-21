export const STAGE_STEP_BASE = [
  { title: '新建开通' },
  { title: '开通方案审阅' },
  { title: '权限与执行确认' },
] as const;

/** 第四步随阶段变化：执行中显示「执行进度」，收口后显示「执行结果」 */
export type StageTail = 'progress' | 'result';

export function stageSteps(tail: StageTail = 'progress') {
  return [
    ...STAGE_STEP_BASE,
    { title: tail === 'result' ? '执行结果' : '执行进度' },
  ];
}

/** @deprecated 使用 stageSteps('progress' | 'result')；保留兼容旧引用 */
export const STAGE_STEPS = stageSteps('progress');

export const STAGE_INDEX = {
  home: 0,
  plan: 1,
  confirm: 2,
  execution: 3,
} as const;

export const employeeProfile = {
  name: '陈晨',
  employeeNo: 'EMP-20260907-018',
  role: '软件产品设计师',
  department: '上海产品研发部',
  manager: '王璐',
  hireDate: '9 月 7 日',
  project: 'Atlas',
  projectUntil: '12 月 31 日',
} as const;

export type PlanSource = '岗位标准' | '用户申请' | 'Agent 建议' | '项目需要';
export type PlanExecGroup = '可直接执行' | '需要审批';
export type PlanIconKey =
  | 'account'
  | 'mail'
  | 'knowledge'
  | 'board'
  | 'design'
  | 'dashboard'
  | 'files';

export interface PlanItem {
  id: string;
  name: string;
  icon: PlanIconKey;
  source: PlanSource;
  scope: string;
  scopeOptions: string[];
  approver: string;
  validUntil: '长期' | '2024-12-31';
  allowsLongTerm: boolean;
  execGroup: PlanExecGroup;
  remark: string;
  dependsOnAccount?: boolean;
}

export const defaultPlanItems: PlanItem[] = [
  {
    id: 'account',
    name: '公司账号',
    icon: 'account',
    source: '岗位标准',
    scope: '标准员工账号',
    scopeOptions: ['标准员工账号'],
    approver: '—',
    validUntil: '长期',
    allowsLongTerm: true,
    execGroup: '可直接执行',
    remark: '经理确认后创建',
  },
  {
    id: 'mail',
    name: '邮件与即时通信',
    icon: 'mail',
    source: '岗位标准',
    scope: '普通成员',
    scopeOptions: ['普通成员'],
    approver: '—',
    validUntil: '长期',
    allowsLongTerm: true,
    execGroup: '可直接执行',
    remark: '需先创建公司账号',
    dependsOnAccount: true,
  },
  {
    id: 'knowledge',
    name: '知识库',
    icon: 'knowledge',
    source: '岗位标准',
    scope: '全员内容只读',
    scopeOptions: ['全员内容只读'],
    approver: '—',
    validUntil: '长期',
    allowsLongTerm: true,
    execGroup: '可直接执行',
    remark: '需先创建公司账号',
    dependsOnAccount: true,
  },
  {
    id: 'board',
    name: 'Atlas 项目看板',
    icon: 'board',
    source: '用户申请',
    scope: '项目成员；可编辑任务，不可管理项目',
    scopeOptions: ['只读', '项目成员；可编辑任务，不可管理项目'],
    approver: '—',
    validUntil: '2024-12-31',
    allowsLongTerm: false,
    execGroup: '可直接执行',
    remark: '—',
  },
  {
    id: 'design',
    name: '设计工具',
    icon: 'design',
    source: 'Agent 建议',
    scope: 'Atlas 团队编辑者',
    scopeOptions: ['只读', 'Atlas 团队编辑者'],
    approver: '—',
    validUntil: '2024-12-31',
    allowsLongTerm: false,
    execGroup: '可直接执行',
    remark: '—',
  },
  {
    id: 'dashboard',
    name: '产品数据看板',
    icon: 'dashboard',
    source: '用户申请',
    scope: '只读、不可导出',
    scopeOptions: ['只读、不可导出'],
    approver: '数据负责人',
    validUntil: '2024-12-31',
    allowsLongTerm: false,
    execGroup: '需要审批',
    remark: '—',
  },
  {
    id: 'files',
    name: 'Atlas 项目文件库',
    icon: 'files',
    source: '项目需要',
    scope: '项目目录读写；不含客户原始资料目录',
    scopeOptions: ['项目目录只读', '项目目录读写；不含客户原始资料目录'],
    approver: '—',
    validUntil: '2024-12-31',
    allowsLongTerm: false,
    execGroup: '可直接执行',
    remark: '—',
  },
];

export interface ExcludedItem {
  id: string;
  name: string;
  source: string;
  reason: string;
  basis: string;
  detail: string;
}

export const excludedItems: ExcludedItem[] = [
  {
    id: 'export',
    name: '客户数据导出',
    source: '同岗位历史权限',
    reason: '同岗位历史工作需要，不属于岗位标准，未纳入默认方案',
    basis: '最小权限：不能照搬同岗位历史特殊权限',
    detail: '不能因为同岗位有过特殊权限，就给陈晨开通同样权限。规则：最小权限 / 岗位标准。',
  },
  {
    id: 'prod-admin',
    name: '生产系统管理',
    source: '同岗位历史权限',
    reason: '同岗位历史工作需要，不属于岗位标准，未纳入默认方案',
    basis: '最小权限：不能照搬同岗位历史特殊权限',
    detail: '不能因为同岗位有过特殊权限，就给陈晨开通同样权限。规则：最小权限 / 岗位标准。',
  },
];

export const PLAN_STORAGE_KEY = 'accessflow.p02.plan.v4';
export const INFO_DISMISS_KEY = 'accessflow.p02.infoDismissed';
export const CONFIRM_INFO_DISMISS_KEY = 'accessflow.p03.infoDismissed';
export const CONFIRMED_KEY = 'accessflow.p03.confirmed';

export type ExecLane = 'agent' | 'audit' | 'manual';

export function execLaneOf(item: PlanItem): ExecLane {
  if (item.execGroup === '需要审批') {
    return 'audit';
  }
  return 'agent';
}

export function execConditionOf(
  item: PlanItem,
  accountSelected: boolean,
): { text: string; warning?: boolean } {
  if (item.dependsOnAccount && !accountSelected) {
    return { text: '依赖公司账号，取消后无法执行', warning: true };
  }
  if (item.id === 'design') {
    return { text: '需可用许可证' };
  }
  if (item.dependsOnAccount) {
    return { text: '需先创建公司账号' };
  }
  if (item.execGroup === '需要审批') {
    return { text: '数据负责人审批' };
  }
  return { text: '条件已满足' };
}

export function afterConfirmText(item: PlanItem, accountSelected: boolean): string {
  if (item.dependsOnAccount && !accountSelected) {
    return '确认后无法执行，不会创建该项';
  }
  switch (item.id) {
    case 'account':
      return 'Agent 立即创建标准员工账号';
    case 'mail':
      return '等账号成功后，由 Agent 开通普通成员';
    case 'knowledge':
      return '等账号成功后，由 Agent 开通全员只读';
    case 'board':
      return 'Agent 按项目成员开通，不可管理项目';
    case 'design':
      return 'Agent 先检查许可证再开通；不足则转工具管理员';
    case 'dashboard':
      return '提交给数据负责人；批准前不会开通';
    case 'files':
      return 'Agent 开通项目目录读写，不含客户原始资料';
    default:
      return '确认后进入处理队列';
  }
}

export interface StoredPlan {
  selectedKeys: string[];
  items: PlanItem[];
  modifiedIds: string[];
}

export function loadStoredPlan(): StoredPlan {
  try {
    const raw = sessionStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) {
      return createDefaultPlan();
    }
    const parsed = JSON.parse(raw) as StoredPlan;
    if (!Array.isArray(parsed.selectedKeys) || !Array.isArray(parsed.items)) {
      return createDefaultPlan();
    }
    return parsed;
  } catch {
    return createDefaultPlan();
  }
}

export function saveStoredPlan(plan: StoredPlan): void {
  sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
}

export function createDefaultPlan(): StoredPlan {
  return {
    selectedKeys: defaultPlanItems.map((item) => item.id),
    items: defaultPlanItems.map((item) => ({ ...item })),
    modifiedIds: [],
  };
}

export function hasConfirmed(): boolean {
  return sessionStorage.getItem(CONFIRMED_KEY) === '1';
}

export function markConfirmed(): void {
  sessionStorage.setItem(CONFIRMED_KEY, '1');
}

export function clearConfirmed(): void {
  sessionStorage.removeItem(CONFIRMED_KEY);
}

export function formatValidUntil(value: PlanItem['validUntil']): string {
  if (value === '长期') {
    return '长期';
  }
  return '至 12 月 31 日';
}
