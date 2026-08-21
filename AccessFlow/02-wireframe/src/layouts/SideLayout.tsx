import { useMemo, useState, type ReactNode } from 'react';
import { App as AntdApp, Avatar, Badge, Button, Dropdown, Typography } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LeftOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import logoMark from '../assets/logo-access-flow.svg';
import { notifications } from '../mock/chenchen';
import { hasConfirmed } from '../mock/plan';
import './SideLayout.css';

const { Text } = Typography;

interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'new',
    label: '新建开通',
    icon: <PlusCircleOutlined className="side-icon" />,
    path: '/',
  },
  {
    id: 'progress',
    label: '正在执行',
    icon: <ClockCircleOutlined className="side-icon" />,
    path: '/progress',
  },
  {
    id: 'records',
    label: '开通记录',
    icon: <FileTextOutlined className="side-icon" />,
    path: '/f01',
  },
  {
    id: 'settings',
    label: '设置',
    icon: <SettingOutlined className="side-icon" />,
  },
];

function resolveActiveMenu(pathname: string): string {
  if (pathname.startsWith('/progress')) {
    return 'progress';
  }
  if (pathname.startsWith('/f01') || pathname.startsWith('/result')) {
    return 'records';
  }
  return 'new';
}

export default function SideLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const activeMenu = resolveActiveMenu(location.pathname);

  const userMenuItems = useMemo(
    () => [
      {
        key: 'identity',
        disabled: true,
        label: '用人经理 · 李经理',
      },
    ],
    [],
  );

  const handleMenuClick = (item: MenuItem) => {
    if (item.id === 'settings') {
      message.info('设置将在后续版本提供');
      return;
    }

    if (item.id === 'progress') {
      if (!hasConfirmed()) {
        message.info('当前没有正在执行的开通任务');
        return;
      }
      navigate('/progress');
      return;
    }

    if (item.id === 'records') {
      if (location.pathname.startsWith('/f01')) {
        document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      navigate('/f01');
      return;
    }

    if (item.path === '/' && location.pathname === '/') {
      const input = document.getElementById('raw-request-input');
      input?.focus();
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  const notificationOverlay = (
    <div className="notification-panel" role="menu" aria-label="消息通知">
      {notifications.length === 0 ? (
        <div className="notification-empty">暂无通知</div>
      ) : (
        notifications.map((item) => (
          <div className="notification-item" key={item.id}>
            <Text strong>{item.title}</Text>
            <Text type="secondary">{item.description}</Text>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`side-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: 'var(--nav-color-bg-canvas)',
        }}
      />

      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <img className="logo-mark" src={logoMark} alt="" width={24} height={24} />
            <span className="brand-name">Access Flow</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="icon-group">
            <Button
              type="text"
              className="icon-button"
              icon={<QuestionCircleOutlined />}
              aria-label="帮助文档"
              onClick={() => message.info('演示环境请按主路径完成开通。')}
            />
            <Dropdown trigger={['click']} popupRender={() => notificationOverlay} placement="bottomRight">
              <Badge count={notifications.length} size="small" overflowCount={99}>
                <Button
                  type="text"
                  className="icon-button"
                  icon={<BellOutlined />}
                  aria-label={`${notifications.length} 条未读通知`}
                />
              </Badge>
            </Dropdown>
          </div>
          <Dropdown
            trigger={['click']}
            menu={{ items: userMenuItems }}
            overlayClassName="user-identity-dropdown"
            placement="bottomRight"
          >
            <div className="user-actions" role="button" tabIndex={0} aria-label="当前用户 李经理">
              <Avatar size={32} className="avatar">
                李
              </Avatar>
              <span className="user-name">李经理</span>
            </div>
          </Dropdown>
        </div>
      </header>

      <button
        className="collapse-trigger"
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
      >
        <LeftOutlined className="collapse-icon" />
      </button>

      <aside className="sidebar">
        <nav className="side-menu" aria-label="主导航">
          {MENU_ITEMS.map((item) => {
            const isActive = item.id === activeMenu;
            return (
              <div className="side-item" key={item.id}>
                <button
                  type="button"
                  className={`side-link ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleMenuClick(item)}
                >
                  {item.icon}
                  <span className="side-text">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
