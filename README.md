# 玉环·巧解 — Upgrade v2

这是清理并升级后的静态 Three.js 版本，可直接部署到 GitHub Pages、Cloudflare Pages、Netlify 或 Vercel。

## 上传方式

请先删除仓库根目录旧文件，再上传本压缩包**内部的全部内容**。不要把最外层文件夹套进去。

最终根目录应为：

```text
index.html
styles.css
README.md
src/
assets/
```

旧版这些文件不要保留：

```text
app.js
game.js
levels.js
style.css
art-direction.png
```

## 最常修改的位置

- `src/config/levels.js`：关卡、玉环位置、开口、金扣顺序
- `src/engine/Ring.js`：草莓晶玉环外观
- `src/engine/Clasp.js`：金扣外观
- `styles.css`：UI、颜色、布局
- `src/engine/Game.js`：解扣判定与通关逻辑

## 已修复

- 最后一只玉环不消失、无法通关
- 所有金扣开局可见
- 一次滑动最多解开当前顺序的一枚金扣
- 缺口必须经过目标角度，不再随便一转就解开
- 项目根目录不再混用 `style.css/styles.css` 与旧 `game.js/app.js`

## 本地运行

ES Module 不能直接双击运行。请在项目目录运行：

```bash
python3 -m http.server 8080
```

打开 `http://localhost:8080`。
