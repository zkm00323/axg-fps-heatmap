const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/games.db');
        this.db = null;
        this.initDatabase();
    }

    initDatabase() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('數據庫連接錯誤:', err.message);
            } else {
                console.log('已連接到SQLite數據庫');
                this.createTables();
            }
        });
    }

    createTables() {
        const createGamesTable = `
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                steam_players INTEGER DEFAULT 0,
                estimated_total_players INTEGER DEFAULT 0,
                twitch_viewers INTEGER DEFAULT 0,
                youtube_views INTEGER DEFAULT 0,
                reddit_posts INTEGER DEFAULT 0,
                heat_score INTEGER DEFAULT 0,
                taiwan_heat_score INTEGER DEFAULT 0,
                main_platform TEXT,
                top_regions TEXT,
                region_scores TEXT,
                platform_analysis TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createGameStatsTable = `
            CREATE TABLE IF NOT EXISTS game_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_name TEXT NOT NULL,
                date DATE NOT NULL,
                avg_heat_score REAL DEFAULT 0,
                avg_taiwan_heat_score REAL DEFAULT 0,
                max_players INTEGER DEFAULT 0,
                peak_time TEXT,
                UNIQUE(game_name, date)
            )
        `;

        // 新增：地區數據表
        const createRegionDataTable = `
            CREATE TABLE IF NOT EXISTS region_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_name TEXT NOT NULL,
                region_name TEXT NOT NULL,
                region_score INTEGER DEFAULT 0,
                rank_in_region INTEGER DEFAULT 0,
                date_stamp DATE DEFAULT (date('now')),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(game_name, region_name, date_stamp)
            )
        `;

        this.db.run(createGamesTable, (err) => {
            if (err) console.error('創建games表錯誤:', err.message);
        });
        
        this.db.run(createGameStatsTable, (err) => {
            if (err) console.error('創建game_stats表錯誤:', err.message);
        });
        
        this.db.run(createRegionDataTable, (err) => {
            if (err) console.error('創建region_data表錯誤:', err.message);
        });

        // 檢查並添加新字段（為了向後兼容）
        this.addColumnIfNotExists('games', 'estimated_total_players', 'INTEGER DEFAULT 0');
        this.addColumnIfNotExists('games', 'taiwan_heat_score', 'INTEGER DEFAULT 0');
        this.addColumnIfNotExists('games', 'main_platform', 'TEXT');
        this.addColumnIfNotExists('games', 'top_regions', 'TEXT');
        this.addColumnIfNotExists('games', 'region_scores', 'TEXT');
        this.addColumnIfNotExists('games', 'platform_analysis', 'TEXT');
    }

    // 新增：檢查並添加字段的輔助方法
    addColumnIfNotExists(tableName, columnName, columnDef) {
        const checkColumnSql = `PRAGMA table_info(${tableName})`;
        this.db.all(checkColumnSql, [], (err, rows) => {
            if (err) {
                console.error(`檢查${tableName}表結構錯誤:`, err.message);
                return;
            }
            
            const columnExists = rows.some(row => row.name === columnName);
            if (!columnExists) {
                const addColumnSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`;
                this.db.run(addColumnSql, (err) => {
                    if (err) {
                        console.error(`添加${columnName}字段錯誤:`, err.message);
                    } else {
                        console.log(`✅ 已添加${columnName}字段到${tableName}表`);
                    }
                });
            }
        });
    }

    async saveGameData(gameData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO games (
                    name, steam_players, estimated_total_players, twitch_viewers, 
                    youtube_views, reddit_posts, heat_score, taiwan_heat_score,
                    main_platform, top_regions, region_scores, platform_analysis, timestamp
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                gameData.name,
                gameData.steamPlayers || 0,
                gameData.estimatedTotalPlayers || 0,
                gameData.twitchViewers || 0,
                gameData.youtubeViews || 0,
                gameData.redditPosts || 0,
                gameData.heatScore || 0,
                gameData.taiwanHeatScore || 0,
                gameData.mainPlatform || '',
                JSON.stringify(gameData.regionData?.topRegions || []),
                JSON.stringify(gameData.regionData?.regionScores || {}),
                JSON.stringify(gameData.platformAnalysis || {}),
                gameData.timestamp
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    // 同時保存地區數據到專門的表
                    if (gameData.regionData && gameData.regionData.regionScores) {
                        resolve(this.lastID);
                        // 異步保存地區數據，不影響主流程
                        this.saveRegionData(gameData.name, gameData.regionData);
                    } else {
                        resolve(this.lastID);
                    }
                }
            }.bind(this));
        });
    }

    // 新增：保存地區數據到專門的表
    async saveRegionData(gameName, regionData) {
        if (!regionData || !regionData.regionScores) return;

        Object.entries(regionData.regionScores).forEach(([region, score]) => {
            const sql = `
                INSERT OR REPLACE INTO region_data (game_name, region_name, region_score, timestamp)
                VALUES (?, ?, ?, datetime('now'))
            `;
            
            this.db.run(sql, [gameName, region, score], (err) => {
                if (err) {
                    console.error(`保存${gameName}的${region}地區數據錯誤:`, err.message);
                }
            });
        });
    }

    async getAllGames() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT name, 
                       AVG(heat_score) as avg_heat_score,
                       AVG(taiwan_heat_score) as avg_taiwan_heat_score,
                       MAX(steam_players) as max_steam_players,
                       MAX(estimated_total_players) as max_total_players,
                       MAX(twitch_viewers) as max_viewers,
                       main_platform,
                       top_regions,
                       region_scores,
                       COUNT(*) as data_points,
                       MAX(timestamp) as last_update
                FROM games 
                WHERE timestamp > datetime('now', '-24 hours')
                GROUP BY name
                ORDER BY avg_heat_score DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // 解析JSON字段
                    const processedRows = rows.map(row => ({
                        ...row,
                        top_regions: this.parseJSON(row.top_regions, []),
                        region_scores: this.parseJSON(row.region_scores, {}),
                        avg_taiwan_heat_score: Math.round(row.avg_taiwan_heat_score || 0)
                    }));
                    resolve(processedRows);
                }
            });
        });
    }

    async getGameStats(gameName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM games 
                WHERE name = ? 
                ORDER BY timestamp DESC 
                LIMIT 48
            `;

            this.db.all(sql, [gameName], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // 解析JSON字段
                    const processedRows = rows.map(row => ({
                        ...row,
                        top_regions: this.parseJSON(row.top_regions, []),
                        region_scores: this.parseJSON(row.region_scores, {}),
                        platform_analysis: this.parseJSON(row.platform_analysis, {})
                    }));
                    resolve(processedRows);
                }
            });
        });
    }

    // 新增：獲取遊戲的地區數據
    async getGameRegionData(gameName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT region_name, AVG(region_score) as avg_score
                FROM region_data 
                WHERE game_name = ? 
                AND timestamp > datetime('now', '-7 days')
                GROUP BY region_name
                ORDER BY avg_score DESC
            `;

            this.db.all(sql, [gameName], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 新增：獲取台灣熱度排行榜
    async getTaiwanHeatRanking() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT name,
                       AVG(taiwan_heat_score) as avg_taiwan_score,
                       AVG(heat_score) as avg_global_score,
                       MAX(estimated_total_players) as max_players,
                       main_platform,
                       top_regions,
                       region_scores,
                       MAX(timestamp) as last_update
                FROM games 
                WHERE timestamp > datetime('now', '-24 hours')
                AND taiwan_heat_score > 0
                GROUP BY name
                ORDER BY avg_taiwan_score DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const processedRows = rows.map(row => ({
                        ...row,
                        avg_taiwan_score: Math.round(row.avg_taiwan_score),
                        avg_global_score: Math.round(row.avg_global_score),
                        top_regions: this.parseJSON(row.top_regions, []),
                        region_scores: this.parseJSON(row.region_scores, {}),
                        taiwan_rank: 0 // 將在排序後設置
                    }));
                    
                    // 設置台灣排名
                    processedRows.forEach((row, index) => {
                        row.taiwan_rank = index + 1;
                    });
                    
                    resolve(processedRows);
                }
            });
        });
    }

    // 新增：獲取全球地區熱度統計
    async getGlobalRegionStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT region_name, 
                       COUNT(DISTINCT game_name) as game_count,
                       AVG(region_score) as avg_score,
                       MAX(region_score) as max_score
                FROM region_data 
                WHERE timestamp > datetime('now', '-7 days')
                GROUP BY region_name
                ORDER BY avg_score DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getTrendingGames() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT name,
                       AVG(heat_score) as current_score,
                       AVG(taiwan_heat_score) as current_taiwan_score,
                       (
                           SELECT AVG(heat_score) 
                           FROM games g2 
                           WHERE g2.name = g1.name 
                           AND g2.timestamp BETWEEN datetime('now', '-48 hours') AND datetime('now', '-24 hours')
                       ) as previous_score,
                       (
                           SELECT AVG(taiwan_heat_score) 
                           FROM games g2 
                           WHERE g2.name = g1.name 
                           AND g2.timestamp BETWEEN datetime('now', '-48 hours') AND datetime('now', '-24 hours')
                       ) as previous_taiwan_score
                FROM games g1
                WHERE timestamp > datetime('now', '-24 hours')
                GROUP BY name
                HAVING current_score > 0 AND previous_score > 0
                ORDER BY (current_score - previous_score) DESC
                LIMIT 10
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const trending = rows.map(row => ({
                        ...row,
                        trend_change: row.current_score - (row.previous_score || 0),
                        taiwan_trend_change: (row.current_taiwan_score || 0) - (row.previous_taiwan_score || 0)
                    }));
                    resolve(trending);
                }
            });
        });
    }

    // 新增：安全解析JSON的輔助方法
    parseJSON(jsonString, defaultValue) {
        try {
            return jsonString ? JSON.parse(jsonString) : defaultValue;
        } catch (error) {
            console.warn('JSON解析錯誤:', error.message, 'JSON:', jsonString);
            return defaultValue;
        }
    }
}

module.exports = new Database(); 