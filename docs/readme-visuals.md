# README 视觉资产

封面与架构图使用 Codex 内置 GPT-Image 生成，均采用白底、深蓝文字、青蓝强调色。封面中的手机和桌面来自本项目真实 UI 的虚构演示数据；手写短评为编辑文案，不代表真实用户评价。图中网址统一为 `only-funds.github.io`。

## 发布资产

| 文件 | 用途 | 导出规格 |
| --- | --- | --- |
| `assets/onlyfunds-cover.webp` | README 产品封面 | WebP，质量 88，最长宽度 1600 px，不放大原图 |
| `assets/onlyfunds-architecture.webp` | README 架构说明 | WebP，质量 88，宽度 1920 px，约 2.35:1 |

压缩由 Sharp 完成，导出时不保留 EXIF、设备或位置元数据。生成 PNG、原始 UI 截图和中间修改版留在本机，不随源码和静态网站发布。架构图移除了底部标语，并改用较扁的布局，为文字留出空间；准确的接口和安全边界以[架构文档](architecture.md)及源码为准。

![OnlyFunds 封面](assets/onlyfunds-cover.webp)

![OnlyFunds 架构](assets/onlyfunds-architecture.webp)

## 封面生成提示词

参考图依次为已有品牌图、390 px 手机动态页、1440 px 桌面动态页。

```text
Use case: compositing. Asset type: a polished GitHub README cover for the actual OnlyFunds research lab web app. Create a wide 16:10 white-background Apple editorial / product-launch style cover with exceptional visual weight balance and restrained harmonious colors. Input image 1 is the actual brand logo: preserve the blue millstone O, PhD donkey F, and OnlyFunds lettering. Input image 2 is a real mobile app screenshot; insert it faithfully as the screen in a thin elegant front-facing silver smartphone, do not redesign the UI or invent substitute text. Input image 3 is the actual desktop web app screenshot; insert it faithfully inside a subtle floating white browser window, readable as real research feed UI. Composition: compact brand lockup and generous negative space in upper left, a large desktop window anchoring the center-right and a smaller phone slightly overlapping at the front-left of the window; balance their weights, avoid clutter, keep all contents on canvas with broad white margins. Pure white #FFFFFF backdrop, soft barely visible grounding shadows, elegant clean editorial typography, navy text, cyan accents, pale blue notes. No Apple logo, no giant devices, no unrelated decoration. Exact main headline under brand: "Good research. Good company." Exact small subtitle: "A little progress, every day." Add two short, lightly handwritten navy annotations as playful product impressions, not attributed testimonials: "Weekly updates, finally fun." and "Less chasing. More discovery." Use thin curved sketch arrows pointing toward the app screens and a tiny hand-drawn cyan star. These are editorial notes, no fake ratings, no review names, no made-up awards. Keep screenshot panels crisp and do not overfill the layout. The mood is calm, smart, welcoming and lightly humorous, with ample white space. Only the supplied OnlyFunds icon and app interface are the product.
```

网址修正：

```text
Precise edit of the provided finished OnlyFunds cover. Change ONLY the website address shown in the small desktop browser address bar from 'onlyfunds.org' to the exact text 'only-funds.github.io' (include the hyphen between only and funds). Preserve every other pixel as closely as possible: white background, logo, screenshots, handwritten notes, layout, proportions, navy/cyan colors and shadows. Do not alter app screenshot text, redraw the devices, or add anything else. Ensure the complete correct URL fits cleanly in the address bar.
```

## 架构图生成提示词

