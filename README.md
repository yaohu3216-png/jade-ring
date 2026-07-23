# 玉环·巧解 — Flat Fix v3

这是专门为手机 GitHub 上传方式整理的**根目录直传版**。没有 `src/` 和 `assets/` 文件夹，避免手机上传时被压平后出现空白。

## 必须上传的全部文件

```text
index.html
styles.css
levels.js
app.js
three.module.min.js
bgm.mp3
README.md
```

所有文件必须位于仓库根目录。

## 旧文件建议删除

```text
Game.js
Ring.js
Clasp.js
main.js
materials.js
style.css
game.js
```

这些旧文件不参与新版运行，但删除后更清晰。

## 本版修复

- 修复因 `src/main.js` 与 `assets/audio/bgm.mp3` 路径不存在导致的空白画面。
- Three.js 已经放进项目，不再依赖外部 CDN。
- 增加加载失败提示，不会再静默白屏。
- 草莓晶玉环加粗，并加入玉肉、晶点、柔光、高光和真实端面。
- 金扣改为光滑鎏金套扣，少量圆钻点缀。
- 棋盘改为粉晶玉盘、金边、荷花暗纹和珠光粒子。
- 最后一只玉环会自动消失并正常通关。
- 五个关卡，全部金扣开局显示。

## 修改关卡

编辑 `levels.js`。
