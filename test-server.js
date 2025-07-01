// 簡單的服務器測試文件
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 基本中間件
app.use(express.json());
app.use(express.static('public'));

// 健康檢查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'FPS遊戲熱度追踪器測試服務器正常運行',
        timestamp: new Date().toISOString() 
    });
});

// 主頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 測試API
app.get('/api/test', (req, res) => {
    res.json({
        message: '測試API正常',
        server: 'FPS遊戲熱度追踪器',
        port: PORT,
        time: new Date().toISOString()
    });
});

// 啟動服務器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧪 測試服務器運行在端口: ${PORT}`);
    console.log(`✅ 基本功能測試正常`);
    console.log(`🌐 訪問 /health 檢查服務狀態`);
    console.log(`🎯 訪問 /api/test 測試API`);
});

module.exports = app; 