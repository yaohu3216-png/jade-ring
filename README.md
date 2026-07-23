# 玉环·巧解 — Rebuild v1

全新重构的可编辑 Three.js 网页版本。

## 已实现
- Three.js 3D 草莓晶玉环：透明、折射、清漆、高光、晶体内含物
- 3D 鎏金金扣，所有金扣开局全部显示
- 严格顺序解扣：只有当前发光金扣可解
- 必须旋转指定玉环，让缺口精确对准金扣
- 解完约束后玉环自动化光消失
- **最后一只玉环会自动消失并正确弹出通关界面**
- 3 个可编辑关卡
- 移动端触摸操作
- Bloom 辉光、花瓣与珠宝灯光

## 修改位置
- `levels.js`：关卡位置、开口方向、金扣顺序
- `app.js`：材质、玩法判定、动画
- `styles.css`：UI
- `assets/art-direction.png`：美术方向图，仅作为背景氛围参考

## 运行
Three.js 从 CDN 加载，因此不要直接双击 `index.html`。使用任一静态服务器：

```bash
python3 -m http.server 8080
```

打开 `http://localhost:8080`。

上传 GitHub Pages、Cloudflare Pages、Netlify 或 Vercel 后可直接运行。

## 关卡规则
每枚金扣的 `order` 决定唯一解锁顺序。当前可解金扣会发光，其他金扣依然显示但变暗。`guest` 是必须旋转的玉环，`angle` 是该环开口需要到达的角度。
