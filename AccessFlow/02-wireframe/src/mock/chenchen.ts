export const DEMO_REQUEST =
  '9月7日，陈晨将作为软件产品设计师加入上海产品研发部，参与 Atlas 项目。请参考同岗位员工，在第一天 9:00 前把公司账号、日常工具和项目权限准备好，尽量别反复问我。';

export const REQUEST_PLACEHOLDER =
  '请描述新员工需要开通的权限，注意说清楚姓名、入职部门和日期、参与项目等信息。';

export const ANALYZE_STEPS = [
  '正在核对陈晨的人事信息',
  '已匹配软件产品设计师岗位模板',
  '已读取 Atlas 项目权限规则',
  '已发现 2 项同岗位历史特殊权限，未纳入默认方案',
  '已生成开通方案',
] as const;

export type ResumeTicketStatus = 'IN_PROGRESS' | 'NEEDS_ATTENTION' | 'PARTIAL_COMPLETE';

export interface ResumeTicket {
  employeeName: string;
  role: string;
  department: string;
  status: ResumeTicketStatus;
  doneCount: number;
  totalCount: number;
  pendingApproval: number;
  needsAttention: number;
  unknownResult: number;
}

export const resumeTicket: ResumeTicket = {
  employeeName: '陈晨',
  role: '软件产品设计师',
  department: '上海产品研发部',
  status: 'NEEDS_ATTENTION',
  doneCount: 4,
  totalCount: 7,
  pendingApproval: 1,
  needsAttention: 1,
  unknownResult: 1,
};

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
}

export const notifications: NotificationItem[] = [
  {
    id: 'n1',
    title: '1 项待审批',
    description: '陈晨的产品数据看板等待数据负责人确认',
  },
  {
    id: 'n2',
    title: '1 项需要处理',
    description: '设计工具无可用许可证，需转工具管理员',
  },
];