```text
Use case: infographic-diagram. Asset type: OnlyFunds software architecture diagram for a GitHub README, a wide 16:10 landscape diagram on pure white, clean Apple editorial design, calm navy and cyan palette, very legible English labels. Make the actual architecture accurate, with clear arrows and balanced visual weight. Title exact "OnlyFunds, by design." Subtitle exact "A static client. Your lab's server. A creator's toolkit." Three main rounded panels: LEFT "Browser client" with simple phone + browser icons and labels "React + TypeScript", "Profile → Settings → Server", "Local demo / private lab mode"; CENTER-RIGHT "Your lab server" inside a pale-blue privacy boundary labeled "Self-hosted · Docker Compose", with internal stacked components "Caddy · HTTPS" then "Express · REST API" then two small connected storage boxes "SQLite" and "Media files". BOTTOM-LEFT "Creator toolchains" with a slim pipeline "Markdown / Notion / SiYuan exports" → "AI-assisted storyboard" → "Remotion video" → "Publish API". A smaller TOP-LEFT cloud panel "GitHub Pages" with exact URL "only-funds.github.io" and labels "Static client + manual" and "No lab accounts or research data". Arrow from GitHub Pages DOWN to Browser client labeled "Download web app". A clear bidirectional arrow Browser client ↔ Your lab server labeled "HTTPS · user session". A separate arrow Creator toolchains → Express API labeled "HTTPS · scoped publishing token". Storage boxes only connect within the lab server; no private-data arrows to GitHub Pages. No database icon inside client or GitHub cloud. Bottom footer exact "Research lives with your lab. Rewards are pledges, not payments." Add small explanatory captions inside each main panel, simple icons, ample whitespace, a precise grid, consistent typography, no tiny dense text, no decorative 3D hardware. English only. No cloud AI service icon or claim all AI runs locally. All spelling and arrows must be correct.
```

组件说明修正：

```text
Precise correction of this finished architecture diagram. Keep the complete diagram composition, headings, arrows, icons, all panels and pure white background unchanged. The website in the GitHub Pages panel must remain exactly 'only-funds.github.io'. In the Caddy · HTTPS box, replace the small subtitle 'TLS termination, reverse proxy, static assets' with exactly 'TLS termination · API reverse proxy'. In the Express · REST API box, replace its small subtitle with exactly 'Auth · posts · interactions · media uploads'. These are the only edits. Preserve sharp readable type and the original layout.
```

最终横版重排与去除标语：

```text
Edit this OnlyFunds architecture illustration into a flatter, wider README diagram, approximately 2.35:1 landscape. Remove the entire bottom footer sentence 'Research lives with your lab. Rewards are pledges, not payments.' AND its horizontal divider, leaving no footer or replacement slogan. Re-layout the diagram, do not merely stretch or squeeze it: reduce overall height, slim the title/header area and oversized icons, give explanatory text and component labels more horizontal room and comfortable spacing. Keep a pure white Apple-editorial background and the existing navy/cyan palette, rounded pale-blue cards, crisp large legible typography. Keep title 'OnlyFunds, by design.' and subtitle 'A static client. Your lab’s server. A creator’s toolkit.' as a compact top row. Arrange a compact 'GitHub Pages' card in the upper-left, 'Browser client' below it; a slim 'Creator toolchains' pipeline across the bottom-left; and a broad 'Your lab server' panel on the right. The GitHub Pages URL must be EXACTLY 'only-funds.github.io' including the hyphen, and its labels 'Static client + manual' / 'No lab accounts or research data'. Browser labels: 'React + TypeScript', 'Profile → Settings → Server', 'Local demo / private lab mode'. Creator pipeline: 'Markdown / Notion / SiYuan exports' → 'AI-assisted storyboard' → 'Remotion video' → 'Publish API'. Lab server boundary label 'Self-hosted · Docker Compose'; internal Caddy · HTTPS with subtitle 'TLS termination · API reverse proxy'; arrow to Express · REST API with subtitle 'Auth · posts · interactions · media uploads'; branches to SQLite and Media files storage. Keep correct data flows: GitHub Pages → Browser client labeled 'Download web app'; Browser client ↔ lab API labeled 'HTTPS · user session'; Publish API → lab API labeled 'HTTPS · scoped publishing token'. No arrows sending private lab data to GitHub Pages. Remove redundant prose and decoration so all labels have room. Ensure all words are clean, correctly spelled, and not ghosted/overprinted. No footer.
```
