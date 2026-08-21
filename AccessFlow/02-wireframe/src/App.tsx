import { Navigate, createBrowserRouter, createHashRouter, type RouteObject } from 'react-router-dom';
import SideLayout from './layouts/SideLayout';
import P01Request from './pages/P01Request';
import P02Review from './pages/P02Review';
import P03Confirm from './pages/P03Confirm';
import P04Progress from './pages/P04Progress';
import P05Result from './pages/P05Result';
import PlaceholderPage from './pages/PlaceholderPage';

const routes: RouteObject[] = [
  {
    element: <SideLayout />,
    children: [
      { path: '/', element: <P01Request /> },
      { path: '/provision/new', element: <Navigate to="/" replace /> },
      { path: '/plan', element: <P02Review /> },
      { path: '/confirm', element: <P03Confirm /> },
      { path: '/progress', element: <P04Progress /> },
      { path: '/f01', element: <P05Result /> },
      {
        path: '/result',
        element: (
          <PlaceholderPage
            title="最终结果"
            description="整单仍为部分完成（不是全部完成）。已人工完结：剩余项不再继续执行。未完成：设计工具待人工处理、产品数据看板待审批、项目文件库结果未知。"
          />
        ),
      },
    ],
  },
];

export const router = import.meta.env.PROD
  ? createHashRouter(routes)
  : createBrowserRouter(routes);
