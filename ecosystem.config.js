module.exports = {
  apps: [{
    name: 'appesso',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/appesso',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/www/appesso/logs/err.log',
    out_file: '/var/www/appesso/logs/out.log',
    log_file: '/var/www/appesso/logs/combined.log',
    time: true
  }]
}