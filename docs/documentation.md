# 手册维护与 Read the Docs

手册使用 **Sphinx + MyST Markdown + Furo**，提供全文搜索、手机目录、明暗主题、章节导航和代码高亮。所有用户与开发说明均保存在 `docs/`。

## 构建和预览

```bash
python3 -m venv .venv-docs
.venv-docs/bin/pip install -r docs/requirements.txt
.venv-docs/bin/sphinx-build -W --keep-going -d output/doctrees -b html docs client/public/manual
python3 -m http.server 4174 --bind 127.0.0.1 --directory client/public/manual
```

打开 `http://127.0.0.1:4174`。也可以在运行中的 Vite 客户端通过“使用手册”进入 `/manual/index.html`。

`-d output/doctrees` 把可能包含本机路径的构建缓存留在发布目录以外。`-W` 将警告视为失败，避免目录遗漏、引用断裂等问题被忽略。生成目录不入版本库；提交 Markdown、配置、品牌图片和样式即可。

## 在 Read the Docs 托管

仓库根目录已提供 `.readthedocs.yaml`：

1. 将源码推送到你拥有的 Git 仓库。
2. 在 Read the Docs 账号中导入该仓库。
3. 保留配置文件路径 `.readthedocs.yaml`，触发构建。
4. 构建成功后，Read the Docs 分配该项目的文档地址；再按需要配置自定义域名。

配置使用 Ubuntu 24.04、Python 3.13，从 `docs/requirements.txt` 安装依赖并读取 `docs/conf.py`。当前没有代替用户创建 Read the Docs 账号或发布公开项目；仅生成和验证了可托管产物与配置。

若把项目放入更大的 monorepo，需调整 RTD 配置中的所有相对路径（路径相对于仓库根，而不是配置文件目录）。

## 页面规范

一页围绕一个任务。先写用户要做什么，再给准确操作和实际限制。API、配置和脚本变更同步更新对应文档。不要把已准备配置写成已经上线，不要把示例科研写成已发生事实。

新增页面加入 `index.md` 的 toctree。样式统一通过 `_static/onlyfunds.css`，保持蓝白主题与品牌图形。

## 参考文档

- [Sphinx / Furo 入门](https://pradyunsg.me/furo/quickstart/)
- [Read the Docs 配置参考](https://docs.readthedocs.com/platform/stable/config-file/v2.html)
- [Vite 静态部署指南](https://vite.dev/guide/static-deploy.html)
- [MDN 混合内容限制](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content)
- [Remotion 参数与 CLI](https://www.remotion.dev/docs/cli/render)
