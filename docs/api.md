# API 参考

API 基址为 `https://serve.mylab.org/api`。JSON 请求使用 `Content-Type: application/json`；上传使用 `multipart/form-data`。登录外的私有接口使用 Bearer token。错误统一为 `{"error":"可读说明"}`。

## 公开与账号接口

| 方法 | 路径 | 输入或返回 |
| --- | --- | --- |
| GET | `/health` | `service`, `version`, `labName`, `maxUploadMB` |
| POST | `/auth/register` | `{name,email,password,inviteCode}` → `{token,user}` |
| POST | `/auth/login` | `{email,password}` → `{token,user}` |
| POST | `/auth/logout` | 撤销当前会话，返回 204 |
| GET | `/me` | 当前用户公开资料 |
| PATCH | `/me` | `{name,bio,field}` 完整资料字段 |

注册密码 10–128 字符；姓名最长 60。一般接口每 IP 每分钟最多 300 次，认证路径每分钟最多 12 次，超限返回 429 和 `Retry-After`。这是进程内的小型部署限流，重启会重置；多实例部署需外部限流。

## 研究动态

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/posts` | 列表：`feed=all/following/saved`, `q`, `author`, `offset`, `limit` |
| GET | `/posts/:id` | 单条详情 |
| POST | `/posts` | 创作者发布 |
| DELETE | `/posts/:id` | 仅作者删除 |
| POST | `/posts/:id/reactions` | `{kind:"like"或"save",active:true或false}` |
| POST | `/posts/:id/comments` | `{body}`，最多 3000 字符 |

列表默认 30 条，最大 50 条。点赞与收藏采用显式目标状态，重复设置相同状态不会重复计数。

发布示例：

```json
{
  "title": "本周实验：制造容差分析",
  "body": "记录方法、实际证据、局限与下一步。",
  "kind": "video",
  "tags": ["科研周报", "光子计算"],
  "sources": [{"label": "论文或笔记", "url": "https://example.org/notes"}],
  "mediaId": "上传接口返回的视频 ID",
  "posterId": "可选的封面 ID"
}
```

`kind` 支持 `note/video/paper`。标题 1–160 字符；正文 1–20000 字符；最多 6 个标签，每个最长 30 字符；最多 12 个 HTTP(S) 来源。视频动态必须带本人上传的视频 ID；封面必须是本人上传的图片。

## 上传

`POST /media` 使用一个名为 `file` 的 multipart 文件字段。支持 MP4、WebM、PNG、JPEG，最大 100 MB。服务器验证格式头部并使用随机文件名；不执行媒体文件，也不抓取远程链接。生产环境需要更深层内容扫描时在上传与发布之间加入独立处理流程。

返回 `{id,url,mime,size}`。`url` 是相对于 API 主机的短期签名路径；客户端应加服务器 Origin。未签名或过期访问返回 401。

## 组员、订阅和头像

- `GET /creators`：所有组员（包含导师），含 `academicType`（`pi/postdoc/phd/masters/undergrad`）、`year`、`exchange`、`avatarUrl`、`plans`、`studentOffer`、`studentOfferAvailable`、动态与有效订阅数。客户端可组合筛选整份小型实验室名册。
- `PATCH /me/settings`：`{academicType,year,exchange,plans,studentOffer,avatarId?}`。年级 1–12；1–5 个计划，每个为 `{id,name,monthlyUsd,description}`；名字最长 30 字、说明 160 字，整数月费范围 -100000 到 100000 USD。计划 ID 最长 60，只用字母、数字、连字符、下划线且不能重复，`student-offer` 保留。
- `POST /avatar`：单个 multipart `file`，PNG/JPEG/WebP，最大 2 MB / 1600 万像素。返回已缩小和压缩的 WebP 媒体 `{id,url,mime,size}`；仅本人通过此接口上传的头像可用于 `avatarId`。
- `POST /creators/:id/subscribe`：`{active:true,planId}`。`planId:"student-offer"` 是符合条件的同门 7 天免费活动。取消为 `{active:false}`。不能订阅自己，不能隐式选中收费计划；原版客户端不传计划时，只允许单一免费计划。
- `GET /creators/:id/followers`：当前有效订阅者的公开资料，不暴露对方的私有账本。

返回的 `subscription` 仅描述当前登录者对该组员的关系，包含 `plan` 快照、`studentOffer` 与 `expiresAt`。计划改价不改变已订阅快照；相同计划的重复确认不重新计期。活动仅学生之间、每对关系一次，取消后也不能重新领取。

## 奖励与通知

- `GET /reward-catalog`：基础奖励 + 本人的自定义菜单。
- `POST /reward-catalog`：`{emoji,unit,description}`。一个 Emoji，量词最多 8 字，介绍最多 40 字；每人最多 30 种。
- `DELETE /reward-catalog/:id`：仅删除自己的自定义菜单项，历史礼物快照保留。
- `GET /rewards`：本人送出或收到的奖励，包含 `reward` 快照、`usedAt/useNote`、`fulfilledAt/fulfilledUntil`。
- `POST /rewards`：老板提交 `{postId,rewardId,message}`，创建 `promised` 记录。寄语最多 500 字。
- `POST /rewards/:id/use`：收礼人提交 `{note}`，使用说明最多 300 字。重复请求不重复产生提醒。
- `PATCH /rewards/:id`：发放者提交 `{status:"fulfilled",fulfilledAt?,fulfilledUntil?}`。ISO 时间字符串，省略开始时间则记当前时刻。已有兑现记录不可覆盖。
- `GET /notifications`：仅本人未读礼物使用通知，包含 `id,rewardId,createdAt,recipientName,note`。
- `POST /notifications/read`：`{ids:[...]}`，每次最多 500 个通知 ID，仅标记本人指定的通知，返回 204。

基础奖励 ID：`coffee/tokens/meeting/gpu/review/boba/sleep/dinner`。自定义 ID 由服务器返回。礼物使用与通知写入同一事务。

## 收入与账单

- `GET /ledger`：仅本人作为提供者或接受者的订阅期次和礼物。`kind` 为 `subscription/reward`，`senderId/senderName → recipientId/recipientName` 表示支持流向；负数月费反向记录。`status` 为 `promised/fulfilled/free`。
- 订阅记录包含 `amountUsd,periodNumber,periodStart,periodEnd,subscriptionCreator,subscriptionStartedAt`；礼物包含使用和兑现时间。
- `PATCH /ledger/subscriptions/:id`：承诺方提交 `{status:"fulfilled",fulfilledAt}`，确认本期已线下兑现。

月度记录按 UTC 日历月生成，每个订阅系列和期次有唯一约束。免费活动只有一期。没有支付网关、自动扣费或按天折算；金额只是双方自行履行的承诺。详见[账本规则](subscriptions-and-ledger.md)。

## 创作者密钥

- `GET /tokens`：本人未过期发布密钥的 ID、名称、创建和到期时间，不返回密钥值。
- `POST /tokens`：`{"name":"本地视频助手"}` → `{token}`，最多 10 个有效密钥。
- `DELETE /tokens/:id`：撤销本人发布密钥。

发布密钥只能由学生会话创建，不能再派生密钥。仅创建时显示原始值。

## 状态码

| 状态 | 含义 |
| --- | --- |
| 400 | 字段、文件或操作无效 |
| 401 | 未登录、过期或无效令牌 / 媒体签名 |
| 403 | 身份、所有权、邀请码或 Origin 不允许 |
| 404 | 资源不存在 |
| 409 | 邮箱已注册 |
| 429 | 请求太频繁 |
| 500 | 服务器内部错误，详情仅出现在服务器日志 |
