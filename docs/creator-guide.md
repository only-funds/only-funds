# 从笔记到视频

## 创作原则

一条值得看的科研动态，通常包含**问题 → 方法 → 证据 → 局限 → 下一步**。负结果也值得分享。AI 可以整理表达，不能替你编造数据、引用、进展或结论。

创作者工具在本机运行。默认导入器不访问网络、不调用模型、不自动配音。AI 技能供你已经使用的助手调用；是否将笔记交给外部模型，取决于你选择的工具和实验室规定。

## 1. 导出研究笔记

- **Notion**：将页面或相关笔记导出为 Markdown（含子页面的 ZIP 也可）。
- **思源笔记**：导出 Markdown 或 Markdown ZIP。
- **其他工具**：使用 `.md`、`.markdown` 或 `.txt`。

导入器只读取 ZIP 中的 Markdown，不提取任意路径、不自动下载附件。图片、PDF 与外部链接需创作者有意选择后补充。Markdown 总大小上限为 5 MB。

```bash
python3 creator_toolchains/prepare.py \
  creator_toolchains/examples/notes.md \
  --out output/week-01 \
  --author "林予安"
```

得到 `notes.md`（保留来源）、`storyboard.json`（可编辑分镜）和 `draft.json`（发布正文）。同名输出已存在时工具停止，不覆盖你的编辑。

## 2. 让 AI 整理讲解

给你的助手读取 `creator_toolchains/skills/onlyfunds-notes-to-video/SKILL.md`，然后明确指定本次笔记。也可以将技能目录复制到你自己的技能发现目录后调用 `$onlyfunds-notes-to-video`。

建议的请求：

> 根据 output/week-01/notes.md，制作 60 秒科研周报。保留未完成实验和不确定性，不补造结果。输出短分镜、讲解词和可发布摘要，并使用项目的 Remotion 模板渲染。

自动导入器只做初始排版；分镜需审阅。默认每个二级标题形成一个场景，最多 6 个，正文最多 400 字符；过长内容会在初始分镜中截短，但原始笔记完整保留，讲解词也保留对应段落。

## 3. 渲染实际视频

```bash
npm run video:studio
```

在 Remotion Studio 中预览模板。正式渲染：

```bash
cd creator_toolchains/remotion
npx remotion render src/index.ts ResearchUpdate \
  ../../output/week-01/video.mp4 \
  --props ../../output/week-01/storyboard.json
```

默认 1280 × 720、30 fps，1–12 个场景，每个 2–60 秒。每个场景拥有 `title`、`body`、`narration` 和 `duration`，总时长由场景自动相加。

`narration` 是讲解稿，不会自动转成音频。需要旁白时，将你录制或已生成且可使用的音频放到 `creator_toolchains/remotion/public/`，在分镜 JSON 顶层填写 `"audio": "narration.mp3"`。Remotion 首次渲染可能下载浏览器；在无网络环境提前准备。

示例分镜明确标记 `demo: true`，渲染时持续显示“非实验数据”。自己的真实研究应审阅后使用相应标记，不要把演示结果作为实际成果。

## 4. 创建发布密钥

在 App 的**个人主页 → 设置 → 创作者发布密钥**中创建密钥。只显示一次；有效期 90 天，可随时撤销。权限是读取实验室内容以及上传、发布，不允许修改个人资料、奖励、删除内容或生成其他密钥。

将其保存到本地环境变量，不要粘贴到聊天、分镜、源码或共享 notebook：

```bash
export ONLYFUNDS_SERVER=https://serve.mylab.org
# 通过本地密码管理器或终端安全输入设置 ONLYFUNDS_TOKEN。
```

## 5. 审阅并发布

先验证，不上传：

```bash
node creator_toolchains/publish.mjs \
  --draft output/week-01/draft.json \
  --video output/week-01/video.mp4 \
  --dry-run
```

确认分镜、字幕、引用和发布范围后：

```bash
node creator_toolchains/publish.mjs \
  --draft output/week-01/draft.json \
  --video output/week-01/video.mp4 \
  --publish
```

也可以加 `--poster cover.png`，或省略 `--video` 发布文字动态。工具默认 dry-run，不会因遗漏标志而发布。API 请求拒绝重定向，防止密钥被转交给不同域名。

网络在发布响应前中断时，先回 App 确认是否发布成功，再重试；当前 API 没有幂等发布键。不要在未知结果下自动重复发布。
