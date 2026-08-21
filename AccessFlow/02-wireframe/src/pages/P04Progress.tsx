import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Modal,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  BankOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  FileTextOutlined,
  FolderOutlined,
  HighlightOutlined,
  MailOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  ProjectOutlined,
  ReadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  STAGE_INDEX,
  formatValidUntil,
  loadStoredPlan,
  type PlanIconKey,
} from '../mock/plan';
import { useNavigate } from 'react-router-dom';
import {
  PROGRESS_F01_TICK,
  PROGRESS_INFO_DISMISS_KEY,
  PROGRESS_TICK_MS,
  approvalLabel,
  buildProgressItems,
  formatClock,
  formatElapsed,
  isF01Ready,
  primaryActionLabel,
  progressCase,
  progressStats,
  type FilesOverride,
  type ProgressAction,
  type ProgressGroup,
  type ProgressItem,
} from '../mock/progress';
import FlowSteps from '../components/FlowSteps';
import agentHeroPoster from '../assets/agent-hero.png';
import agentHeroVideo from '../assets/agent-hero.mp4';
import agentHeroVideoAlpha from '../assets/agent-hero.webm';
import './p02.css';
import './p04.css';
import './p05.css';

const { Title, Text } = Typography;

const FLOATING_LAYER = {
  detailDrawer: 480,
} as const;

const ICON_MAP: Record<PlanIconKey, typeof BankOutlined> = {
  account: BankOutlined,
  mail: MailOutlined,
  knowledge: ReadOutlined,
  board: ProjectOutlined,
  design: HighlightOutlined,
  dashboard: BarChartOutlined,
  files: FolderOutlined,
};

const FOLLOW_ON_GROUPS: {
  key: ProgressGroup;
  title: string;
  extra?: string;
}[] = [
  {
    key: 'queue',
    title: '执行队列',
    extra: '完成后将自动执行',
  },
  { key: 'pendingStart', title: '尚未开始' },
];

const EXCEPTION_GROUPS: {
  key: ProgressGroup;
  title: string;
  extra?: string;
}[] = [
  {
    key: 'attention',
    title: '需要处理',
    extra: '需要你或对应角色介入',
  },
  {
    key: 'blocked',
    title: '被阻塞',
    extra: '依赖未满足，暂不能执行',
  },
];

