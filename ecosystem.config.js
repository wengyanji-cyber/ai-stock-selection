module.exports = {
  apps: [
    {
      name: 'ai-stock-service',
      cwd: '/root/.openclaw/workspace/ai-stock-selection/ai-stock-service',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/tmp/pm2-service-error.log',
      out_file: '/tmp/pm2-service-out.log',
      log_file: '/tmp/pm2-service-combined.log',
      time: true
    },
    {
      name: 'ai-stock-web',
      cwd: '/root/.openclaw/workspace/ai-stock-selection/ai-stock-web',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 5174',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/tmp/pm2-web-error.log',
      out_file: '/tmp/pm2-web-out.log',
      time: true
    },
    {
      name: 'ai-stock-admin',
      cwd: '/root/.openclaw/workspace/ai-stock-selection/ai-stock-admin-web',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 5175',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/tmp/pm2-admin-error.log',
      out_file: '/tmp/pm2-admin-out.log',
      time: true
    }
  ]
};
