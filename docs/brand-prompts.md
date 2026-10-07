# 品牌生成提示词

此页记录本项目实际使用的内置 GPT-Image 生成提示词要点，不需要 API key 或本地生成脚本。

## 初版：角色化品牌图

> Create a polished transparent OnlyFunds logo. Preserve the recognizable OF arrangement: cyan circular O with a central hole, blue sweeping F. Interpret O as a grinding millstone with radial grooves. Interpret F as a determined PhD donkey wearing a mortarboard and a white lab coat, with the exact text “PhD” on its collar. The donkey is harnessed to turn the millstone. Below, write exactly “OnlyFunds”, with a rounded dark Only and cyan flowing script Funds. Clean vector-like academic humor, tightly framed, no additional labels or background.

## 轮廓调整

> Use the original OF monogram as a strict outline reference. Keep both F bars and the slanted stem recognizable. Fit the donkey ears, academic cap, muzzle and lab-coat body inside the F silhouette; keep the O circular and show millstone grooves inside it. Preserve the PhD collar and OnlyFunds wordmark. Flat cyan/azure/white palette, transparent background, no glow or shadow.

图标是模型生成的近似设计；需要严格几何一致的商用矢量资产时，后续应进行独立的矢量制图与视觉审校。

## 最终采用版：白底清晰图标（完整提示词）

使用内置 GPT-Image，输入为原始 OF 轮廓参考和初版 PhD 吉祥物；背景设置为不透明，以避免透明版本出现的边缘光晕。发布文件：`client/public/brand/onlyfunds-logo.webp`。生成 PNG 与初版吉祥物归档于本机 `output/source-artwork/`，不进入源码与静态部署仓库。

```text
Production flat logo on a PURE SOLID WHITE #FFFFFF background. Wide horizontal 3:2 brand lockup. Large OF monogram above and wordmark OnlyFunds below. Image 1 is the exact required outer silhouette of OF: circular O on left, slanted F with two long curved tapered bars on right. Preserve that silhouette as closely as possible. Replace the O interior with simple radial millstone grooves and preserve a white circular center hole. Fill the interior of F with a clever minimal illustration of the PhD donkey from image 2: long donkey ear along the top F bar, the face/muzzle along the middle bar, lab coat along the F stem, small academic cap contained in top bar, white coat with exact readable 'PhD' on collar. All details are inside the original OF silhouette, no parts stick out. Tiny internal shaft links millstone to donkey. Keep this very flat and professional like a vector emblem, limited cyan #00AFF0, blue #008CCF, white and navy. Add exact 'OnlyFunds' below, with Only in opaque dark navy rounded sans and Funds in bold cyan flowing handwritten script inspired by the reference. NO gradients, NO neon, NO haze, NO glow, NO shadows. The entire background must be uniform opaque pure white, including all negative spaces. Crisp clean logo edges and legible lettering. Only one final logo, no mockup, no texture, no other text.
```

## 导航横版：清理裁片边缘并适配居中顶栏

输入参考为已采用的 `onlyfunds-logo.png`。内置 GPT-Image 完成横版编辑后，裁去外围白边并导出为 720 × 160 的 WebP（质量 90，22,702 字节）。导航直接展示这一完整文件，不再拼接两块裁片。

```text
Edit this provided OnlyFunds brand artwork into an exceptionally clean horizontal navigation-bar lockup on an absolutely uniform pure white background. Preserve the existing recognizable blue millstone O and blue donkey F with graduation cap, white lab coat, tiny PhD collar lettering, and its existing silhouette as faithfully as possible; do not invent a new mascot. Put that complete OF monogram on the LEFT, with a modest gap then the existing OnlyFunds wordmark on the RIGHT. Preserve the existing typography: dark navy rounded upright Only followed by cyan brush-script Funds. This is one single long horizontal row, visually balanced, with mascot height approximately equal to the wordmark height. Exact text: OnlyFunds. Clean all stray color specks, corner debris, shadow remnants, background texture, cropped strokes and fragments. No other text, icons, border, extra artwork, shadow, gradients in background, or repetitions. Center the complete horizontal lockup within a wide rectangular canvas with generous pure white margin. Aim for sharp professional web branding, readable when reduced to 170 pixels wide.
```
