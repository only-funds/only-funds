# OnlyFunds 使用手册

```{raw} html
<div class="onlyfunds-hero">
  <div class="eyebrow">GOOD RESEARCH DESERVES A FOLLOWING.</div>
  <h2>给好奇心，一个被看见的地方。</h2>
  <p>把科研周报变成值得追更的内容。<br>学生分享发现，老板给出方向，偶尔再奖励一杯续命咖啡。</p>
  <span class="tag">浏览器即客户端</span><span class="tag">实验室自托管</span><span class="tag">AI 创作者工具链</span>
</div>
```

::::{grid} 1 2 2 2
:gutter: 3

:::{grid-item-card} 🌱 第一次来到实验室
:link: quickstart
:link-type: doc

连接服务器、注册账号，五分钟了解 OnlyFunds 的使用方式。
:::

:::{grid-item-card} 🧪 分享你的研究
:link: creator-guide
:link-type: doc

从 Notion、思源笔记到分镜、视频与发布，把研究讲清楚。
:::

:::{grid-item-card} ☕ 做一个好老板
:link: user-manual
:link-type: doc

订阅学生、收藏进展、点评下一步，送出并兑现一份灵感奖励。
:::

:::{grid-item-card} 🛠️ 搭建你们的空间
:link: deployment
:link-type: doc

Docker Compose、HTTPS、静态客户端，以及完整部署检查。
:::
::::

## 三个部分，一个研究循环

| 部分 | 在哪里运行 | 做什么 |
| --- | --- | --- |
| `client/` | 手机或电脑的浏览器 | 浏览研究、创作发布、评论互动；可静态托管在 GitHub Pages |
| `server/` | 实验室自己的服务器 | 管理账号、内容、媒体、订阅和奖励记录 |
| `creator_toolchains/` | 创作者自己的电脑 | 整理笔记、渲染视频，并通过同一个 API 发布 |

**OnlyFunds 不收取订阅费，也不代发 stipend。** “订阅”表示按选定计划关注研究并记录组内支持承诺；“奖励”表示老板承诺线下兑现的咖啡、算力或额度。学术内容属于所在实验室，不上传到公共静态网站。

演示模式使用虚构账号和示例研究，数据仅在本机。当前版本为 **0.1.0**，适合单实验室部署。功能边界见[版本说明](release-notes.md)。

```{toctree}
:hidden:
:caption: 开始使用

quickstart
user-manual
subscriptions-and-ledger
creator-guide
```

```{toctree}
:hidden:
:caption: 部署与维护

deployment
publishing
operations
troubleshooting
```

```{toctree}
:hidden:
:caption: 面向开发者

architecture
api
standards
brand
brand-prompts
readme-visuals
demo-avatar-prompts
demo-media
documentation
release-notes
verification
```
