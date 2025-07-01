const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

// 中間件設置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 模擬遊戲數據（內存存儲，避免數據庫問題）
const gamesData = [
    {
        id: 1,
        name: 'Counter-Strike 2',
        heat_score: 95,
        taiwan_heat_score: 88,
        region_scores: {
            '美國': 92,
            '歐洲': 89,
            '台灣': 88,
            '日本': 75,
            '韓國': 85
        },
        platforms: ['Steam', 'Twitch'],
        last_updated: new Date().toISOString()
    },
    {
        id: 2,
        name: 'VALORANT',
        heat_score: 90,
        taiwan_heat_score: 95,
        region_scores: {
            '美國': 88,
            '歐洲': 85,
            '台灣': 95,
            '日本': 92,
            '韓國': 98
        },
        platforms: ['Steam', 'Twitch'],
        last_updated: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Apex Legends',
        heat_score: 85,
        taiwan_heat_score: 82,
        region_scores: {
            '美國': 90,
            '歐洲': 88,
            '台灣': 82,
            '日本': 78,
            '韓國': 80
        },
        platforms: ['Steam', 'Twitch'],
        last_updated: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Call of Duty: Modern Warfare III',
        heat_score: 82,
        taiwan_heat_score: 75,
        region_scores: {
            '美國': 95,
            '歐洲': 85,
            '台灣': 75,
            '日本': 70,
            '韓國': 72
        },
        platforms: ['Steam', 'Twitch'],
        last_updated: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Overwatch 2',
        heat_score: 78,
        taiwan_heat_score: 85,
        region_scores: {
            '美國': 80,
            '歐洲': 82,
            '台灣': 85,
            '日本': 88,
            '韓國': 90
        },
        platforms: ['Steam', 'Twitch'],
        last_updated: new Date().toISOString()
    }
];

// 🏥 健康檢查端點
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'FPS遊戲熱度追踪器',
        data_source: 'memory'
    });
});

// 🏠 主頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🎮 獲取所有遊戲數據
app.get('/api/games', (req, res) => {
    try {
        res.json({
            success: true,
            data: gamesData,
            count: gamesData.length,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取遊戲數據失敗' });
    }
});

// 🇹🇼 台灣熱度排行榜
app.get('/api/taiwan-ranking', (req, res) => {
    try {
        const taiwanRanking = gamesData
            .sort((a, b) => b.taiwan_heat_score - a.taiwan_heat_score)
            .map((game, index) => ({
                rank: index + 1,
                name: game.name,
                taiwan_heat_score: game.taiwan_heat_score,
                global_heat_score: game.heat_score,
                difference: game.taiwan_heat_score - game.heat_score
            }));
        
        res.json({
            success: true,
            data: taiwanRanking,
            title: '台灣FPS遊戲熱度排行榜',
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取台灣熱度排行榜失敗' });
    }
});

// 🌍 全球地區統計
app.get('/api/global-regions', (req, res) => {
    try {
        const regionStats = {};
        
        // 計算每個地區的統計數據
        gamesData.forEach(game => {
            if (game.region_scores) {
                Object.entries(game.region_scores).forEach(([region, score]) => {
                    if (!regionStats[region]) {
                        regionStats[region] = {
                            total_score: 0,
                            game_count: 0,
                            games: []
                        };
                    }
                    regionStats[region].total_score += score;
                    regionStats[region].game_count += 1;
                    regionStats[region].games.push({
                        name: game.name,
                        score: score
                    });
                });
            }
        });
        
        // 計算平均分數
        const processedStats = Object.entries(regionStats).map(([region, stats]) => ({
            region,
            average_score: Math.round(stats.total_score / stats.game_count),
            total_score: stats.total_score,
            game_count: stats.game_count,
            top_game: stats.games.sort((a, b) => b.score - a.score)[0]
        })).sort((a, b) => b.average_score - a.average_score);
        
        res.json({
            success: true,
            data: processedStats,
            total_regions: processedStats.length,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取全球地區統計失敗' });
    }
});

// 📊 地區對比API
app.get('/api/region-comparison', (req, res) => {
    try {
        const { regions } = req.query;
        if (!regions) {
            return res.status(400).json({ error: '請提供要對比的地區參數：?regions=美國,日本,台灣' });
        }
        
        const regionList = regions.split(',').map(r => r.trim());
        
        const comparison = gamesData.map(game => {
            const regionComparison = {};
            regionList.forEach(region => {
                regionComparison[region] = game.region_scores?.[region] || 0;
            });
            
            return {
                game_name: game.name,
                global_score: game.heat_score,
                taiwan_score: game.taiwan_heat_score,
                region_scores: regionComparison
            };
        });
        
        res.json({
            success: true,
            data: comparison,
            compared_regions: regionList,
            game_count: comparison.length,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取地區對比數據失敗' });
    }
});

// 📈 熱門遊戲（按全球熱度排序）
app.get('/api/trending', (req, res) => {
    try {
        const trending = gamesData
            .sort((a, b) => b.heat_score - a.heat_score)
            .slice(0, 10)
            .map((game, index) => ({
                rank: index + 1,
                name: game.name,
                heat_score: game.heat_score,
                taiwan_score: game.taiwan_heat_score,
                top_regions: Object.entries(game.region_scores)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([region, score]) => ({ region, score }))
            }));
        
        res.json({
            success: true,
            data: trending,
            title: '全球熱門FPS遊戲',
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取熱門遊戲失敗' });
    }
});

// 📊 統計概覽
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            total_games: gamesData.length,
            average_global_score: Math.round(gamesData.reduce((sum, game) => sum + game.heat_score, 0) / gamesData.length),
            average_taiwan_score: Math.round(gamesData.reduce((sum, game) => sum + game.taiwan_heat_score, 0) / gamesData.length),
            top_global_game: gamesData.reduce((top, game) => game.heat_score > top.heat_score ? game : top),
            top_taiwan_game: gamesData.reduce((top, game) => game.taiwan_heat_score > top.taiwan_heat_score ? game : top),
            regions_covered: [...new Set(gamesData.flatMap(game => Object.keys(game.region_scores || {})))].length
        };
        
        res.json({
            success: true,
            data: stats,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API錯誤:', error);
        res.status(500).json({ error: '獲取統計數據失敗' });
    }
});

// 啟動服務器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FPS遊戲熱度追踪器啟動中...`);
    console.log(`📊 使用內存數據存儲（避免數據庫問題）`);
    console.log(`🌍 包含全球地區熱度分析`);
    console.log(`🇹🇼 特別支持台灣地區熱度追踪`);
    console.log('');
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
    console.log(`   📈 熱門遊戲: /api/trending`);
    console.log(`   📊 統計概覽: /api/stats`);
    console.log('');
    console.log(`💡 注意：此版本使用內存數據，重啟後數據會重置`);
});

// 處理服務器錯誤
server.on('error', (error) => {
    console.error('❌ 服務器啟動失敗:', error.message);
    process.exit(1);
});

// 優雅關閉處理
process.on('SIGTERM', () => {
    console.log('🛑 收到終止信號，正在優雅關閉服務器...');
    server.close(() => {
        console.log('✅ 服務器已關閉');
        process.exit(0);
    });
});

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕獲的異常:', error.message);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未處理的Promise拒絕:', reason);
});

module.exports = app; 