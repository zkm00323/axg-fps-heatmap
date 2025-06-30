const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const improvedGameDataCollector = require('./src/collectors/improvedGameDataCollector');
const dataProcessor = require('./src/processors/dataProcessor');
const database = require('./src/database/database');

const app = express();
const PORT = process.env.PORT || 3001; // 使用環境變數PORT，Zeabur要求

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 靜態文件路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API路由
app.get('/api/games', async (req, res) => {
    try {
        const games = await dataProcessor.getAllGames();
        res.json(games);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取遊戲數據失敗' });
    }
});

app.get('/api/games/:gameName/stats', async (req, res) => {
    try {
        const gameName = decodeURIComponent(req.params.gameName);
        const stats = await dataProcessor.getGameStats(gameName);
        res.json(stats);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取遊戲統計失敗' });
    }
});

// 🌍 新增：遊戲地區數據API
app.get('/api/games/:gameName/regions', async (req, res) => {
    try {
        const gameName = decodeURIComponent(req.params.gameName);
        const regionData = await database.getGameRegionData(gameName);
        res.json(regionData);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取遊戲地區數據失敗' });
    }
});

// 🇹🇼 新增：台灣熱度排行榜API
app.get('/api/taiwan-ranking', async (req, res) => {
    try {
        const taiwanRanking = await database.getTaiwanHeatRanking();
        res.json(taiwanRanking);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取台灣熱度排行榜失敗' });
    }
});

// 🌍 新增：全球地區統計API
app.get('/api/global-regions', async (req, res) => {
    try {
        const globalRegionStats = await database.getGlobalRegionStats();
        res.json(globalRegionStats);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取全球地區統計失敗' });
    }
});

app.get('/api/trending', async (req, res) => {
    try {
        const trending = await dataProcessor.getTrendingGames();
        res.json(trending);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取熱門遊戲失敗' });
    }
});

// 🌍 新增：地區對比API
app.get('/api/region-comparison', async (req, res) => {
    try {
        const { regions } = req.query;
        if (!regions) {
            return res.status(400).json({ error: '請提供要對比的地區' });
        }
        
        const regionList = regions.split(',').map(r => r.trim());
        const games = await database.getAllGames();
        
        const comparison = games.map(game => {
            const regionComparison = {};
            regionList.forEach(region => {
                regionComparison[region] = game.region_scores?.[region] || 0;
            });
            
            return {
                game_name: game.name,
                global_score: game.avg_heat_score,
                taiwan_score: game.avg_taiwan_heat_score,
                region_scores: regionComparison,
                top_regions: game.top_regions
            };
        });
        
        res.json(comparison);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取地區對比數據失敗' });
    }
});

console.log(`🚀 改進版FPS遊戲熱度追踪器啟動中...`);
console.log(`📊 使用多平台數據收集技術`);
console.log(`🌍 包含全球地區熱度分析`);
console.log(`🇹🇼 特別支持台灣地區熱度追踪`);
console.log(`🌐 服務器將運行在 http://localhost:${PORT}`);
console.log('');

// 啟動服務器
app.listen(PORT, () => {
    console.log(`✅ 改進版FPS遊戲熱度追踪器已啟動`);
    console.log(`🌐 服務器運行在端口: ${PORT}`);
    console.log(`🎯 訪問主頁查看遊戲熱度數據！`);
    console.log('');
    console.log(`📌 API端點:`);
    console.log(`   🇹🇼 台灣熱度排行榜: /api/taiwan-ranking`);
    console.log(`   🌍 全球地區統計: /api/global-regions`);
    console.log(`   🎮 遊戲地區數據: /api/games/{遊戲名}/regions`);
    console.log(`   📊 地區對比: /api/region-comparison?regions=美國,日本,台灣`);
    console.log('');
    
    // 🔄 設置定時任務：每天凌晨2點更新數據
    cron.schedule('0 2 * * *', async () => {
        console.log('📅 開始執行每日數據更新任務...');
        try {
            await improvedGameDataCollector.collectAllData();
            console.log('✅ 每日數據更新完成');
        } catch (error) {
            console.error('❌ 每日數據更新失敗:', error);
        }
    }, {
        timezone: "Asia/Taipei" // 使用台北時區
    });
    
    console.log('⏰ 已設置每日數據更新任務（每天凌晨2點，台北時間）');
    console.log('');
    
    // 啟動時立即收集一次數據（非阻塞）
    console.log('🔄 正在初始化數據收集...');
    improvedGameDataCollector.collectAllData()
        .then(() => console.log('✅ 初始數據收集完成'))
        .catch(error => console.error('❌ 初始數據收集失敗:', error));
});

module.exports = app; 