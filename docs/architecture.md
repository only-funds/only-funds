# 架构

## 边界

```text
静态托管（GitHub Pages）
       │ HTML / JS / CSS / 公共演示素材
       ▼
浏览器客户端 ── HTTPS + Bearer ──► 实验室 API
       │                          ├── SQLite 数据库
       │ 本机草稿 / 服务器地址      └── 持久化媒体目录
       │
创作者本地 AI / Remotion ── 同一 API ──► 上传与发布
```

没有公共中心身份服务。客户端不代理科研数据、不持有 Notion 凭证、不运行服务端渲染。浏览器可以运行独立的本机演示，但连接实验室后的内容交互需要网络；当前没有离线缓存或后台同步。

## 项目结构

```text
onlyfunds/
├── client/                 React + TypeScript + Vite 静态应用
├── server/                 Express 5 + Node.js 24 原生 SQLite
│   ├── app.mjs             API 与持久化
│   ├── index.mjs           配置与进程生命周期
│   └── compose.yaml        API、Caddy、数据卷
├── creator_toolchains/
│   ├── prepare.py          Markdown / ZIP 导入
│   ├── publish.mjs         验证、上传与发布
│   ├── remotion/           参数化科研讲解视频
│   └── skills/             AI 创作与发布工作流
└── docs/                   Sphinx + Furo + MyST 手册与标准
```

## 数据模型

| 表 | 保存内容 | 关键约束 |
| --- | --- | --- |
| users | 名称、邮箱、密码哈希、身份与资料 | 邮箱唯一；身份由邀请码指定 |
| tokens | 会话与发布密钥的 SHA-256 哈希 | 服务端过期时间；可撤销 |
| posts | 正文、标题、作者、标签、来源与媒体 ID | 作者必须是创作者 |
| media | 上传文件元数据与所有者 | 随机文件名；同作者可引用 |
| reactions | 账号对动态的点赞 / 收藏 | 账号 + 动态 + 类型唯一 |
| comments | 评论与作者 | 属于指定动态 |
| subscriptions | 订阅关系、计划快照与起止 | 账号 + 创作者唯一 |
| subscription_periods | 月度承诺账本、兑现时间 | 订阅系列 + 期次唯一 |
| student_offers | 同门免费活动领取记录 | 每对关系只能领取一次 |
| custom_rewards | 个人自定义奖励菜单 | 仅本人管理 |
| notifications | 礼物使用通知与已读时间 | 仅打赏者可读 |
| rewards | 发放者、接收者、类型、兑现状态 | 仅老板发放；仅发放者确认兑现 |

SQLite 使用 WAL、外键和 busy timeout；数据库模式版本为 `PRAGMA user_version=1`。单进程、单服务器部署适用于小型实验室。不要把 SQLite volume 放到不支持锁的网络文件系统，也不要直接水平扩容多个写进程。

## 鉴权与媒体

密码使用随机盐 + scrypt 哈希；数据库不存储明文密码。浏览器会话有效期 30 天，发布密钥有效期 90 天，数据库仅存令牌哈希。

常规 API 需要 `Authorization: Bearer ...`。原生 `<video>` 不便添加 Bearer 头，因此服务端返回 **1 小时有效的签名媒体 URL**，支持 Range 请求和拖动播放。拥有该 URL 的人可以在有效期内访问该文件；不要把链接当作永久公开分享机制。

发布密钥可读取本实验室内容，并且只允许 `POST /posts` 与 `POST /media` 两类写操作。它不是对单篇内容的只写密钥，应按科研访问凭证保管。

## 数据可见性

已登录的实验室成员可读取所有已发布研究和评论。收藏仅本人可见；奖励记录仅发放者和接收者可见。订阅只影响信息流筛选，不影响内容访问权限。

没有真实支付、机构单点登录、跨实验室发现、私聊、公共分享页和细粒度课题组 ACL。以后增加这些能力时应单独设计数据和权限边界。