interface MetaField {
  label: string;
  value: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function RunningAgentMark() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [useStill, setUseStill] = useState(() =>
    typeof window !== 'undefined' ? prefersReducedMotion() : false,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      const reduce = media.matches;
      setUseStill(reduce);
      const video = videoRef.current;
      if (!video) {
        return;
      }
      if (reduce) {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        setUseStill(true);
      });
    };
    syncMotion();
    media.addEventListener('change', syncMotion);
    return () => media.removeEventListener('change', syncMotion);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="p04-agent-wrap">
      {useStill ? (
        <img
          className="p04-agent"
          src={agentHeroPoster}
          alt="AccessFlow Agent"
          onError={() => setVisible(false)}
        />
      ) : (
        <video
          ref={videoRef}
          className="p04-agent"
          poster={agentHeroPoster}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controls={false}
          aria-label="AccessFlow Agent 正在执行"
          onError={() => setUseStill(true)}
        >
          <source src={agentHeroVideoAlpha} type="video/webm" />
          <source src={agentHeroVideo} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

function itemTone(item: ProgressItem): string {
  if (item.group === 'running') {
    return 'running';
  }
  if (item.group === 'waiting') {
    return 'waiting';
  }
  if (item.group === 'blocked' || item.group === 'attention' || item.group === 'done') {
    return item.group;
  }
  return 'plain';
}

function metaFields(item: ProgressItem, elapsed: number): MetaField[] {
  if (item.group === 'running') {
    return [
      { label: '开始时间', value: item.startedAt ?? '—' },
      { label: '已耗时', value: formatElapsed(elapsed) },
    ];
  }
  if (item.group === 'waiting') {
    return [
      { label: '当前处理人', value: item.handler ?? '—' },
      { label: '提交时间', value: item.submittedAt ?? '—' },
    ];
  }
  if (item.group === 'done') {
    return [{ label: '完成时间', value: item.meta?.replace('完成时间 ', '') ?? '—' }];
  }
  return [];
}

function ProgressItemCard({
  item,
  elapsed,
  onOpen,
  onAction,
}: {
  item: ProgressItem;
  elapsed: number;
  onOpen: (item: ProgressItem) => void;
  onAction: (item: ProgressItem, action: ProgressAction) => void;
}) {
  const ItemIcon = ICON_MAP[item.icon];
  const fields = metaFields(item, elapsed);
  const actions = item.allowedActions;
  const tone = itemTone(item);
  const failed = item.execStatus === 'FAILED';
  const unknown = item.execStatus === 'UNKNOWN';
  const attention = item.group === 'attention';
  const compact = typeof item.percent !== 'number' && !attention;
  const hasMeta = fields.length > 0;

  return (
    <div
      className={`p04-item is-${tone}${compact ? ' is-compact' : ''}${hasMeta ? ' has-meta' : ''}`}
      onClick={() => onOpen(item)}
    >
      <ItemIcon className={`p04-item-icon is-${item.icon}`} />
      <span className="p04-item-main">
        <span className="p04-item-title">
          <Text strong>{item.name}</Text>
          <Tag bordered={false} color={item.tagColor}>
            {item.tag}
          </Tag>
        </span>
        <Text
          type={failed ? 'danger' : 'secondary'}
          className={`p04-item-desc${failed ? ' is-failed' : ''}${unknown ? ' is-unknown' : ''}`}
        >
          {item.description}
        </Text>
        {attention ? (
          <Text className="p04-item-next">
            <span className="p04-item-next-label">备注</span>
            {item.nextStep}
          </Text>
        ) : null}
        {typeof item.percent === 'number' ? (
          <Progress className="p04-item-progress" percent={item.percent} size="small" />
        ) : null}
      </span>
      {fields.length > 0 ? (
        <span className={`p04-item-meta${fields.length === 1 ? ' is-single' : ''}`}>
          {fields.map((field) => (
            <span className="p04-meta-field" key={field.label}>
              <span className="p04-meta-label">{field.label}</span>
              <span className="p04-meta-value">{field.value}</span>
            </span>
          ))}
        </span>
      ) : null}
      <span className="p04-item-action">
        {actions.length > 0 ? (
          <span className={`p05-item-actions${actions.length > 1 ? ' is-stack' : ''}`}>
            {actions.map((action, index) => (
              <Typography.Link
                key={action}
                onClick={(event: MouseEvent) => {
                  event.stopPropagation();
                  onAction(item, action);
                }}
              >
                {primaryActionLabel(item, action)}
                {index === 0 && actions.length === 1 ? <RightOutlined /> : null}
              </Typography.Link>
            ))}
          </span>
        ) : (
          <RightOutlined className="p04-item-chevron" />
        )}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  extra,
  trailing,
  agent,
  children,
}: {
  title: string;
  extra?: string;
  trailing?: ReactNode;
  agent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card bordered={false} className="ds-page-card">
      <div className="ds-card-title-row">
        <div className="p04-card-heading">
          {agent}
          <span className="ds-table-title">{title}</span>
          {extra ? <Text type="secondary">{extra}</Text> : null}
        </div>
        {trailing}
      </div>
      {children}
    </Card>
  );
}

function GroupBlock({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: string;
  children: ReactNode;
}) {
  return (
    <div className="p04-group">
      <div className="p04-group-title">
        <Text className="p04-group-label">{title}</Text>
        {extra ? <Text type="secondary">{extra}</Text> : null}
      </div>
      <div className="p04-item-stack">{children}</div>
    </div>
  );
}

export default function P04Progress() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const plan = useMemo(() => loadStoredPlan(), []);
  const [tick, setTick] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [filesOverride, setFilesOverride] = useState<FilesOverride>('unknown');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const items = useMemo(
    () => buildProgressItems(plan, tick, filesOverride),
    [plan, tick, filesOverride],
  );

  const [elapsed, setElapsed] = useState(48);
  const [updatedAt, setUpdatedAt] = useState('今天 09:03:03');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [infoDismissed, setInfoDismissed] = useState(
    () => localStorage.getItem(PROGRESS_INFO_DISMISS_KEY) === '1',
  );
  const [showDone, setShowDone] = useState(false);
  const [detail, setDetail] = useState<ProgressItem | null>(null);
  const [querying, setQuerying] = useState(false);

  useEffect(() => {
    if (isF01Ready(tick)) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setTick((value) => Math.min(value + 1, PROGRESS_F01_TICK));
    }, PROGRESS_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [tick]);

  useEffect(() => {
    if (!isF01Ready(tick) || leaving) {
      return undefined;
    }
    setLeaving(true);
    const timer = window.setTimeout(() => {
      message.info('执行结果已更新');
      navigate('/f01', { replace: true, state: { fromProgress: true } });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [tick, leaving, message, navigate]);

  useEffect(() => {
    if (!detail) {
      return;
    }
    const next = items.find((item) => item.id === detail.id);
    if (next && next !== detail) {
      setDetail(next);
    }
  }, [items, detail]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUpdatedAt(`今天 ${formatClock(new Date())}`);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo(() => progressStats(items), [items]);
  const doneItems = items.filter((item) => item.group === 'done');
  const waitingItems = items.filter((item) => item.group === 'waiting');
  const runningItems = items.filter((item) => item.group === 'running');
  const hasRunning = runningItems.length > 0;
  const showCompleted = hasRunning ? showDone : doneItems.length > 0;
  const followOnGroups = FOLLOW_ON_GROUPS.map((meta) => ({
    ...meta,
    rows: items.filter((item) => item.group === meta.key),
  })).filter((group) => group.rows.length > 0);
  const exceptionGroups = EXCEPTION_GROUPS.map((meta) => ({
    ...meta,
    rows: items.filter((item) => item.group === meta.key),
  })).filter((group) => group.rows.length > 0);

  const f01Ready = isF01Ready(tick);
  const stageTail = f01Ready ? 'result' : 'progress';
  const pageTitle = f01Ready ? '执行结果' : '执行进度';

  const lockedBack = () => {
    message.info('已进入执行，不可返回修改方案');
  };

  const onStepChange = (current: number) => {
    if (current < STAGE_INDEX.execution) {
      lockedBack();
      return;
    }
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLater = () => {
    message.info('Agent 将继续执行。需要你处理时会通知你。');
    navigate('/');
  };

  const openDetail = (item: ProgressItem) => {
    setDetail(item);
  };

  const closeDetail = () => {
    setQuerying(false);
    setDetail(null);
  };

  const copyStartedAt = async () => {
    try {
      await navigator.clipboard.writeText(progressCase.createdAt);
      message.success('已复制发起时间');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const refreshProgress = () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setRefreshError(false);
      setUpdatedAt(`今天 ${formatClock(new Date())}`);
      if (!isF01Ready(tick)) {
        setTick((value) => Math.min(value + 1, PROGRESS_F01_TICK));
      }
      message.success('进度已更新。已成功的项目不会重复执行');
    }, 400);
  };

  const handleAction = (item: ProgressItem, action: ProgressAction) => {
    if (action === 'contactAdmin') {
      message.info('请联系设计工具管理员补充许可证。本期不提供管理员工作台。');
      return;
    }
    if (action === 'manualVerify') {
      setDetail(item);
      setVerifyOpen(true);
      return;
    }
    if (action === 'query') {
      openDetail(item);
      setQuerying(true);
      window.setTimeout(() => {
        setQuerying(false);
        message.info('仍无法确认结果，未创建新申请');
      }, 800);
      return;
    }
    openDetail(item);
  };

  const closeVerify = () => {
    if (verifyLoading) {
      return;
    }
    setVerifyOpen(false);
  };

  const confirmVerify = () => {
    if (verifyLoading) {
      return;
    }
    setVerifyLoading(true);
    window.setTimeout(() => {
      setFilesOverride('verified');
      setVerifyLoading(false);
      setVerifyOpen(false);
      setDetail(null);
      message.success('已按人工核验标记为成功，不会重复开通');
    }, 400);
  };

  const queryFromDrawer = () => {
    if (!detail || querying) {
      return;
    }
    setQuerying(true);
    window.setTimeout(() => {
      setQuerying(false);
      message.info('仍无法确认结果，未创建新申请');
    }, 800);
  };

  const dismissInfo = () => {
    setInfoDismissed(true);
    localStorage.setItem(PROGRESS_INFO_DISMISS_KEY, '1');
  };

  const restoreInfo = () => {
    setInfoDismissed(false);
    localStorage.removeItem(PROGRESS_INFO_DISMISS_KEY);
  };

  const percent = stats.total === 0 ? 0 : Math.round((stats.succeeded / stats.total) * 100);

  const statCards = [
    { title: '已完成', value: stats.succeeded, icon: <CheckCircleOutlined />, tone: 'success' },
    { title: '执行中', value: stats.running, icon: <PlayCircleOutlined />, tone: 'primary' },
    { title: '待审批', value: stats.waiting, icon: <ClockCircleOutlined />, tone: 'warning' },
    { title: '被阻塞', value: stats.blocked, icon: <CloseCircleOutlined />, tone: 'error' },
    { title: '需要处理', value: stats.attention, icon: <FileTextOutlined />, tone: 'purple' },
    { title: '尚未开始', value: stats.pendingStart, icon: <MinusCircleOutlined />, tone: 'default' },
  ];

  const renderCards = (rows: ProgressItem[]) =>
    rows.map((item) => (
      <ProgressItemCard
        key={item.id}
        item={item}
        elapsed={elapsed}
        onOpen={openDetail}
        onAction={handleAction}
      />
    ));

  return (
    <div className="ds-page-shell p04-page">
      <FlowSteps
        current={STAGE_INDEX.execution}
        tail={stageTail}
        onChange={onStepChange}
        disabledAt={(index) => index < STAGE_INDEX.execution}
      />

      <div className="ds-page-header">
        <div className="ds-exec-heading">
          <Progress
            className="ds-exec-heading-ring"
            type="circle"
            size={64}
            percent={percent}
            strokeColor={f01Ready ? 'var(--color-warning)' : undefined}
            format={() => `${stats.succeeded}/${stats.total || 7}`}
            aria-label={`${stats.total || 7} 项中 ${stats.succeeded} 项已完成`}
          />
          <div className="ds-exec-heading-copy">
            <div className="ds-exec-heading-title">
              <Title level={4} className="ds-page-title">
                {pageTitle}
              </Title>
              {f01Ready ? (
                <Tag bordered={false} color="warning">
                  部分完成
                </Tag>
              ) : null}
              {stats.failed > 0 ? (
                <Tag bordered={false} color="error">
                  {stats.failed} 项失败
                </Tag>
              ) : null}
              {!f01Ready && stats.failed === 0 && stats.attention > 0 ? (
                <Tag bordered={false} color="purple">
                  需要处理 {stats.attention}
                </Tag>
              ) : null}
            </div>
            <Text type="secondary">
              申请单号：{progressCase.requestNo}
              <Divider type="vertical" />
              <span className="db-descriptions-value-row">
                发起时间：{progressCase.createdAt}
                <Button
                  type="text"
                  size="small"
                  className="db-descriptions-action-icon"
                  icon={<CopyOutlined />}
                  aria-label="复制发起时间"
                  onClick={() => {
                    void copyStartedAt();
                  }}
                />
              </span>
              {infoDismissed ? (
                <Button type="link" onClick={restoreInfo}>
                  查看说明
                </Button>
              ) : null}
            </Text>
          </div>
        </div>
        <Space className="ds-page-header-extra" size={8} align="center" wrap>
          <Text type="secondary">最近更新：{updatedAt}</Text>
          <Button loading={refreshing} onClick={refreshProgress}>
            刷新
          </Button>
          {f01Ready ? null : <Button onClick={handleLater}>稍后处理</Button>}
        </Space>
      </div>

      {!infoDismissed ? (
        <Alert
          type="info"
          showIcon
          closable
          className="ds-page-inline-alert"
          onClose={dismissInfo}
          message="Agent 将继续自动执行后续任务并实时同步状态；需要你处理时会及时通知，期间可以离开此页。"
        />
      ) : null}

      {refreshError ? (
        <Alert
          type="warning"
          showIcon
          message="进度暂时无法刷新，请重试。已成功的项目不会重复执行"
        />
      ) : null}

      <div className="p04-stat-grid">
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
              </div>
            </div>
          </Card>
        ))}
      </div>

      {exceptionGroups.map((group) => (
        <SectionCard
          key={group.key}
          title={group.title}
          extra={group.extra}
        >
          <div className="p04-item-stack">{renderCards(group.rows)}</div>
        </SectionCard>
      ))}

      <SectionCard
        title={hasRunning || doneItems.length === 0 ? '当前执行' : '已完成'}
        agent={hasRunning ? <RunningAgentMark /> : null}
        trailing={
          hasRunning && doneItems.length > 0 ? (
            <Button type="link" onClick={() => setShowDone((value) => !value)}>
              {showDone ? '收起已完成' : `显示已完成（${doneItems.length}）`}
            </Button>
          ) : null
        }
      >
        {hasRunning ? (
          <div className="p04-item-stack">{renderCards(runningItems)}</div>
        ) : null}
        {followOnGroups.map((group) => (
          <GroupBlock
            key={group.key}
            title={group.title}
            extra={group.extra}
          >
            {renderCards(group.rows)}
          </GroupBlock>
        ))}
        {showCompleted && doneItems.length > 0 ? (
          hasRunning ? (
            <GroupBlock title="已完成">{renderCards(doneItems)}</GroupBlock>
          ) : (
            <div className="p04-item-stack">{renderCards(doneItems)}</div>
          )
        ) : null}
      </SectionCard>

      {waitingItems.length > 0 ? (
        <SectionCard
          title="外部审批"
          extra="已提交负责人，批准前不会开通"
        >
          <div className="p04-item-stack">{renderCards(waitingItems)}</div>
        </SectionCard>
      ) : null}

      <Drawer
        open={Boolean(detail)}
        width={`min(${FLOATING_LAYER.detailDrawer}px, 80vw)`}
        onClose={closeDetail}
        closable={false}
        title={null}
        footer={null}
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
            <Button type="text" icon={<CloseOutlined />} onClick={closeDetail} aria-label="关闭" />
            <span className="p02-drawer-title">{detail?.name}</span>
          </Space>
          <Space size={8}>
            {detail?.allowedActions.includes('contactAdmin') ? (
              <Button
                onClick={() => {
                  if (detail) {
                    handleAction(detail, 'contactAdmin');
                  }
                }}
              >
                联系管理员
              </Button>
            ) : null}
            {detail?.allowedActions.includes('manualVerify') ? (
              <Button
                onClick={() => {
                  if (detail) {
                    handleAction(detail, 'manualVerify');
                  }
                }}
              >
                确认已开通
              </Button>
            ) : null}
            {detail?.allowedActions.includes('query') ? (
              <Button type="primary" loading={querying} onClick={queryFromDrawer}>
                查询结果
              </Button>
            ) : null}
          </Space>
        </div>
        {detail ? (
          <div className="p02-drawer-body">
            <Space size={8} style={{ marginBottom: 16 }} wrap>
              <Tag bordered={false} color={detail.tagColor}>
                {detail.tag}
              </Tag>
              <Text>{detail.description}</Text>
            </Space>
            <Descriptions
              className="ds-descriptions"
              column={1}
              size="small"
              items={[
                { key: 'system', label: '目标系统', children: detail.targetSystem },
                { key: 'scope', label: '权限范围', children: detail.scope },
                { key: 'valid', label: '有效期', children: formatValidUntil(detail.validUntil) },
                { key: 'exec', label: '执行状态', children: detail.tag },
                { key: 'approval', label: '审批状态', children: approvalLabel(detail.approvalStatus) },
                ...(detail.handler
                  ? [{ key: 'handler', label: '当前处理人', children: detail.handler }]
                  : []),
                {
                  key: 'request',
                  label: '申请编号',
                  children: detail.requestNo ?? '尚未生成',
                },
                ...(detail.startedAt
                  ? [{ key: 'started', label: '开始时间', children: detail.startedAt }]
                  : []),
                ...(detail.submittedAt
                  ? [{ key: 'submitted', label: '提交时间', children: detail.submittedAt }]
                  : []),
                { key: 'next', label: '下一步', children: detail.nextStep },
              ]}
            />
            {detail.logLines && detail.logLines.length > 0 ? (
              <div className="p04-log">
                <Text strong>执行日志</Text>
                {detail.logLines.map((line) => (
                  <Text type="secondary" key={line}>
                    {line}
                  </Text>
                ))}
              </div>
            ) : null}
            {detail.execStatus === 'SUCCEEDED' ? (
              <Text type="secondary">已开通，不能重复执行</Text>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={verifyOpen}
        title="确认该项已开通？"
        centered
        okText="确认已开通"
        cancelText="取消"
        confirmLoading={verifyLoading}
        onOk={confirmVerify}
        onCancel={closeVerify}
        destroyOnHidden
      >
        <Text>
          请确认已在目标系统看到「{detail?.name ?? '该项'}」权限生效。核验后将标记为成功，且不会重新提交申请。
        </Text>
      </Modal>
    </div>
  );
}
