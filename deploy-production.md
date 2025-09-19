# 生产环境PWA部署指南

## 当前状态
✅ PWA代码已完成并提交到 Git (commit: 6e7902b6)
✅ 本地测试通过，所有PWA文件已生成
❌ 生产环境尚未部署最新代码

## 生产服务器需要执行的命令

### 1. 连接到生产服务器
```bash
ssh ubuntu@119.91.209.91
```

### 2. 进入项目目录
```bash
cd /var/www/appesso
```

### 3. 停止当前服务
```bash
pm2 stop appesso
```

### 4. 拉取最新代码
```bash
git pull origin main
```

### 5. 安装/更新依赖
```bash
npm install
```

### 6. 构建生产版本
```bash
npm run build
```

### 7. 启动服务
```bash
pm2 start appesso
# 或者
npm run pm2
```

### 8. 检查服务状态
```bash
pm2 status
pm2 logs appesso
```

## 验证PWA功能

部署完成后，访问 https://xyuan.chat 应该能看到：

1. **浏览器地址栏** - 安装图标 (Chrome/Edge)
2. **开发者工具** - Application > Manifest 显示PWA配置
3. **Service Worker** - 已注册并激活
4. **离线测试** - 断网后仍能访问缓存内容

## 生成的PWA文件
```
public/
├── manifest.json          # PWA清单
├── sw.js                 # Service Worker
├── workbox-*.js          # 缓存库
└── icons/
    ├── icon-192x192.png  # PWA图标
    └── icon-512x512.png
```

## 需要的环境变量
确保生产环境 `.env.local` 包含：
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL=https://xyuan.chat`
- AWS 相关配置
- 数据库配置

部署完成后，PWA将在HTTPS环境下完全激活！