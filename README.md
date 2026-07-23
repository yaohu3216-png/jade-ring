# 玉环·巧解｜渲染图方向可玩版 v1

这是根据已经确认的两张概念渲染图制作的可编辑网页游戏版本。

## 已实现

- 古典国风章节选择页
- 8 个玉石章节 × 每章 11 关，共 88 个关卡位
- 每章第 1 关永久免费试玩
- 已通关关卡可重复游玩，未解锁关卡显示锁
- 所有金扣开局全部显示
- 玉环圆心固定，只能旋转
- 只有外层可操作玉环能够解扣
- 缺口必须在一次有效旋转中精确越过金扣中心
- 每次手势最多解除一枚金扣
- 玉环解除全部约束后自动化光消失
- 最后一只玉环正常消失并触发通关弹窗
- 草莓晶、白玉髓、翡翠、紫晶、粉玉、天青、琥珀、墨玉主题
- 古风 BGM、玉石清脆叮当声、轻触音效
- 手机端触控适配

## 文件结构

```text
index.html
styles.css
levels.js
game.js
assets/
  bg-chapters.webp
  bg-pink.webp
  bg-white.webp
  bg-green.webp
  bg-purple.webp
  bg-blue.webp
  bg-gold.webp
  bg-black.webp
  bgm.mp3
  jade-chime.wav
  jade-tap.wav
```

## GitHub Pages 上传

1. 解压 ZIP。
2. 打开 GitHub 仓库 `jade-ring`。
3. 点击 `Add file` → `Upload files`。
4. 上传压缩包内的 `index.html`、`styles.css`、`levels.js`、`game.js` 和整个 `assets` 文件夹。
5. 点击 `Commit changes`。
6. 等待 1–3 分钟。
7. 打开：

```text
https://yaohu3216-png.github.io/jade-ring/?v=render-match-v1
```

## 主要修改位置

- `levels.js`：8 章主题、11 套关卡结构、玉环位置、金扣关系。
- `game.js`：旋转判定、外层依赖、自动消失、通关、存档、音效。
- `styles.css`：章节页、游戏 UI、按钮和手机布局。

## 玩法说明

玉环位置固定。拖动玉环管身，使 C 形缺口沿旋转方向精确越过发光金扣。外层玉环被解除后会自动消失，从而释放更深一层结构。
