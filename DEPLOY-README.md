# 🚀 Zeabur 部署指南

## 📋 部署前準備

✅ **已完成的配置：**
- 數據收集頻率已設定為每天凌晨2點（台北時間）自動更新
- 服務器端口已配置為使用環境變數 `process.env.PORT`
- package.json 已正確設置啟動腳本
- Zeabur 配置文件 `zbpack.json` 已創建
- Zeabur 將自動檢測為 Node.js 項目

## 🌐 Zeabur 部署步驟

### 1. 準備代碼倉庫
確保您的代碼已推送到 GitHub 倉庫：

```bash
git add .
git commit -m "準備Zeabur部署：添加定時任務和配置文件"
git push origin main
```

### 2. 在 Zeabur 上一鍵部署

1. **登入 Zeabur**
   - 前往 [zeabur.com](https://zeabur.com)
   - 使用 GitHub 帳號登入

2. **創建新專案**
   - 點擊 "Create Project"
   - 選擇 "Deploy New Service"
   - 選擇 "Git" 選項

3. **連接 GitHub 倉庫**
   - 搜尋並選擇您的 `axg-fps-heatmap` 倉庫
   - 點擊 "Import"

4. **自動部署**
   - Zeabur 會自動偵測為 Node.js 專案
   - 自動執行 `npm install` 安裝依賴
   - 自動執行 `npm start` 啟動應用
   - 等待部署完成（約2-3分鐘）

### 3. 配置域名（可選）
1. 在服務面板中點擊 "Networking"
2. 點擊 "Generate Domain" 獲取免費子域名
3. 或綁定自定義域名

### 4. 環境變數配置（可選）
如需設置特殊環境變數，在服務面板中：
1. 點擊 "Environment Variables"
2. 添加以下變數（如需要）：
   ```
   GOOGLE_TRENDS_API_KEY=your_api_key
   TIMEZONE=Asia/Taipei
   NODE_ENV=production
   ```

## 🤖 Zeabur 自動化功能

### 自動檢測和配置：
- **🔍 項目檢測**：自動識別為 Node.js 項目
- **🐳 運行環境**：自動配置 Node.js 18.x 環境
- **📦 依賴安裝**：自動執行 `npm install`
- **🚀 應用啟動**：自動執行 `npm start`
- **🌐 端口配置**：自動設置 PORT 環境變數
- **🔒 SSL 證書**：免費提供 HTTPS 加密

### 您無需手動設置：
- ❌ Docker 容器（直接使用 Node.js 運行時）
- ❌ 端口映射（自動處理）
- ❌ 環境變數 PORT（自動設置）
- ❌ 構建流程（使用 package.json 自動配置）

## 📊 部署後功能確認

部署成功後，您的應用將具備以下功能：

### ⏰ 自動數據更新
- **頻率**：每天凌晨2點（台北時間）
- **內容**：所有FPS遊戲的熱度數據
- **無需手動干預**

### 🌐 API 端點
- **主頁**：`https://your-domain.zeabur.app/`
- **遊戲列表**：`/api/games`
- **台灣排行榜**：`/api/taiwan-ranking`
- **全球地區統計**：`/api/global-regions`
- **地區對比**：`/api/region-comparison?regions=美國,日本,台灣`

### 🎮 支援的遊戲
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

## 🔧 本地開發

如需在本地繼續開發：

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 或直接啟動
npm start
```

## 📈 監控和日誌

在 Zeabur 面板中可以：
- 查看服務狀態和資源使用情況
- 檢視應用日誌
- 監控定時任務執行情況
- 查看部署歷史

## 🛠️ 故障排除

### 常見問題：

1. **部署失敗**
   - 檢查 package.json 中的依賴是否正確
   - 確認 node_modules 已在 .gitignore 中

2. **定時任務不執行**
   - 檢查服務器時區設置
   - 查看應用日誌確認cron任務狀態

3. **數據庫問題**
   - Zeabur 提供持久化存儲
   - data/ 目錄中的 SQLite 數據庫會自動保持

4. **API 無法訪問**
   - 確認服務狀態為 "Running"
   - 檢查網路設置和域名配置

## 📞 支援

如遇到問題：
- 查看 [Zeabur 文檔](https://zeabur.com/docs/zh-TW/)
- 加入 [Zeabur Discord 社群](https://discord.gg/zeabur)
- 檢查本專案的 GitHub Issues

---

🎉 **恭喜！您的FPS遊戲熱度追踪器現在可以一鍵部署，24/7運行，每天自動更新數據！**

💡 **簡單流程**：GitHub推送 → Zeabur自動檢測 → 自動部署 → 立即可用！ 