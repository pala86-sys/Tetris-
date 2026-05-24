# 俄羅斯方塊 Tetris

支援單人、本地雙人、AI 對戰與**線上對戰**的瀏覽器俄羅斯方塊。

## 本機遊玩

```bash
# 安裝依賴並啟動（網頁 + WebSocket 同一埠）
npm install
npm start
```

瀏覽器開啟：**http://localhost:3001**

或使用 `start.bat`（Windows）。

---

## 使用 GitHub + Render 部署

本專案為**單一 Web 服務**：同時提供靜態網頁與 WebSocket，適合 Render 免費方案。

### 步驟 1：推送到 GitHub

```bash
cd Tetris
git init
git add .
git commit -m "Initial commit: Tetris with online multiplayer"
git branch -M main
git remote add origin https://github.com/你的帳號/tetris.git
git push -u origin main
```

> `node_modules/` 已在 `.gitignore`，不要提交。

### 步驟 2：在 Render 建立服務

1. 登入 [Render](https://render.com/)
2. **New +** → **Blueprint**（若 repo 有 `render.yaml`）  
   或 **Web Service** → 連接你的 GitHub repo
3. 建議設定：

| 欄位 | 值 |
|------|-----|
| **Root Directory** | （留空，使用專案根目錄） |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |

4. 方案選 **Free** 即可
5. 部署完成後會得到網址，例如：  
   `https://tetris-xxxx.onrender.com`

### 步驟 3：遊玩線上對戰

1. 兩位玩家都開啟**同一個 Render 網址**
2. 主選單 → **線上對戰**
3. **伺服器位址留空**（會自動使用 `wss://你的網域`）
4. 一人建立房間、分享 6 碼代碼，另一人加入 → 雙方按**準備**

---

## 注意事項（Render 免費版）

- 閒置約 **15 分鐘** 會休眠，首次連線需等待約 **30～60 秒** 喚醒
- 休眠時 WebSocket 會斷線，需重新整理頁面
- 免費方案資源有限，同時房間不宜過多

若需要 24 小時穩定連線，可升級 Render 付費方案。

---

## 專案結構

```
Tetris/
├── index.html          # 遊戲頁面
├── css/ js/            # 前端
├── server/index.js     # HTTP + WebSocket 伺服器
├── package.json        # Render 啟動用
├── render.yaml         # Render Blueprint（可選）
└── start.bat           # Windows 本機啟動
```

## 操作

**玩家 1：** ← → 移動 · ↑ 旋轉 · ↓ 軟降 · 空白 硬降 · C 保留  

線上對戰僅需玩家 1 按鍵（對手在遠端操作）。
