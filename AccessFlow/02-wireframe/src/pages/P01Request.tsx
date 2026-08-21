import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import {
  Alert,
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Progress,
  Space,
  Steps,
  Tag,
  Typography,
} from 'antd';
import {
  AudioOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  RightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ANALYZE_STEPS,
  DEMO_REQUEST,
  REQUEST_PLACEHOLDER,
  resumeTicket,
  type ResumeTicket,
} from '../mock/chenchen';
import agentHeroPoster from '../assets/agent-hero.png';
import agentHeroVideo from '../assets/agent-hero.mp4';
import agentHeroVideoAlpha from '../assets/agent-hero.webm';
import { clearConfirmed, createDefaultPlan, saveStoredPlan } from '../mock/plan';
import './p01.css';

const { Title, Text } = Typography;

const STORAGE_KEY = 'accessflow.p01.rawRequest';
const STEP_INTERVAL_MS = 700;

type PageState = 'idle' | 'analyzing' | 'need_input' | 'failed';

interface RequestFormValues {
  rawRequest: string;
  followUp?: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resumePath(ticket: ResumeTicket): string {
  if (ticket.status === 'IN_PROGRESS') {
    return '/progress';
  }
  return '/f01';
}

export default function P01Request() {
  const [form] = Form.useForm();
  const [pageState, setPageState] = useState<PageState>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [agentVisible, setAgentVisible] = useState(true);
  const [useStillAgent, setUseStillAgent] = useState(() =>
    typeof window !== 'undefined' ? prefersReducedMotion() : false,
  );
  const agentVideoRef = useRef<HTMLVideoElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const analyzing = pageState === 'analyzing';
  const submitLabel =
    pageState === 'need_input' ? '继续生成' : analyzing ? '正在生成…' : '生成方案';

  useEffect(() => {
    const isDemo = searchParams.get('demo') === 'chenchen';
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (isDemo) {
      form.setFieldsValue({ rawRequest: DEMO_REQUEST });
      return;
    }
    if (stored?.trim() && stored.trim() !== DEMO_REQUEST) {
      form.setFieldsValue({ rawRequest: stored });
      return;
    }
    if (stored) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    form.setFieldsValue({ rawRequest: '' });
  }, [form, searchParams]);

  const rawRequest = Form.useWatch('rawRequest', form);

  useEffect(() => {
    if (typeof rawRequest === 'string') {
      sessionStorage.setItem(STORAGE_KEY, rawRequest);
    }
  }, [rawRequest]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      const reduce = media.matches;
      setUseStillAgent(reduce);
      const video = agentVideoRef.current;
      if (!video) {
        return;
      }
      if (reduce) {
        video.pause();
        return;
      }
      void video.play().catch(() => {
        setUseStillAgent(true);
      });
    };
    syncMotion();
    media.addEventListener('change', syncMotion);
    return () => media.removeEventListener('change', syncMotion);
  }, []);

  useEffect(() => {
    if (!analyzing) {
      return;
    }

    const timers: number[] = [];
    const reduced = prefersReducedMotion();

    if (reduced) {
      setCurrentStep(ANALYZE_STEPS.length - 1);
      timers.push(
        window.setTimeout(() => {
          message.success('已生成开通方案');
          setPageState('idle');
          clearConfirmed();
          saveStoredPlan(createDefaultPlan());
          navigate('/plan');
        }, STEP_INTERVAL_MS),
      );
    } else {
      setCurrentStep(0);
      ANALYZE_STEPS.forEach((_, index) => {
        timers.push(
          window.setTimeout(() => {
            setCurrentStep(index);
            if (index === ANALYZE_STEPS.length - 1) {
              timers.push(
                window.setTimeout(() => {
                  message.success('已生成开通方案');
                  setPageState('idle');
                  clearConfirmed();
                  saveStoredPlan(createDefaultPlan());
                  navigate('/plan');
                }, STEP_INTERVAL_MS),
              );
            }
          }, index * STEP_INTERVAL_MS),
        );
      });
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [analyzing, message, navigate]);

  useEffect(() => {
    if (!analyzing) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [analyzing]);

  const stepItems = useMemo(
    () =>
      ANALYZE_STEPS.map((title, index) => ({
        title,
        status: (index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait') as
          | 'finish'
          | 'process'
          | 'wait',
        icon:
          index < currentStep ? (
            <CheckCircleOutlined />
          ) : index === currentStep ? (
            <LoadingOutlined />
          ) : undefined,
      })),
    [currentStep],
  );

  const onGenerate = async (values: RequestFormValues) => {
    if (analyzing) {
      return;
    }

    if (pageState === 'need_input' && !values.followUp?.trim()) {
      return;
    }

    setPageState('analyzing');
  };

  const openResume = () => {
    if (analyzing) {
      message.info('正在生成方案');
      return;
    }
    navigate(resumePath(resumeTicket));
  };

  return (
    <div className="ds-page-shell p01-shell">
      <div className="ds-page-header">
        <Space direction="vertical" size={4}>
          <Title level={4} className="ds-page-title">
            为新员工快速开通账号与权限
          </Title>
          <Text type="secondary">
            告诉 Agent 新员工的入职信息和权限需求，系统将生成方案并持续跟踪执行结果。
          </Text>
        </Space>
        {agentVisible ? (
          <Space className="ds-page-header-extra">
            <div className="p01-agent-wrap">
              {useStillAgent ? (
                <img
                  className="p01-agent"
                  src={agentHeroPoster}
                  alt="AccessFlow Agent"
                  onError={() => setAgentVisible(false)}
                />
              ) : (
                <video
                  ref={agentVideoRef}
                  className="p01-agent"
                  poster={agentHeroPoster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  controls={false}
                  aria-label="AccessFlow Agent"
                  onError={() => setUseStillAgent(true)}
                >
                  <source src={agentHeroVideoAlpha} type="video/webm" />
                  <source src={agentHeroVideo} type="video/mp4" />
                </video>
              )}
            </div>
          </Space>
        ) : null}
      </div>

      <Card bordered={false} className="ds-page-card p01-prompt-card">
        <Form
          form={form}
          layout="vertical"
          className="p01-prompt-form"
          initialValues={{ rawRequest: '' }}
          onFinish={onGenerate}
          requiredMark={false}
        >
          <Form.Item
            name="rawRequest"
            rules={[{ required: true, whitespace: true, message: '请先填写开通需求' }]}
          >
            <Input.TextArea
              id="raw-request-input"
              showCount
              maxLength={2000}
              autoSize={{ minRows: 4, maxRows: 8 }}
              placeholder={REQUEST_PLACEHOLDER}
              disabled={analyzing}
              aria-label="开通需求"
            />
          </Form.Item>

          {analyzing ? (
            <div className="p01-analyze-steps" aria-live="polite">
              <Steps size="small" direction="vertical" current={currentStep} items={stepItems} />
            </div>
          ) : null}

          {pageState === 'failed' ? (
            <Alert
              className="p01-followup"
              type="error"
              showIcon
              message="方案生成失败，已保留你的原文，请重试"
            />
          ) : null}

          {pageState === 'need_input' ? (
            <div className="p01-followup">
              <Alert
                type="info"
                showIcon
                message="你填写的入职日期为 9 月 7 日，人事记录为 9 月 14 日。请确认以哪个日期为准"
              />
              <Form.Item
                name="followUp"
                rules={[{ required: true, whitespace: true, message: '请确认后再继续' }]}
              >
                <Input maxLength={200} placeholder="请确认后再继续" aria-label="补充信息" />
              </Form.Item>
            </div>
          ) : null}

          <Flex className="p01-prompt-footer" justify="space-between" align="center">
            <Button
              type="text"
              icon={<AudioOutlined />}
              aria-label="语音输入"
              disabled={analyzing}
              onClick={() => message.info('演示环境暂不支持语音输入')}
            />
            <Button type="primary" htmlType="submit" loading={analyzing}>
              {submitLabel}
            </Button>
          </Flex>
        </Form>
      </Card>

      <section className="p01-section">
        <Title level={5} className="p01-section-title">
          继续处理
        </Title>
        <Card
          bordered={false}
          hoverable
          className="ds-page-card p01-task-card"
          onClick={openResume}
          role="button"
          tabIndex={0}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openResume();
            }
          }}
        >
          <Flex className="p01-task-main" align="flex-start">
            <Avatar size={40} icon={<UserOutlined />} className="p01-task-avatar" />
            <Flex vertical flex={1} className="p01-task-body">
              <Flex justify="space-between" align="flex-start" className="p01-task-title-row">
                <Text ellipsis={{ tooltip: true }} className="p01-task-title">
                  <span className="p01-task-name">{resumeTicket.employeeName}</span>
                  <span className="p01-task-meta">
                    {` · ${resumeTicket.role} · ${resumeTicket.department}`}
                  </span>
                </Text>
                <Button
                  type="link"
                  className="p01-task-action"
                  onClick={(event: MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openResume();
                  }}
                >
                  查看进度
                  <RightOutlined />
                </Button>
              </Flex>
              <Flex align="center" wrap className="p01-task-metrics">
                <Text type="secondary" className="p01-task-count">
                  {resumeTicket.doneCount} / {resumeTicket.totalCount} 已完成
                </Text>
                <Progress
                  percent={Math.round((resumeTicket.doneCount / resumeTicket.totalCount) * 100)}
                  showInfo={false}
                  size="small"
                  aria-label={`${resumeTicket.doneCount} / ${resumeTicket.totalCount} 已完成`}
                />
                <Space size={8} wrap className="p01-task-tags">
                  {resumeTicket.pendingApproval > 0 ? (
                    <Tag bordered={false} color="warning">
                      {resumeTicket.pendingApproval} 待审批
                    </Tag>
                  ) : null}
                  {resumeTicket.needsAttention > 0 ? (
                    <Tag bordered={false} color="error">
                      {resumeTicket.needsAttention} 需要处理
                    </Tag>
                  ) : null}
                  {resumeTicket.unknownResult > 0 ? (
                    <Tag bordered={false}>{resumeTicket.unknownResult} 结果未知</Tag>
                  ) : null}
                </Space>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </section>
    </div>
  );
}
