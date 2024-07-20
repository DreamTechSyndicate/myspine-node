import { createProxyMiddleware } from 'http-proxy-middleware';

export const dropboxProxy = createProxyMiddleware({
  target: 'https://www.dropbox.com',
  changeOrigin: true,
  pathRewrite: { '^/dropbox': '' },
});