/**
 * PM2: запуск Next.js и WebSocket-сервера на Linux-сервере.
 * Использование: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'next',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ws',
      cwd: __dirname,
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'scripts/ws-server.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
    },
    // Опционально: воркер очередей (агрегация контента). Раскомментируйте, если нужен.
    // {
    //   name: 'worker',
    //   cwd: __dirname,
    //   script: 'node_modules/tsx/dist/cli.mjs',
    //   args: 'scripts/worker.ts',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   env: { NODE_ENV: 'production' },
    // },
  ],
};
