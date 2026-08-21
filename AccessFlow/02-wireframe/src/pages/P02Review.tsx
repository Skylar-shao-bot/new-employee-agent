import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Modal,
  Radio,
  Select,
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
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  FolderOutlined,
  HighlightOutlined,
  MailOutlined,
  ProjectOutlined,
  ReadOutlined,
  RobotOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import {
  INFO_DISMISS_KEY,
  STAGE_INDEX,
  employeeProfile,
  excludedItems,
  formatValidUntil,
  loadStoredPlan,
  saveStoredPlan,
  type ExcludedItem,
  type PlanIconKey,
  type PlanItem,
} from '../mock/plan';
import FlowSteps from '../components/FlowSteps';
import './p02.css';

const { Title, Text } = Typography;

const PROJECT_DEADLINE = dayjs('2024-12-31');

const ICON_MAP: Record<PlanIconKey, typeof BankOutlined> = {
  account: BankOutlined,
  mail: MailOutlined,
  knowledge: ReadOutlined,
  board: ProjectOutlined,
  design: HighlightOutlined,
  dashboard: BarChartOutlined,
  files: FolderOutlined,
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

export default function P02Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const initial = useMemo(() => loadStoredPlan(), []);

  const [items, setItems] = useState<PlanItem[]>(initial.items);
  const [modifiedIds, setModifiedIds] = useState<string[]>(initial.modifiedIds);
  const [infoDismissed, setInfoDismissed] = useState(
    () => localStorage.getItem(INFO_DISMISS_KEY) === '1',
  );
  const [revalidating, setRevalidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [drawerDirty, setDrawerDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const validMode = Form.useWatch('validMode', form);
  const blocker = useBlocker(drawerDirty);

  useEffect(() => {
    const current = loadStoredPlan();
    saveStoredPlan({ items, selectedKeys: current.selectedKeys, modifiedIds });
  }, [items, modifiedIds]);

  useEffect(() => {
    const editItemId = (location.state as { editItemId?: string } | null)?.editItemId;
    if (!editItemId) {
      return;
    }
    const record = items.find((item) => item.id === editItemId);
    if (record) {
      setEditing(record);
      setDrawerDirty(false);
      form.setFieldsValue({
        scope: record.scope,
        validMode: record.validUntil === '长期' ? '长期' : 'date',
        validDate: record.validUntil === '长期' ? PROJECT_DEADLINE : dayjs(record.validUntil),
      });
    }
    navigate('.', { replace: true, state: {} });
  }, [form, items, location.state, navigate]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeaveOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (!drawerDirty) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [drawerDirty]);

  const directItems = useMemo(
    () => items.filter((item) => item.execGroup === '可直接执行'),
    [items],
  );
  const approvalItems = useMemo(
    () => items.filter((item) => item.execGroup === '需要审批'),
    [items],
  );

  const stats = useMemo(
    () => ({
      suggested: items.length,
      direct: directItems.length,
      approval: approvalItems.length,
      excluded: excludedItems.length,
    }),
    [items.length, directItems.length, approvalItems.length],
  );

  const openEdit = (record: PlanItem) => {
    setEditing(record);
    setDrawerDirty(false);
    form.setFieldsValue({
      scope: record.scope,
      validMode: record.validUntil === '长期' ? '长期' : 'date',
      validDate: record.validUntil === '长期' ? PROJECT_DEADLINE : dayjs(record.validUntil),
    });
  };

  const closeDrawer = () => {
    setEditing(null);
    setDrawerDirty(false);
    form.resetFields();
  };

  const requestCloseDrawer = () => {
    if (drawerDirty) {
      setLeaveOpen(true);
      return;
    }
    closeDrawer();
  };

  const abandonLeave = () => {
    setLeaveOpen(false);
    closeDrawer();
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const stayEditing = () => {
    setLeaveOpen(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const saveEdit = async () => {
    if (!editing) {
      return;
    }
    const values = await form.validateFields();
    if (!editing.scopeOptions.includes(values.scope)) {
      form.setFields([
        {
          name: 'scope',
          errors: ['超出允许范围，已恢复为规则上限'],
        },
      ]);
      form.setFieldValue('scope', editing.scope);
      return;
    }
    if (values.validMode === 'date' && values.validDate?.isAfter(PROJECT_DEADLINE, 'day')) {
      form.setFields([
        {
          name: 'validDate',
          errors: ['有效期不能晚于项目参与截止日'],
        },
      ]);
      return;
    }

    setRevalidating(true);
    window.setTimeout(() => {
      const nextValid: PlanItem['validUntil'] =
        values.validMode === '长期' && editing.allowsLongTerm ? '长期' : '2024-12-31';
      setItems((current) =>
        current.map((item) =>
          item.id === editing.id
            ? { ...item, scope: values.scope, validUntil: nextValid }
            : item,
        ),
      );
      setModifiedIds((current) =>
        current.includes(editing.id) ? current : [...current, editing.id],
      );
      setRevalidating(false);
      closeDrawer();
      message.success('已按你的修改更新方案');
    }, 400);
  };

  const goConfirm = () => {
    if (revalidating) {
      return;
    }
    const current = loadStoredPlan();
    saveStoredPlan({ items, selectedKeys: current.selectedKeys, modifiedIds });
    setConfirming(true);
    navigate('/confirm');
  };

  const goHome = () => {
    navigate('/');
  };

  const onStepChange = (current: number) => {
    if (current === 0) {
      goHome();
      return;
    }
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dismissInfo = () => {
    setInfoDismissed(true);
    localStorage.setItem(INFO_DISMISS_KEY, '1');
  };

  const restoreInfo = () => {
    setInfoDismissed(false);
    localStorage.removeItem(INFO_DISMISS_KEY);
  };

  const remarkOf = (record: PlanItem): { text: string; warning?: boolean } => {
    return { text: record.remark };
  };

  const planColumns = [
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
      width: 280,
      ellipsis: true,
      render: (scope: string, record: PlanItem) => (
        <Space size={8} wrap={false}>
          <Text ellipsis={{ tooltip: scope }}>{scope}</Text>
          {modifiedIds.includes(record.id) ? <Tag bordered={false}>经理已修改</Tag> : null}
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
      title: '状态',
      dataIndex: 'execGroup',
      width: 128,
      render: (_: PlanItem['execGroup'], record: PlanItem) => (
        <Tag bordered={false} color={record.execGroup === '需要审批' ? 'warning' : 'success'}>
          {record.execGroup}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 168,
      ellipsis: true,
      render: (_: string, record: PlanItem) => {
        const remark = remarkOf(record);
        if (remark.text === '—') {
          return '—';
        }
        if (remark.warning) {
          return (
            <Tag bordered={false} color="warning">
              {remark.text}
            </Tag>
          );
        }
        return (
          <Text type="secondary" ellipsis={{ tooltip: remark.text }}>
            {remark.text}
          </Text>
        );
      },
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      width: 112,
      render: (approver: string) => (
        <span aria-label={approver === '—' ? '无需审批人' : approver}>{approver}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: PlanItem) => (
        <Space size={8} align="center" className="table-action-cell" style={{ whiteSpace: 'nowrap' }}>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const excludedColumns = [
    { title: '项目', dataIndex: 'name', width: 148, ellipsis: true },
    {
      title: '来源',
      dataIndex: 'source',
      width: 148,
      render: (source: string) => <SourceBadge source={source} />,
    },
    {
      title: '说明',
      dataIndex: 'reason',
      width: 260,
      ellipsis: true,
      render: (reason: string) => <Text ellipsis={{ tooltip: reason }}>{reason}</Text>,
    },
    {
      title: '排除依据',
      dataIndex: 'basis',
      width: 200,
      ellipsis: true,
      render: (basis: string) => <Text ellipsis={{ tooltip: basis }}>{basis}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 128,
      fixed: 'right' as const,
      render: (_: unknown, record: ExcludedItem) => (
        <Space size={8} align="center" className="table-action-cell" style={{ whiteSpace: 'nowrap' }}>
          <Button
            type="link"
            onClick={() =>
              setExpandedKeys((current) =>
                current.includes(record.id)
                  ? current.filter((id) => id !== record.id)
                  : [...current, record.id],
              )
            }
          >
            查看排除依据
          </Button>
        </Space>
      ),
    },
  ];

  const confirmDisabled = revalidating;
  const confirmButton = (
    <Button type="primary" loading={confirming || revalidating} disabled={confirmDisabled} onClick={goConfirm}>
      继续确认执行
    </Button>
  );

  const statCards = [
    {
      title: '建议开通',
      value: stats.suggested,
      desc: '将进入确认的方案项',
      icon: <FileProtectOutlined />,
      tone: 'primary',
    },
    {
      title: '可直接执行',
      value: stats.direct,
      desc: '无需额外审批',
      icon: <CheckCircleOutlined />,
      tone: 'success',
    },
    {
      title: '需要审批',
      value: stats.approval,
      desc: '数据负责人',
      icon: <AuditOutlined />,
      tone: 'warning',
    },
    {
      title: '不应开通',
      value: stats.excluded,
      desc: '历史特殊权限',
      icon: <StopOutlined />,
      tone: 'error',
    },
  ];

  return (
    <div className="ds-page-shell p02-page">
      <FlowSteps
        current={STAGE_INDEX.plan}
        onChange={onStepChange}
        disabledAt={(index) => index > STAGE_INDEX.plan}
      />

      <div className="ds-page-header">
        <Space direction="vertical" size={4}>
          <Title level={4} className="ds-page-title">
            开通方案审阅
          </Title>
          <Text type="secondary">
            审阅 Agent 刚生成的方案。确认后才会开始开通，现在不会创建账号。
            {infoDismissed ? (
              <Button type="link" onClick={restoreInfo}>
                查看说明
              </Button>
            ) : null}
          </Text>
        </Space>
      </div>

      {!infoDismissed ? (
        <Alert
          type="info"
          showIcon
          closable
          className="ds-page-inline-alert"
          onClose={dismissInfo}
          message={
            revalidating
              ? '正在根据你的修改重新校验'
              : '已生成建议方案；请审阅后点击「继续确认执行」。未确认前不会创建任何账号或权限。'
          }
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

      <div className="p02-stat-grid">
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

      {directItems.length > 0 ? (
        <Card bordered={false} className="ds-page-card ds-table-card-padded">
          <div className="ds-card-title-row">
            <span className="ds-table-title">可直接执行（{directItems.length} 项）</span>
          </div>
          <Table<PlanItem>
            rowKey="id"
            size="middle"
            pagination={false}
            loading={revalidating}
            tableLayout="fixed"
            columns={planColumns}
            dataSource={directItems}
            scroll={{ x: 1216 }}
          />
        </Card>
      ) : null}

      {approvalItems.length > 0 ? (
        <Card bordered={false} className="ds-page-card ds-table-card-padded">
          <div className="ds-card-title-row">
            <span className="ds-table-title">需要审批（{approvalItems.length} 项）</span>
          </div>
          <Table<PlanItem>
            rowKey="id"
            size="middle"
            pagination={false}
            loading={revalidating}
            tableLayout="fixed"
            columns={planColumns}
            dataSource={approvalItems}
            scroll={{ x: 1216 }}
          />
        </Card>
      ) : null}

      <Card bordered={false} className="ds-page-card ds-table-card-padded">
        <div className="ds-card-title-row">
          <Space size={8}>
            <ExclamationCircleOutlined className="p02-exclude-icon" />
            <span className="ds-table-title">不应开通的权限（{excludedItems.length} 项）</span>
          </Space>
        </div>
        <Table<ExcludedItem>
          rowKey="id"
          size="middle"
          pagination={false}
          tableLayout="fixed"
          columns={excludedColumns}
          dataSource={excludedItems}
          scroll={{ x: 884 }}
          expandable={{
            expandedRowKeys: expandedKeys,
            expandIcon: () => null,
            expandedRowRender: (record: ExcludedItem) => <Text type="secondary">{record.detail}</Text>,
          }}
        />
      </Card>

      <div className="p02-footer">
        <Space size={8}>
          <Button onClick={goHome}>返回</Button>
          {confirmDisabled ? (
            <Tooltip title="正在根据你的修改重新校验">
              <span>{confirmButton}</span>
            </Tooltip>
          ) : (
            confirmButton
          )}
        </Space>
      </div>

      <Drawer
        open={Boolean(editing)}
        width={560}
        onClose={requestCloseDrawer}
        closable={false}
        title={null}
        styles={{
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          },
        }}
      >
        <div className="p02-drawer-header">
          <Space size={8} align="center">
            <Button type="text" icon={<CloseOutlined />} onClick={requestCloseDrawer} aria-label="关闭" />
            <span className="p02-drawer-title">编辑权限项 · {editing?.name}</span>
          </Space>
          <Space size={8}>
            <Button onClick={requestCloseDrawer}>取消</Button>
            <Button type="primary" loading={revalidating} onClick={() => void saveEdit()}>
              保存并校验
            </Button>
          </Space>
        </div>
        <div className="p02-drawer-body">
          <Form
            form={form}
            layout="vertical"
            requiredMark
            onValuesChange={() => setDrawerDirty(true)}
          >
            <Form.Item name="scope" label="权限范围" rules={[{ required: true, message: '请选择权限范围' }]}>
              <Select options={editing?.scopeOptions.map((value) => ({ label: value, value }))} />
            </Form.Item>
            <Form.Item name="validMode" label="有效期">
              <Radio.Group>
                {editing?.allowsLongTerm ? <Radio value="长期">长期</Radio> : null}
                <Radio value="date">指定日期</Radio>
              </Radio.Group>
            </Form.Item>
            {validMode === 'date' ? (
              <Form.Item name="validDate" label="截止日">
                <DatePicker
                  style={{ width: 328 }}
                  disabledDate={(date: Dayjs) => date.isAfter(PROJECT_DEADLINE, 'day')}
                />
              </Form.Item>
            ) : null}
            <Form.Item label="审批人">
              <Text>{editing?.approver === '—' ? '由权限规则指定，本期无需审批人' : editing?.approver}</Text>
            </Form.Item>
            <Form.Item label="来源">
              {editing ? <SourceBadge source={editing.source} /> : null}
            </Form.Item>
          </Form>
        </div>
      </Drawer>

      <Modal
        title="放弃未保存的修改？"
        open={leaveOpen}
        centered
        width={480}
        onCancel={stayEditing}
        footer={
          <Space size={8}>
            <Button onClick={abandonLeave}>放弃修改</Button>
            <Button type="primary" onClick={stayEditing}>
              继续编辑
            </Button>
          </Space>
        }
      >
        方案尚未确认。要放弃未保存的修改吗？
      </Modal>
    </div>
  );
}
