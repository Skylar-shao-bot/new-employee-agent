/// <reference types="vite/client" />

declare module 'antd';
declare module 'antd/locale/zh_CN' {
  const locale: unknown;
  export default locale;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}
