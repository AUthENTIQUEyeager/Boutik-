import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'npm run build',
  framework: 'nextjs',
  headers: [
    routes.cacheControl('/_next/static/*', {
      public: true,
      maxAge: '31536000s', // 1 year
      immutable: true
    }),
    routes.cacheControl('/static/*', {
      public: true,
      maxAge: '86400s', // 1 day
    })
  ],
  // Optional: add redirects if needed
  // redirects: [
  //   routes.redirect('/old-path', '/new-path', { permanent: true })
  // ],
  // Optional: add rewrites if needed
  // rewrites: [
  //   routes.rewrite('/api/(.*)', 'https://example.com/$1')
  // ]
};