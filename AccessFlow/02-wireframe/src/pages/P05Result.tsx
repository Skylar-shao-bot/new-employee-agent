import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
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
  theme,
} from 'antd';
import {
  BankOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  FolderOutlined,
  HighlightOutlined,
  MailOutlined,
  ProjectOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  STAGE_INDEX,
  formatValidUntil,
  loadStoredPlan,
  type PlanIconKey,
} from '../mock/plan';
import { approvalLabel, progressCase } from '../mock/progress';
import {
  F01_INFO_DISMISS_KEY,
  actionLabel,
  buildF01Items,
  drawerTitle,
  f01Stats,
  isF01Closed,
  markF01Closed,
  saveF01Result,
  type F01Action,
  type F01Item,
  type FilesOverride,
  type ResultGroup,
} from '../mock/f01';
import FlowSteps from '../components/FlowSteps';
import './p02.css';
import './p04.css';
import './p05.css';

const { Title, Text } = Typography;

const FLOATING_LAYER = {
  detailDrawer: 480,
  confirmModal: 480,
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

const GROUP_META: {
  key: ResultGroup;
  title: string;
  icon: typeof CheckCircleOutlined;
  tone: string;
  skin: 'success' | 'error' | 'warning' | 'unknown';
}[] = [
  { key: 'success', title: '成功', icon: CheckCircleOutlined, tone: 'success', skin: 'success' },
  { key: 'failed', title: '失败', icon: CloseCircleOutlined, tone: 'error', skin: 'error' },
  { key: 'pending', title: '待审批', icon: ClockCircleOutlined, tone: 'warning', skin: 'warning' },
  { key: 'unknown', title: '结果未知', icon: QuestionCircleOutlined, tone: 'purple', skin: 'unknown' },
];

function iconTone(item: F01Item): string {
  if (item.group === 'success') {
    return 'success';
  }
  if (item.group === 'pending') {
    return 'waiting';
  }
  if (item.group === 'failed') {
    return 'blocked';
  }
  return 'attention';
}

function metaFields(item: F01Item): { label: string; value: string }[] {
  if (item.group === 'success') {
    return [
      { label: '编号', value: item.requestNo },
      { label: '完成时间', value: item.finishedAt ?? '—' },
    ];
  }
  if (item.group === 'failed') {
    return [
      { label: '当前处理人', value: item.handler ?? '—' },
      { label: '下一步', value: item.nextStep },
    ];
  }
  if (item.group === 'pending') {
    return [{ label: '当前审批人', value: item.handler ?? '—' }];
  }
  return [
    { label: '当前处理人', value: item.handler ?? 'Agent' },
    { label: 'Agent', value: item.agentStatus ?? '正在查询最终状态' },
  ];
}

function ResultItemCard({
  item,
  compact,
  onAction,
}: {
  item: F01Item;
  compact?: boolean;
  onAction: (item: F01Item, action: F01Action) => void;
}) {
  const ItemIcon = ICON_MAP[item.icon];
  const fields = metaFields(item);

  return (
    <div className={`p04-item ${compact ? '' : 'p05-item-wide'}`}>
      <span className={`p04-item-icon is-${iconTone(item)}`}>
        <ItemIcon />
      </span>
      <span className="p04-item-main">
        <span className="p04-item-title">
          <Text strong>{item.name}</Text>
          <Tag bordered={false} color={item.tagColor}>
            {item.tag}
          </Tag>
        </span>
        <Text type="secondary" className="p04-item-desc">
          {item.description}
        </Text>
      </span>
      <span className={`p04-item-meta${fields.length === 1 ? ' is-single' : ''}`}>
        {fields.map((field) => (
          <span className="p04-meta-field" key={field.label}>
            <span className="p04-meta-label">{field.label}</span>
            <span className="p04-meta-value">{field.value}</span>
          </span>
        ))}
      </span>
      <span className="p04-item-action">
        <span className="p05-item-actions">
            {item.allowedActions.map((action) => (
            <Typography.Link
              key={action}
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                onAction(item, action);
              }}
            >
              {actionLabel(action)}
            </Typography.Link>
          ))}
        </span>
      </span>
    </div>
  );
}

