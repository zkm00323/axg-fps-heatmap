# 🎯 FPS遊戲熱度追踪器

一個現代化的Web應用程式，用於實時監控和追踪熱門FPS遊戲的玩家活躍度和社群熱度。

## ✨ 功能特色

- 🎮 **多平台數據收集** - 從Steam、Twitch、YouTube、Reddit等平台收集遊戲熱度數據
- 📊 **即時熱度分析** - 智能計算遊戲熱度分數，提供客觀的熱門程度評估
- 📈 **趨勢追踪** - 追踪遊戲熱度的24小時變化趨勢
- 🎯 **FPS遊戲專注** - 專門追踪熱門FPS遊戲包括CS2、Valorant、Apex Legends等
- 💫 **美觀界面** - 現代化的響應式設計，支援手機和桌面設備
- ⚡ **自動更新** - 每天凌晨2點自動收集最新數據，確保信息及時性
- 🌐 **雲端部署** - 支援Zeabur一鍵部署，24/7不間斷運行

## 🎮 追踪的遊戲

- Counter-Strike 2
- Valorant
- Apex Legends
- Call of Duty: Modern Warfare III
- Overwatch 2
- Rainbow Six Siege
- Battlefield 2042
- Fortnite
- PUBG
- Destiny 2

## 🚀 快速開始

### 🌐 Zeabur 雲端部署（推薦）

**一鍵部署到雲端，24/7自動運行！**

1. **準備代碼**
   ```bash
   git add .
   git commit -m "準備Zeabur部署"
   git push origin main
   ```

2. **部署到 Zeabur**
   - 前往 [zeabur.com](https://zeabur.com)
   - 使用 GitHub 登入
   - 選擇您的倉庫並點擊 "Import"
   - 等待自動部署完成（約2-3分鐘）

3. **獲取域名**
   - 在服務面板中點擊 "Networking"
   - 生成免費子域名或綁定自定義域名

**✨ 部署後功能：**
- 每天凌晨2點自動更新數據
- 24/7不間斷運行
- 免費SSL證書
- 自動擴展

詳細部署指南請查看 [DEPLOY-README.md](./DEPLOY-README.md)

---

### 💻 本地開發

#### 環境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

#### 安裝步驟

1. **克隆或下載項目**
   ```bash
   # 如果您有git，可以克隆
   git clone <your-repo-url>
   cd axg-fps-heatmap
   
   # 或者直接在項目目錄中執行後續步驟
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動應用程式**
   ```bash
   # 開發模式（自動重啟）
   npm run dev
   
   # 或生產模式
   npm start
   ```

4. **訪問應用程式**
   打開瀏覽器，訪問 `http://localhost:8080`

## 📱 使用說明

### 主要功能

1. **遊戲排行榜**
   - 查看所有追踪遊戲的熱度排名
   - 支援按熱度、玩家數、觀看數排序
   - 顯示遊戲狀態（超熱門、熱門、普通等）

2. **趨勢分析**
   - 查看過去24小時的熱度變化
   - 識別上升和下降趨勢
   - 百分比變化顯示

3. **詳細圖表**
   - 選擇特定遊戲查看詳細數據趨勢
   - 多維度數據展示（熱度、玩家數、觀看數）
   - 過去48小時的時間序列圖表

4. **統計概覽**
   - 追踪遊戲總數
   - 熱門遊戲數量
   - 上升趨勢遊戲數
   - 總玩家數統計

### 熱度分數計算

熱度分數基於以下數據源和權重：
- Steam玩家數 (30%)
- Twitch觀看數 (40%)
- YouTube觀看數 (20%)
- Reddit討論數 (10%)

分數範圍：0-100，分數越高表示遊戲越熱門。

## 🛠️ 技術架構

### 後端技術
- **Node.js + Express** - 服務器框架
- **SQLite** - 數據庫存儲
- **node-cron** - 定時任務調度
- **axios** - HTTP請求處理

### 前端技術
- **原生JavaScript** - 前端邏輯
- **Chart.js** - 數據可視化
- **現代CSS** - 響應式設計和動畫效果

### 數據源集成
- **Steam API** - 玩家數據
- **模擬數據** - Twitch、YouTube、Reddit數據（可擴展為真實API）

## 📂 項目結構

```
axg-fps-heatmap/
├── src/
│   ├── collectors/
│   │   └── gameDataCollector.js    # 數據收集器
│   ├── database/
│   │   └── database.js             # 數據庫管理
│   └── processors/
│       └── dataProcessor.js        # 數據處理器
├── public/
│   ├── index.html                  # 主頁面
│   ├── styles.css                  # 樣式文件
│   └── script.js                   # 前端JavaScript
├── data/                           # 數據庫文件目錄
├── server.js                       # 主服務器文件
├── package.json                    # 項目配置
└── README.md                       # 項目說明
```

## ⚙️ 配置選項

### 環境變量
您可以創建 `.env` 文件來配置以下選項：

```env
PORT=8080                    # 服務器端口
DATABASE_PATH=./data/games.db # 數據庫路径
UPDATE_INTERVAL=3600000      # 更新間隔（毫秒）
```

### 自定義遊戲列表
編輯 `src/collectors/gameDataCollector.js` 中的 `fpsGames` 數組來添加或修改追踪的遊戲。

## 🔧 開發和擴展

### 添加新的數據源
1. 在 `gameDataCollector.js` 中添加新的數據收集方法
2. 更新 `calculateHeatScore` 方法中的權重計算
3. 修改數據庫結構（如需要）

### 集成真實API
目前系統使用模擬數據，您可以：
1. 申請Twitch API密鑰並替換 `getTwitchViewers` 方法
2. 集成YouTube Data API
3. 使用Reddit API獲取真實社群數據

### 自定義界面
- 修改 `public/styles.css` 來自定義外觀
- 編輯 `public/index.html` 來調整佈局
- 在 `public/script.js` 中添加新的互動功能

## 📊 API端點

- `GET /api/games` - 獲取所有遊戲數據
- `GET /api/games/:id/stats` - 獲取特定遊戲的統計數據
- `GET /api/trending` - 獲取趨勢遊戲數據

## 🐛 故障排除

### 常見問題

1. **數據庫連接錯誤**
   - 確保 `data` 目錄存在且有寫入權限
   - 檢查SQLite是否正確安裝

2. **API請求失敗**
   - 檢查網路連接
   - 確認Steam API是否可訪問

3. **前端無法載入數據**
   - 檢查瀏覽器控制台錯誤信息
   - 確認後端服務器正在運行

### 日誌查看
應用程式會在控制台輸出詳細的運行日誌，包括：
- 數據收集進度
- API請求狀態
- 數據庫操作結果

## 🤝 貢獻指南

歡迎提交Issue和Pull Request！

1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟Pull Request

## 📝 更新日誌

### v1.0.0 (2024)
- 🎉 初始版本發布
- ✨ 實現基本的遊戲熱度追踪功能
- 🎨 現代化的Web界面設計
- 📊 數據可視化和趨勢分析
- 🔄 自動數據更新機制

## 📄 許可證

本項目採用 MIT 許可證 - 詳見 [LICENSE](LICENSE) 文件

## 💡 未來計劃

- [ ] 添加更多遊戲平台支援
- [ ] 實現用戶自定義追踪列表
- [ ] 添加遊戲新聞和事件追踪
- [ ] 實現數據導出功能
- [ ] 添加移動應用支援
- [ ] 實現實時通知功能

---

**享受追踪您喜愛的FPS遊戲熱度！🎮🔥** 