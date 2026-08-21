import { useEffect, useMemo, useState, type Key } from 'react';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Descriptions,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  FolderOutlined,
  HighlightOutlined,
  MailOutlined,
  ProjectOutlined,
  ReadOutlined,
  RobotOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  CONFIRM_INFO_DISMISS_KEY,
  STAGE_INDEX,
  afterConfirmText,
  employeeProfile,
  excludedItems,
  execConditionOf,
  execLaneOf,
  formatValidUntil,
  loadStoredPlan,
  markConfirmed,
  saveStoredPlan,
  type ExecLane,
  type PlanIconKey,
  type PlanItem,
} from '../mock/plan';
import FlowSteps from '../components/FlowSteps';
import './p02.css';
import './p03.css';

const { Title, Text } = Typography;

const ICON_MAP: Record<PlanIconKey, typeof BankOutlined> = {
  account: BankOutlined,
  mail: MailOutlined,
  knowledge: ReadOutlined,
  board: ProjectOutlined,
  design: HighlightOutlined,
  dashboard: BarChartOutlined,
  files: FolderOutlined,
};

const LANE_META: Record<
  ExecLane,
  { title: (count: number) => string; intro: string; icon: typeof RobotOutlined; tone: string }
> = {
  agent: {
    title: (count) => `Agent 将为你执行（${count} 项）`,
    intro: '确认后立即进入开通队列。依赖公司账号的项会等账号成功后再执行。',
    icon: RobotOutlined,
    tone: 'agent',
  },
  manual: {
    title: (count) => `需人工执行（${count} 项）`,
    intro: 'Agent 不能自动开通这些项。确认后交给对应人工角色，本页不会替你执行。',
    icon: UserSwitchOutlined,
    tone: 'manual',
  },
  audit: {
    title: (count) => `将送交人工审批（${count} 项）`,
    intro: '经理确认不是批准。这些项会进入待审批，批准前不会开通。',
    icon: AuditOutlined,
    tone: 'audit',
  },
};

function SourceBadge({ source }: { source: string }) {
  if (source === '岗位标准') {
    return <span className="p02-source-standard">{source}</span>;
  }
  if (source === '用户申请') {
    return (
      <Tag bordered={false} color="orange">
        {source}
      </Tag>
    );
  }
  if (source === 'Agent 建议') {
    return (
      <Tag bordered={false} color="purple" icon={<RobotOutlined />}>
        {source}
      </Tag>
    );
  }
  if (source === '项目需要') {
    return (
      <Tag bordered={false} color="success">
        {source}
      </Tag>
    );
  }
  return (
    <Tag bordered={false} color="default">
      {source}
    </Tag>
  );
}

function buildAlertMessage(input: {
  suggested: number;
  excluded: number;
  queued: number;
  agent: number;
  audit: number;
  manual: number;
  blocked: number;
}): string {
  const parts: string[] = [
    `上一页已审阅 ${input.suggested} 项建议、排除 ${input.excluded} 项。本页勾选将进入处理的项，默认已全选`,
  ];

  const lanes: string[] = [];
  if (input.agent > 0) {
    lanes.push(`${input.agent} 项由 Agent 执行`);
  }
  if (input.manual > 0) {
    lanes.push(`${input.manual} 项需人工执行`);
  }
  if (input.audit > 0) {
    lanes.push(`${input.audit} 项送数据负责人审批`);
  }
  if (lanes.length > 0) {
    parts[0] += `：${lanes.join('，')}`;
  }
  parts[0] += '。确认 ≠ 审批，未确认前不会开通。';

  if (input.blocked > 0) {
    parts.push(`有 ${input.blocked} 项依赖已取消的公司账号，确认后无法执行。`);
  }

  return parts.join('');
}

