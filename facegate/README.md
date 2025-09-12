# Facegate Admin Starter

最小可用的人脸门禁云平台 **Admin 前端 + API + WS 网关** 模板。

## 一键起服务（开发模式）
```bash
docker compose up -d --build
# 前端: http://localhost:5173
# API(REST): http://localhost:3001
# WS(设备): ws://localhost:7001
```

> 默认账号：用 **单一密码** 登录（无用户名），首次在 `.env` 或 docker-compose 中设置 `ADMIN_PASSWORD`。

### 本地不使用 Docker（可选）
- 先启动 MySQL（按 db/schema.sql 初始化）
- `cd server && npm i && npm run dev`
- `cd admin && npm i && npm run dev`

### 生产建议
- 打开 `wss://`（Nginx 终止 TLS）；
- `ADMIN_PASSWORD` 使用强密码；
- 开启安全组只放行 80/443；
- 开 `pm2` 或编排到 K8s。

详见 `docs/nginx.sample.conf`。