function GuideBody({ item }: { item: F01Item }) {
  return (
    <div className="p05-guide">
      <div>
        <Text type="secondary">发生了什么</Text>
        <div>设计工具开通失败</div>
      </div>
      <div>
        <Text type="secondary">为什么</Text>
        <div>{item.description}</div>
      </div>
      <div>
        <Text type="secondary">谁负责</Text>
        <div>{item.handler ?? '设计工具管理员'}</div>
      </div>
      <div>
        <Text type="secondary">经理现在</Text>
        <div>联系管理员补充许可证</div>
      </div>
      <div>
        <Text type="secondary">Agent 下一步</Text>
        <div>许可证可用后自动继续；已成功项不会重复开通</div>
      </div>
    </div>
  );
}

export default function P05Result() {
  const { message } = AntdApp.useApp();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const plan = useMemo(() => loadStoredPlan(), []);
  const fromProgress = Boolean(
    (location.state as { fromProgress?: boolean } | null)?.fromProgress,
  );

  const [filesOverride, setFilesOverride] = useState<FilesOverride>('unknown');
  const [infoDismissed, setInfoDismissed] = useState(
    () => localStorage.getItem(F01_INFO_DISMISS_KEY) === '1',
  );
  const [drawer, setDrawer] = useState<{ item: F01Item; action: F01Action } | null>(null);
  const [modal, setModal] = useState<'cancel' | 'verify' | 'close' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [handoffVisible, setHandoffVisible] = useState(fromProgress);
  const [closing, setClosing] = useState(() => isF01Closed());
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => buildF01Items(plan, filesOverride), [plan, filesOverride]);
  const stats = useMemo(() => f01Stats(items), [items]);
  const percent = stats.total === 0 ? 0 : Math.round((stats.succeeded / stats.total) * 100);

  useEffect(() => {
    if (filesOverride !== 'unknown') {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      message.info('仍无法确认结果，未创建新申请');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [filesOverride, message]);

  const groups = GROUP_META.map((meta) => ({
    ...meta,
    rows: items.filter((item) => item.group === meta.key),
  })).filter((group) => group.rows.length > 0);

  const statCards: { key: ResultGroup; title: string; value: number; icon: ReactNode; tone: string }[] =
    [
      {
        key: 'success',
        title: '成功',
        value: stats.succeeded,
        icon: <CheckCircleOutlined />,
        tone: 'success',
      },
      {
        key: 'failed',
        title: '失败',
        value: stats.failed,
        icon: <CloseCircleOutlined />,
        tone: 'error',
      },
      {
        key: 'pending',
        title: '待审批',
        value: stats.pending,
        icon: <ClockCircleOutlined />,
        tone: 'warning',
      },
      {
        key: 'unknown',
        title: '结果未知',
        value: stats.unknown,
        icon: <QuestionCircleOutlined />,
        tone: 'purple',
      },
    ];

  const lockedBack = () => {
    message.info('已进入结果阶段，不可返回修改方案');
  };

  const onStepChange = (current: number) => {
    if (current === STAGE_INDEX.home) {
      navigate('/');
      return;
    }
    if (current === STAGE_INDEX.plan || current === STAGE_INDEX.confirm) {
      lockedBack();
      return;
    }
    if (current === STAGE_INDEX.execution) {
      document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToGroup = (key: ResultGroup) => {
    document.getElementById(`f01-group-${key}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const copyRequestNo = async () => {
    try {
      await navigator.clipboard.writeText(progressCase.requestNo);
      message.success('已复制申请单号');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const openDrawer = (item: F01Item, action: F01Action) => {
    setDrawer({ item, action });
  };

  const closeDrawer = () => {
    setDrawer(null);
  };

  const handleAction = (item: F01Item, action: F01Action) => {
    if (action === 'remindEmail') {
      message.info('演示环境暂不支持邮件提醒');
      return;
    }
    if (action === 'contactAdmin') {
      message.info('请联系设计工具管理员补充许可证。本期不提供管理员工作台。');
      return;
    }
    if (action === 'cancelProvision') {
      setModal('cancel');
      return;
    }
    if (action === 'manualVerify') {
      setModal('verify');
      return;
    }
    openDrawer(item, action);
  };

  const closeModal = () => {
    if (modalLoading) {
      return;
    }
    setModal(null);
  };

  const confirmModal = () => {
    if (modalLoading) {
      return;
    }
    setModalLoading(true);
    window.setTimeout(() => {
      if (modal === 'cancel') {
        setFilesOverride('cancelled');
        message.success('已取消该项开通，未创建新申请');
      } else if (modal === 'verify') {
        setFilesOverride('verified');
        message.success('已按人工核验标记为成功，不会重复开通');
      } else if (modal === 'close') {
        markF01Closed();
        setClosing(true);
        saveF01Result({
          filesOverride,
          closed: true,
          succeeded: stats.succeeded,
          failed: stats.failed,
          pending: stats.pending,
          unknown: stats.unknown,
          total: stats.total,
        });
        message.success('已完结权限开通。剩余项不再继续执行，整单仍为部分完成');
        setModalLoading(false);
        setModal(null);
        navigate('/result', { state: { closed: true, partialComplete: true } });
        return;
      }
      setModalLoading(false);
      setModal(null);
    }, 400);
  };

  const handleSave = () => {
    if (saving) {
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      saveF01Result({
        filesOverride,
        closed: closing,
        succeeded: stats.succeeded,
        failed: stats.failed,
        pending: stats.pending,
        unknown: stats.unknown,
        total: stats.total,
      });
      setSaving(false);
      message.success('已保存当前结果。整单仍为部分完成，可稍后继续处理');
    }, 300);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const openCloseConfirm = () => {
    if (closing) {
      navigate('/result', { state: { closed: true, partialComplete: true } });
      return;
    }
    setModal('close');
  };

  const dismissInfo = () => {
    setInfoDismissed(true);
    localStorage.setItem(F01_INFO_DISMISS_KEY, '1');
  };

  const restoreInfo = () => {
    setInfoDismissed(false);
    localStorage.removeItem(F01_INFO_DISMISS_KEY);
  };

  const drawerItem = drawer?.item;
  const drawerAction = drawer?.action;

  return (
    <div className="ds-page-shell p05-page">
      <FlowSteps
        current={STAGE_INDEX.execution}
        tail="result"
        onChange={onStepChange}
        disabledAt={(index) => index === STAGE_INDEX.plan || index === STAGE_INDEX.confirm}
      />

      <div className="ds-page-header">
        <div className="ds-exec-heading">
          <Progress
            className="ds-exec-heading-ring"
            type="circle"
            size={64}
            percent={percent}
            strokeColor={token.colorWarning}
            trailColor={token.colorBorderSecondary}
            format={() => `${stats.succeeded}/${stats.total || 7}`}
            aria-label={`${stats.total || 7} 项中 ${stats.succeeded} 项已开通，整单部分完成`}
          />
          <div className="ds-exec-heading-copy">
            <div className="ds-exec-heading-title">
              <Title level={4} className="ds-page-title">
                执行结果
              </Title>
              <Tag bordered={false} color="warning">
                部分完成
              </Tag>
              {closing ? (
                <Tag bordered={false} color="default">
                  已人工完结
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
                  aria-label="复制申请单号"
                  onClick={() => {
                    void copyRequestNo();
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
        <Button type="link" className="ds-page-header-extra" onClick={() => navigate('/result')}>
          查看结果摘要
        </Button>
      </div>

      {!handoffVisible ? null : (
        <Alert
          type="success"
          showIcon
          closable
          className="ds-page-inline-alert"
          onClose={() => setHandoffVisible(false)}
          message="已从执行进度进入结果。申请单号与开通项保持连续，以下按结果分组展示。"
        />
      )}

      {!infoDismissed ? (
        <Alert
          type="warning"
          showIcon
          closable
          className="ds-page-inline-alert"
          onClose={dismissInfo}
          message="存在待人工处理或结果未知的项，请查看详情并处理。已成功的项目不会重复开通。"
        />
      ) : null}

      <Card bordered={false} className="ds-page-card">
        <div className="p05-overview is-stats-only">
          <Text type="secondary" className="p05-overview-hint">
            存在待人工处理或结果未知的项，请查看详情并处理。
          </Text>
          <div className="p05-overview-stats">
            {statCards.map((card) => (
              <button
                type="button"
                className="p05-stat"
                key={card.key}
                aria-label={`${card.value} 项${card.title}，跳转到${card.title}分组`}
                onClick={() => scrollToGroup(card.key)}
              >
                <div className={`p02-stat-icon is-${card.tone}`}>{card.icon}</div>
                <div className="p02-stat-copy">
                  <div className="p02-stat-title">{card.title}</div>
                  <div className="p02-stat-value-row">
                    <span className="p02-stat-value">{card.value}</span>
                    <span className="p02-stat-suffix">项</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {groups.map((group) => {
        const Icon = group.icon;
        const compact = group.key === 'success';
        return (
          <Card
            bordered={false}
            className={`ds-page-card p05-group is-${group.skin}`}
            key={group.key}
            id={`f01-group-${group.key}`}
          >
            <div className="ds-card-title-row">
              <div className="p04-card-heading">
                <Icon className={`p04-group-icon is-${group.tone}`} />
                <span className="ds-table-title">{group.title}</span>
              </div>
            </div>
            <div className={compact ? 'p05-success-grid' : 'p04-item-stack'}>
              {group.rows.map((item) => (
                <ResultItemCard
                  key={item.id}
                  item={item}
                  compact={compact}
                  onAction={handleAction}
                />
              ))}
            </div>
          </Card>
        );
      })}

      <div className="p02-footer">
        <Space size={8}>
          <Button loading={saving} onClick={handleSave}>
            保存
          </Button>
          <Button onClick={handleGoHome}>返回首页</Button>
          <Button type="primary" onClick={openCloseConfirm}>
            {closing ? '查看结果摘要' : '完结权限开通'}
          </Button>
        </Space>
      </div>

      <Drawer
        open={Boolean(drawer)}
        width={`min(${FLOATING_LAYER.detailDrawer}px, 80vw)`}
        onClose={closeDrawer}
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
            <Button type="text" icon={<CloseOutlined />} onClick={closeDrawer} aria-label="关闭" />
            <span className="p02-drawer-title">
              {drawerItem && drawerAction ? drawerTitle(drawerItem, drawerAction) : ''}
            </span>
          </Space>
        </div>
        {drawerItem && drawerAction ? (
          <div className="p02-drawer-body">
            {drawerAction === 'viewGuide' ? (
              <GuideBody item={drawerItem} />
            ) : (
              <>
                <Space size={8} style={{ marginBottom: 16 }} wrap>
                  <Tag bordered={false} color={drawerItem.tagColor}>
                    {drawerItem.tag}
                  </Tag>
                  <Text>{drawerItem.description}</Text>
                </Space>
                <Descriptions
                  className="ds-descriptions"
                  column={1}
                  size="small"
                  items={[
                    { key: 'system', label: '目标系统', children: drawerItem.targetSystem },
                    { key: 'scope', label: '权限范围', children: drawerItem.scope },
                    {
                      key: 'valid',
                      label: '有效期',
                      children:
                        drawerItem.id === 'dashboard'
                          ? '若开通，将于 12 月 31 日自动失效'
                          : formatValidUntil(drawerItem.validUntil),
                    },
                    { key: 'exec', label: '执行状态', children: drawerItem.tag },
                    {
                      key: 'approval',
                      label: '审批状态',
                      children: approvalLabel(drawerItem.approvalStatus),
                    },
                    ...(drawerItem.handler
                      ? [{ key: 'handler', label: '当前处理人', children: drawerItem.handler }]
                      : []),
                    { key: 'request', label: '申请编号', children: drawerItem.requestNo },
                    { key: 'next', label: '下一步', children: drawerItem.nextStep },
                    ...(drawerAction === 'viewReceipt' || drawerAction === 'viewDetail'
                      ? [
                          {
                            key: 'ops',
                            label: '可用操作',
                            children: '无。该项已开通，不能重复执行',
                          },
                        ]
                      : []),
                  ]}
                />
              </>
            )}
          </div>
        ) : null}
      </Drawer>

      <Modal
        title={
          modal === 'cancel'
            ? '确认取消开通？'
            : modal === 'close'
              ? '完结权限开通？'
              : '确认该项已开通？'
        }
        open={Boolean(modal)}
        centered
        width={FLOATING_LAYER.confirmModal}
        onCancel={closeModal}
        footer={
          <Space size={8}>
            <Button onClick={closeModal} disabled={modalLoading}>
              取消
            </Button>
            <Button
              type={modal === 'cancel' ? 'default' : 'primary'}
              danger={modal === 'cancel'}
              loading={modalLoading}
              onClick={confirmModal}
            >
              {modal === 'cancel' ? '确认取消' : modal === 'close' ? '完结权限开通' : '确认已开通'}
            </Button>
          </Space>
        }
      >
        {modal === 'cancel'
          ? '将停止对该项的后续开通尝试，不会重新提交申请。已成功的其他项不受影响。'
          : modal === 'close'
            ? '结束后，所有剩余项目将不再继续执行：Agent 不会再自动推进未完成项。已成功项不会重复开通。整单事实仍为部分完成，不是全部完成。'
            : '请确认已在目标系统看到该权限生效。核验后将标记为成功，且不可重复开通。'}
      </Modal>
    </div>
  );
}