export default function P03Confirm() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const stored = useMemo(() => loadStoredPlan(), []);
  const items = stored.items;

  const [infoDismissed, setInfoDismissed] = useState(
    () => localStorage.getItem(CONFIRM_INFO_DISMISS_KEY) === '1',
  );
  const [submitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(stored.selectedKeys);

  useEffect(() => {
    const current = loadStoredPlan();
    saveStoredPlan({ ...current, selectedKeys });
  }, [selectedKeys]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.includes(item.id)),
    [items, selectedKeys],
  );
  const accountSelected = selectedKeys.includes('account');
  const grouped = useMemo(() => {
    const agent = items.filter((item) => execLaneOf(item) === 'agent');
    const manual = items.filter((item) => execLaneOf(item) === 'manual');
    const audit = items.filter((item) => execLaneOf(item) === 'audit');
    return { agent, manual, audit };
  }, [items]);

  const selectedIn = (rows: PlanItem[]) => rows.filter((item) => selectedKeys.includes(item.id));

  const blockedCount = selectedItems.filter(
    (item) => item.dependsOnAccount && !accountSelected,
  ).length;

  const stats = {
    queued: selectedItems.length,
    agent: selectedIn(grouped.agent).length,
    audit: selectedIn(grouped.audit).length,
    manual: selectedIn(grouped.manual).length,
  };

  const syncGroupSelection = (groupIds: string[], nextKeys: Key[]) => {
    const nextInGroup = nextKeys.map(String);
    setSelectedKeys((current) => [
      ...current.filter((key) => !groupIds.includes(key)),
      ...nextInGroup,
    ]);
  };

  const alertMessage = buildAlertMessage({
    suggested: stored.items.length,
    excluded: excludedItems.length,
    queued: stats.queued,
    agent: stats.agent,
    audit: stats.audit,
    manual: stats.manual,
    blocked: blockedCount,
  });

  const goPlan = () => {
    navigate('/plan');
  };

  const goHome = () => {
    navigate('/');
  };

  const onStepChange = (current: number) => {
    if (current === 0) {
      goHome();
      return;
    }
    if (current === 1) {
      goPlan();
      return;
    }
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dismissInfo = () => {
    setInfoDismissed(true);
    localStorage.setItem(CONFIRM_INFO_DISMISS_KEY, '1');
  };

  const restoreInfo = () => {
    setInfoDismissed(false);
    localStorage.removeItem(CONFIRM_INFO_DISMISS_KEY);
  };

  const submitConfirm = () => {
    if (selectedItems.length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      markConfirmed();
      message.success('已记录确认。可直接执行的项目已开始处理，需审批的项目已进入待审批');
      navigate('/progress', { replace: true });
    }, 400);
  };

  const columns = [
    {
      title: '项目',
      dataIndex: 'name',
      width: 168,
      ellipsis: true,
      render: (name: string, record: PlanItem) => {
        const Icon = ICON_MAP[record.icon];
        return (
          <Space size={8}>
            <Icon />
            <Text ellipsis={{ tooltip: name }}>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 140,
      render: (source: PlanItem['source']) => <SourceBadge source={source} />,
    },
    {
      title: '权限范围',
      dataIndex: 'scope',
      width: 260,
      ellipsis: true,
      render: (scope: string, record: PlanItem) => (
        <Space size={8} wrap={false}>
          <Text ellipsis={{ tooltip: scope }}>{scope}</Text>
          {stored.modifiedIds.includes(record.id) ? <Tag bordered={false}>经理已修改</Tag> : null}
        </Space>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'validUntil',
      width: 120,
      render: (value: PlanItem['validUntil']) => formatValidUntil(value),
    },
    {
      title: '执行条件',
      key: 'condition',
      width: 188,
      ellipsis: true,
      render: (_value: string, record: PlanItem) => {
        if (!selectedKeys.includes(record.id)) {
          return (
            <Text type="secondary">—</Text>
          );
        }
        const condition = execConditionOf(record, accountSelected);
        if (condition.warning || record.id === 'design' || record.execGroup === '需要审批') {
          return (
            <Tag bordered={false} color="warning">
              {condition.text}
            </Tag>
          );
        }
        return (
          <Text type="secondary" ellipsis={{ tooltip: condition.text }}>
            {condition.text}
          </Text>
        );
      },
    },
    {
      title: '确认后将',
      key: 'after',
      width: 280,
      ellipsis: true,
      render: (_value: string, record: PlanItem) => {
        const text = selectedKeys.includes(record.id)
          ? afterConfirmText(record, accountSelected)
          : '确认后不会开通此项';
        return <Text ellipsis={{ tooltip: text }}>{text}</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: PlanItem) => (
        <Space size={8} align="center" className="table-action-cell" style={{ whiteSpace: 'nowrap' }}>
          <Button
            type="link"
            disabled={submitting}
            onClick={() => navigate('/plan', { state: { editItemId: record.id } })}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const confirmDisabled = selectedItems.length === 0 || submitting;
  const confirmButton = (
    <Button type="primary" loading={submitting} disabled={confirmDisabled} onClick={submitConfirm}>
      确认方案并开始处理
    </Button>
  );

  const showManualStat = stats.manual > 0;
  const statCards = [
    {
      title: 'Agent 将执行',
      value: stats.agent,
      desc: '确认后进入开通队列',
      icon: <RobotOutlined />,
      tone: 'success',
    },
    ...(showManualStat
      ? [
          {
            title: '需人工执行',
            value: stats.manual,
            desc: '确认后交给对应人工角色',
            icon: <UserSwitchOutlined />,
            tone: 'primary',
          },
        ]
      : []),
    {
      title: '将送交审批',
      value: stats.audit,
      desc: '数据负责人；批准前不开通',
      icon: <AuditOutlined />,
      tone: 'warning',
    },
  ];

  const lanes: { key: ExecLane; rows: PlanItem[] }[] = [
    { key: 'agent', rows: grouped.agent },
    { key: 'manual', rows: grouped.manual },
    { key: 'audit', rows: grouped.audit },
  ];

  return (
    <div className="ds-page-shell p03-page">
      <FlowSteps
        current={STAGE_INDEX.confirm}
        onChange={onStepChange}
        disabledAt={(index) => submitting || index > STAGE_INDEX.confirm}
      />

      <div className="ds-page-header">
        <Space direction="vertical" size={4}>
          <Title level={4} className="ds-page-title">
            权限与执行确认
          </Title>
          <Text type="secondary">
            核对确认后将如何处理。不需要开通的项可取消勾选；要改范围请返回上一页。
            {infoDismissed ? (
              <Button type="link" onClick={restoreInfo}>
                查看说明
              </Button>
            ) : null}
          </Text>
        </Space>
        <Button type="link" className="ds-page-header-extra" onClick={goPlan} disabled={submitting}>
          返回修改方案
        </Button>
      </div>

      {!infoDismissed ? (
        <Alert
          type="info"
          showIcon
          closable
          className="ds-page-inline-alert"
          onClose={dismissInfo}
          message={alertMessage}
        />
      ) : null}

      <Card bordered={false} className="ds-page-card">
        <Space size={12} align="center" className="p02-employee-title">
          <Avatar size={32} icon={<UserOutlined />} style={{ background: 'var(--color-primary)' }} />
          <Title level={5} className="p02-employee-name">
            {employeeProfile.name}
          </Title>
        </Space>
        <Descriptions
          size="small"
          column={3}
          items={[
            { key: 'role', label: '岗位', children: employeeProfile.role },
            { key: 'dept', label: '部门', children: employeeProfile.department },
            { key: 'manager', label: '直属经理', children: employeeProfile.manager },
            { key: 'hire', label: '入职日期', children: employeeProfile.hireDate },
            { key: 'project', label: '参与项目', children: employeeProfile.project },
            { key: 'until', label: '项目参与截止', children: employeeProfile.projectUntil },
          ]}
        />
      </Card>

      <div className={`p03-stat-grid${showManualStat ? ' is-three' : ''}`}>
        {statCards.map((card) => (
          <Card bordered={false} className="ds-statistic-card" key={card.title}>
            <div className="p02-stat">
              <div className={`p02-stat-icon is-${card.tone}`}>{card.icon}</div>
              <div className="p02-stat-copy">
                <div className="p02-stat-title">{card.title}</div>
                <div className="p02-stat-value-row">
                  <span className="p02-stat-value">{card.value}</span>
                  <span className="p02-stat-suffix">项</span>
                </div>
                <div className="p02-stat-desc">{card.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {lanes.map((lane) => {
        if (lane.rows.length === 0) {
          return null;
        }
        const meta = LANE_META[lane.key];
        const Icon = meta.icon;
        return (
          <Card bordered={false} className="ds-page-card ds-table-card-padded" key={lane.key}>
            <div className="ds-card-title-row">
              <div className="p03-lane-heading">
                <div className="p03-lane-title">
                  <Icon className={`p03-lane-icon is-${meta.tone}`} />
                  <span className="ds-table-title">{meta.title(selectedIn(lane.rows).length)}</span>
                </div>
                <Text type="secondary">{meta.intro}</Text>
              </div>
            </div>
            <Table<PlanItem>
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              rowClassName={(record: PlanItem) => (selectedKeys.includes(record.id) ? undefined : 'p02-muted')}
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys: Key[]) =>
                  syncGroupSelection(
                    lane.rows.map((item) => item.id),
                    keys,
                  ),
                columnWidth: 48,
                getCheckboxProps: (record: PlanItem) => ({
                  'aria-label': `选择${record.name}`,
                  disabled: submitting,
                }),
              }}
              columns={columns}
              dataSource={lane.rows}
              scroll={{ x: 1284 }}
            />
          </Card>
        );
      })}

      <div className="p02-footer">
        <Space size={8}>
          <Button onClick={goPlan} disabled={submitting}>
            返回修改方案
          </Button>
          {selectedItems.length === 0 ? (
            <Tooltip title="请至少勾选一项将执行的权限">
              <span>{confirmButton}</span>
            </Tooltip>
          ) : (
            confirmButton
          )}
        </Space>
      </div>
    </div>
  );
}
