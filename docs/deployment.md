# 部署 OnlyFunds

## 目录与前提

以下命令以 `onlyfunds/` 为仓库根目录。服务端需要 Docker + Docker Compose；开发与生成环境配置需要 Node.js 24。正式环境准备一个解析到服务器的域名，并使外部客户端能访问 80/443 端口。

静态网站仅托管前端文件；科研内容和账号存放于实验室服务器。实验室每台服务器对应一个独立实验室。

## 配置实验室

```bash
node server/setup.mjs
```

脚本创建权限为 `0600` 的 `server/.env`，自动生成会话密钥和两个不同的邀请码；已有文件保持不变。编辑非秘密配置：

| 变量 | 用途 |
| --- | --- |
| `LAB_NAME` | 显示给成员的实验室名称 |
| `LAB_DOMAIN` | 例如 `serve.mylab.org`，用于 HTTPS 证书与代理 |
| `ACME_EMAIL` | 证书联系邮箱 |
| `ALLOWED_ORIGINS` | 允许访问的客户端 Origin，逗号分隔；例如 `https://only-funds.github.io` |
| `SESSION_SECRET` | 至少 32 字符的随机密钥，用于媒体 URL 签名 |
| `STUDENT_INVITE_CODE` | 学生注册邀请码 |
| `BOSS_INVITE_CODE` | 老板注册邀请码，必须与学生邀请码不同 |
| `PORT` | 保持 `8787`；若修改需同步 Compose 的映射、健康检查与 Caddy 上游 |

`ALLOWED_ORIGINS` 填协议 + 域名 + 可选端口，不包含 `/路径`，也不要写 `*`。GitHub Pages 项目子目录和根站点使用同一个 Origin。

## 一条命令启动服务端与 HTTPS

```bash
docker compose -f server/compose.yaml --profile https up -d --build
```

Caddy 负责签发、续期证书并代理到 API。数据持久化于 `lab-data` Docker volume，证书在 `caddy-data`。API 仅映射至主机 `127.0.0.1:8787`，正式用户经 443 访问。

```bash
curl https://serve.mylab.org/api/health
docker compose -f server/compose.yaml ps
```

期望健康接口返回 `service: onlyfunds`。客户端设置中输入该域名并“验证并连接”。本项目配置已准备好，但证书、域名和真实服务器需要在你拥有的部署环境中启用。

## 已有反向代理或本机测试

只启动 API：

```bash
docker compose -f server/compose.yaml up -d --build
```

现有 Nginx/Caddy 将流量转发到 `127.0.0.1:8787`，上传大小至少 105 MB，支持 Range 请求。`TRUST_PROXY=1` 只适用于单跳可信代理；直接暴露 API 时不要信任任意代理头。

只有 IP 时也必须提供浏览器信任的 TLS 证书。自签名证书需要在每台客户端设备建立信任；日常使用优先采用有正常证书的域名或由实验室管理的 HTTPS 网络入口。

## 发布静态客户端与手册

源码在 [`only-funds/only-funds`](https://github.com/only-funds/only-funds)，静态产物在 [`only-funds/only-funds.github.io`](https://github.com/only-funds/only-funds.github.io)。浏览器访问地址为 `https://only-funds.github.io`，手册位于 `/manual/`。

源码仓库的 `.github/workflows/check.yml` 检查类型、行为测试和文档，生成经过筛选的静态站点 artifact；正式发布时将该产物提交到站点仓库的 `main` 分支。站点仓库在 **Settings → Pages** 选择 **Deploy from a branch → main → / (root)**。

Vite 使用相对资源路径，App 使用 hash 路由；刷新 `/#profile` 不需要服务器重写。完整发布与隐私检查步骤见[公开发布流程](publishing.md)。

本地构建完整分发包：

```bash
npm ci
python3 -m venv .venv-docs
.venv-docs/bin/pip install -r docs/requirements.txt
.venv-docs/bin/sphinx-build -W --keep-going -d output/doctrees -b html docs client/public/manual
npm run check
npm run site:prepare
npm run audit:release -- --dir output/site
```

上传 **`output/site/` 的内容**至静态托管服务。不要直接上传工程目录，也不要把 Sphinx 的 `.doctrees` 缓存放进静态目录。文档可单独托管在 Read the Docs，详见[文档维护](documentation.md)。
