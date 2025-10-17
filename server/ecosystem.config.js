module.exports = {
  apps: [{
    name: 'poetry-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 应用配置
    node_args: '--max-old-space-size=512',
    max_memory_restart: '512M',
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 监控配置
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // 重启策略
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // 健康检查
    health_check_url: 'http://localhost:3000/health',
    health_check_interval: 30000,
    health_check_timeout: 5000,
    
    // 环境变量
    env_development: {
      NODE_ENV: 'development',
      DEBUG: 'app:*'
    },
    
    env_staging: {
      NODE_ENV: 'staging'
    },
    
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}