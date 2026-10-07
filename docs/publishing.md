# 公开发布与隐私检查

OnlyFunds 使用两个仓库。源码仓库保存程序、测试、配置模板和文档；站点仓库只保存审计后的静态客户端和 HTML 手册。不要把实验室数据或本机工作目录当作网站上传。

| 仓库 | 内容 | 发布方式 |
| --- | --- | --- |
| [only-funds/only-funds](https://github.com/only-funds/only-funds) | 源码、测试、手册、压缩演示资源 | `main` 分支；CI 检查与打包 |
| [only-funds/only-funds.github.io](https://github.com/only-funds/only-funds.github.io) | `output/site/` 内的静态产物 | GitHub Pages：`main` / 根目录 |

## 发布前构建

```bash
npm ci
python3 -m venv .venv-docs
.venv-docs/bin/pip install -r docs/requirements.txt
.venv-docs/bin/sphinx-build -W --keep-going -d output/doctrees -b html docs client/public/manual
npm run check
npm run audit:release
```

Sphinx 缓存放在 `output/doctrees/`，避免其 Python 序列化文件带有本机绝对路径。若旧版本曾把缓存写进 `client/public/manual/`，先移走整个生成目录，再重新构建。构建输出、原始插画、截图和备份均位于被忽略的目录中。

## 审查源码与暂存区

`npm run audit:release` 扫描 Git 已跟踪文件和未被忽略的新文件。它检查环境文件、数据库、私钥、常见服务凭据、本机个人目录路径，并在存在本机 `server/.env` 时比对其中三个实际密钥；报告仅包含路径和规则名，不输出匹配的秘密。

```bash
git status --short
git add README.md client server creator_toolchains shared docs scripts package.json package-lock.json
git add .gitignore .gitattributes .editorconfig .dockerignore .readthedocs.yaml .github AGENTS.md
npm run audit:release -- --staged
git diff --cached --stat
```

暂存检查读取 Git index 的实际内容。额外使用独立的凭据扫描工具检查候选快照或 Git 历史，例如 [Gitleaks](https://github.com/gitleaks/gitleaks)。检查图像元数据，确认只有虚构演示人物、公开代码与示意科研内容。自动检查无法判断一段真实研究是否保密，新增数据仍需人工审查。

发布身份按仓库配置，不修改全局 Git 设置：

```bash
git config user.name agent
git config user.email agent@chiphoton.ai
git commit -m "Release OnlyFunds"
git push origin main
```

## 生成和发布站点

源码提交完成后再生成站点，站点 README 会记录对应的源码 commit：

```bash
npm run site:prepare
npm run audit:release -- --dir output/site
git clone git@github.com:only-funds/only-funds.github.io.git output/pages-repo
rsync -a --delete --exclude=.git/ output/site/ output/pages-repo/
git -C output/pages-repo config user.name agent
git -C output/pages-repo config user.email agent@chiphoton.ai
git -C output/pages-repo add .
git -C output/pages-repo commit -m "Deploy OnlyFunds static client and manual"
git -C output/pages-repo push origin main
```

`site:prepare` 要求客户端和手册的首页都存在，只接受已列明的静态文件格式。它拒绝符号链接、环境文件、数据库、未知隐藏文件和非静态文件，跳过 `.doctrees`、`.buildinfo` 等构建缓存和开发用 source map，并写入 `.nojekyll`。该命令只重建 `output/site/`；示例中的 `rsync --delete` 只用于独立的站点仓库，会删除该仓库内不在新产物中的旧文件。

第一次发布时，在站点仓库 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch**，分支 **main**、目录 **/ (root)**。这一步需要该仓库的管理员权限。等待 Pages 构建通过，再检查：

- [App](https://only-funds.github.io)：演示动态、发现、设置和压缩资源可正常打开。
- [Manual](https://only-funds.github.io/manual/)：目录、搜索、图像和样式加载正常。
- 客户端默认仍为演示模式，没有内置真实实验室账号、服务端地址或会话。

源码 CI 生成相同的 `onlyfunds-static-site` artifact。公开部署仓库不需要配置跨仓库访问令牌；后续发布可继续通过正常 SSH Git 凭据完成。

## 不进入公开仓库的内容

| 内容 | 本机位置 / 处理方式 |
| --- | --- |
| 会话密钥、学生和导师邀请码 | `server/.env`；仅提交 `.env.example` |
| 数据库、私有上传 | `server/data/` 或 Docker volume；自行备份 |
| 浏览器状态、调试截图、审计报告 | `output/`、`.playwright-cli/`；不提交 |
| 原始 PNG 与中间图像 | 本机归档；只提交压缩、去元数据后的版本 |
| 文档缓存、构建目录、依赖 | `.doctrees/`、`dist/`、`node_modules/` 等；不提交 |

发现泄漏后先撤销或轮换凭据，再清理公开历史和部署产物；删除当前文件不能撤销已经公开的秘密。
