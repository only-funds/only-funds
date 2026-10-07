# 品牌与图标

OnlyFunds 的品牌来自实验室里的一个自嘲：**PhD 是穿着白大褂、戴着学士帽、还在努力拉磨的驴。**

## 视觉约定

- O 是带中心孔和刻槽的磨盘。
- F 使用学士帽、驴耳、驴脸和实验服构成科研角色，保持 O/F 的整体识别结构。
- 白大褂领口保留 `PhD` 字样。
- 字标写作 **OnlyFunds**，Only 为深色圆润字形，Funds 为蓝色连笔字形。
- 主色为 `#00AFF0`，深蓝为 `#008CCF`；主要产品界面使用蓝白配色。

品牌素材位于 `client/public/brand/`。完整图适用于登录、初次加载、文档首页；导航使用独立生成的干净横版 `onlyfunds-horizontal.webp`（720 × 160，约 23 KB），不再通过 CSS 裁切大图拼接。移动端使用等宽的左右按钮区，让 Logo 始终居中，返回键在左侧。GPT-Image 输出是栅格插画，不能把其轮廓描述为数学意义上与参考矢量完全一致。

## 图像来源与制作

使用 Codex 内置 GPT-Image 工具生成品牌 PNG，最终选用白底的清晰版，另保留初版透明吉祥物。参考轮廓来自 [OnlyFans 标志参考](https://companieslogo.com/onlyfans/logo/)，项目不是 OnlyFans 官方产品。

PNG 原图仅在本机 `output/source-artwork/` 保留作源素材，不随仓库或静态网站分发。启动、登录与手册使用 640 × 427 的 `onlyfunds-logo.webp`（约 33 KB），浏览器图标使用 64 × 64 的 `favicon.png`（约 3 KB），避免首屏加载 1.35 MB 原图。

最终生成提示词与迭代说明保存于 `brand-prompts.md`，便于后续保留角色和字标的一致性。
