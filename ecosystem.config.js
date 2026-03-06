module.exports = {
  apps: [
    {
      name: 'graymall',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      cwd: '/var/www/graymall-nextjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
}
