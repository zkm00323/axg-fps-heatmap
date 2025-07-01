const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 8080;

// 確保data資料夾存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('✅ 已創建data資料夾');
    } catch (error) {
        console.error('❌ 創建data資料夾失敗:', error.message);
    }
}

// 延遲加載模組，確保資料夾已創建
let improvedGameDataCollector, dataProcessor, database;

const loadModules = () => {
    try {
        improvedGameDataCollector = require('./src/collectors/improvedGameDataCollector');
        dataProcessor = require('./src/processors/dataProcessor');
        database = require('./src/database/database');
        console.log('✅ 模組載入成功');
        return true;
    } catch (error) {
        console.error('❌ 模組載入失敗:', error.message);
        return false;
    }
};

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'FPS遊戲熱度追踪器'
    });
});

// 靜態文件路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API路由 - 加入錯誤處理
app.get('/api/games', async (req, res) => {
    try {
        if (!dataProcessor) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
        const games = await dataProcessor.getAllGames();
        res.json(games);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取遊戲數據失敗' });
    }
});

app.get('/api/games/:gameName/stats', async (req, res) => {
    try {
        if (!dataProcessor) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
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
        if (!database) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
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
        if (!database) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
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
        if (!database) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
        const globalRegionStats = await database.getGlobalRegionStats();
        res.json(globalRegionStats);
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取全球地區統計失敗' });
    }
});

app.get('/api/trending', async (req, res) => {
    try {
        if (!dataProcessor) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
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
        if (!database) {
            return res.status(503).json({ error: '服務初始化中，請稍後再試' });
        }
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

// 初始化和啟動服務器
const startServer = () => {
    console.log(`🚀 FPS遊戲熱度追踪器啟動中...`);
    console.log(`📊 使用多平台數據收集技術`);
    console.log(`🌍 包含全球地區熱度分析`);
    console.log(`🇹🇼 特別支持台灣地區熱度追踪`);
    console.log(`🌐 準備在端口 ${PORT} 啟動服務器`);
    console.log('');

    // 啟動服務器
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ 服務器已啟動成功！`);
        console.log(`🌐 服務器運行在端口: ${PORT}`);
        console.log(`🎯 服務狀態: 運行中`);
        console.log('');
        console.log(`📌 API端點:`);
        console.log(`   🏥 健康檢查: /health`);
        console.log(`   🎮 遊戲列表: /api/games`);
        console.log(`   🇹🇼 台灣排行榜: /api/taiwan-ranking`);
        console.log(`   🌍 全球地區統計: /api/global-regions`);
        console.log(`   📊 地區對比: /api/region-comparison?regions=美國,日本,台灣`);
        console.log('');
        
        // 服務器啟動成功後，開始初始化數據模組
        console.log('🔄 開始初始化數據模組...');
        initializeDataModules();
    });

    // 處理服務器錯誤
    server.on('error', (error) => {
        console.error('❌ 服務器啟動失敗:', error.message);
        process.exit(1);
    });
};

// 初始化數據模組
const initializeDataModules = () => {
    setTimeout(() => {
        console.log('📦 載入數據處理模組...');
        
        if (loadModules()) {
            console.log('✅ 數據模組載入成功');
            
            // 設置定時任務
            setupCronJobs();
            
            // 延遲初始化數據收集（非阻塞）
            setTimeout(() => {
                console.log('🔄 開始初始化數據收集...');
                performInitialDataCollection();
            }, 5000); // 5秒後開始數據收集
        } else {
            console.log('⚠️ 數據模組載入失敗，某些功能可能無法使用');
            console.log('💡 服務器仍將繼續運行，稍後會重試初始化');
            
            // 重試初始化
            setTimeout(initializeDataModules, 30000); // 30秒後重試
        }
    }, 2000); // 2秒後開始初始化
};

// 設置定時任務
const setupCronJobs = () => {
    if (!improvedGameDataCollector) {
        console.log('⚠️ 數據收集器未就緒，跳過定時任務設置');
        return;
    }

    // 🔄 設置定時任務：每天凌晨2點更新數據
    cron.schedule('0 2 * * *', async () => {
        console.log('📅 開始執行每日數據更新任務...');
        try {
            await improvedGameDataCollector.collectAllData();
            console.log('✅ 每日數據更新完成');
        } catch (error) {
            console.error('❌ 每日數據更新失敗:', error.message);
        }
    }, {
        timezone: "Asia/Taipei"
    });
    
    console.log('⏰ 已設置每日數據更新任務（每天凌晨2點，台北時間）');
};

// 執行初始數據收集
const performInitialDataCollection = async () => {
    if (!improvedGameDataCollector) {
        console.log('⚠️ 數據收集器未就緒，跳過初始數據收集');
        return;
    }

    try {
        await improvedGameDataCollector.collectAllData();
        console.log('✅ 初始數據收集完成');
    } catch (error) {
        console.error('❌ 初始數據收集失敗:', error.message);
        console.log('💡 將在下次定時任務時重新收集數據');
    }
};

// 優雅關閉處理
process.on('SIGTERM', () => {
    console.log('🛑 收到終止信號，正在優雅關閉服務器...');
    if (database && database.db) {
        database.db.close((err) => {
            if (err) {
                console.error('關閉數據庫連接時出錯:', err.message);
            } else {
                console.log('✅ 數據庫連接已關閉');
            }
        });
    }
    process.exit(0);
});

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕獲的異常:', error.message);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未處理的Promise拒絕:', reason);
});

// 啟動服務器
startServer();

module.exports = app; 