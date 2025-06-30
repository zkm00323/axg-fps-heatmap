const axios = require('axios');
const cheerio = require('cheerio');
const aiClassifier = require('./aiGameClassifier');
const advancedAIClassifier = require('./advancedAIClassifier');

class DynamicGameDiscovery {
    constructor() {
        // AI增強模式開關
        this.useAI = true;
        this.useAdvancedAI = true; // 新增：高級AI分析開關
        
        // PC射擊競技遊戲識別關鍵詞和標籤（備用）
        this.shooterKeywords = [
            'shooter', 'fps', 'tps', 'first person', 'third person', 'battle royale', 'tactical', 'counter',
            'call of duty', 'valorant', 'apex', 'overwatch', 'battlefield', 'fortnite', 'pubg',
            'rainbow six', 'cs', 'counter-strike', 'destiny', 'titanfall', 'doom', 'halo', 'quake', 
            'the finals', 'xdefiant', 'gears of war'
        ];
        
        // 已知PC射擊競技遊戲資料庫（僅包含PC平台遊戲）
        this.knownShooterGames = {
            'Counter-Strike 2': {
                platforms: { steam: '730' },
                mainPlatform: 'steam',
                genre: 'tactical-fps',
                perspective: 'first-person',
                pcAvailable: true
            },
            'VALORANT': {
                platforms: { riot: 'valorant' },
                mainPlatform: 'riot',
                genre: 'tactical-fps',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Apex Legends': {
                platforms: { steam: '1172470', origin: 'apex-legends', epic: 'apex' },
                mainPlatform: 'multi',
                genre: 'battle-royale',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Call of Duty: Modern Warfare III': {
                platforms: { battlenet: 'cod-mw3' },
                mainPlatform: 'battlenet',
                genre: 'fps',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Overwatch 2': {
                platforms: { battlenet: 'overwatch-2' },
                mainPlatform: 'battlenet',
                genre: 'hero-shooter',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Tom Clancy\'s Rainbow Six Siege': {
                platforms: { steam: '359550', uplay: 'r6siege' },
                mainPlatform: 'multi',
                genre: 'tactical-fps',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Battlefield 2042': {
                platforms: { steam: '1517290', origin: 'bf2042', epic: 'battlefield-2042' },
                mainPlatform: 'multi',
                genre: 'fps',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Fortnite': {
                platforms: { epic: 'fortnite' },
                mainPlatform: 'epic',
                genre: 'battle-royale-tps',
                perspective: 'third-person',
                pcAvailable: true
            },
            'PUBG: BATTLEGROUNDS': {
                platforms: { steam: '578080' },
                mainPlatform: 'steam',
                genre: 'battle-royale',
                perspective: 'mixed',
                pcAvailable: true
            },
            'Destiny 2': {
                platforms: { steam: '1085660' },
                mainPlatform: 'steam',
                genre: 'fps-mmo',
                perspective: 'first-person',
                pcAvailable: true
            },
            'Gears 5': {
                platforms: { steam: '1097840', xbox: 'gears-5' },
                mainPlatform: 'multi',
                genre: 'tps',
                perspective: 'third-person',
                pcAvailable: true
            }
            // 移除Splatoon 3 - Nintendo Switch獨占，不在PC上可用
        };
        
        // PC平台檢查 - 排除的主機獨占遊戲
        this.excludedConsoleGames = [
            'Splatoon 3',        // Nintendo Switch獨占
            'Splatoon 2',        // Nintendo Switch獨占
            'Mario Kart 8',      // Nintendo Switch獨占
            'Super Smash Bros',  // Nintendo Switch獨占
            'The Last of Us',    // PlayStation獨占
            'God of War',        // PlayStation獨占
            'Halo Infinite',     // Xbox獨占（雖然也在PC上，但主要是Xbox）
            'Gears of War 4'     // Xbox獨占
        ];
        
        // 手機遊戲排除列表
        this.excludedMobileGames = [
            'PUBG Mobile',
            'Call of Duty Mobile',
            'Free Fire',
            'Mobile Legends',
            'Honor of Kings',
            'Clash Royale',
            'Clash of Clans'
        ];
        
        // Twitch認證（如果需要）
        this.twitchClientId = process.env.TWITCH_CLIENT_ID;
        this.twitchAccessToken = process.env.TWITCH_ACCESS_TOKEN;
    }

    async discoverShooterGames(topCount = 30) {
        console.log('🔍 開始AI驅動的動態PC射擊競技遊戲發現...');
        console.log(`📊 從Twitch熱度榜前${topCount}名中智能篩選PC射擊競技遊戲`);
        console.log(`🎯 新要求：射擊為主 + 多人競技 + PC平台可用`);
        console.log(`🤖 基礎AI模式: ${this.useAI ? '✅ 已啟用' : '❌ 已停用'}`);
        console.log(`🧠 高級AI模式: ${this.useAdvancedAI ? '✅ 已啟用' : '❌ 已停用'}`);
        
        try {
            let twitchGames;
            
            // 嘗試使用Twitch API
            if (this.twitchClientId && this.twitchAccessToken) {
                twitchGames = await this.getTwitchGamesViaAPI(topCount);
            } else {
                console.log('⚠️ 未配置Twitch API，使用網頁爬蟲方式...');
                twitchGames = await this.getTwitchGamesViaScraping(topCount);
            }
            
            // 使用智能AI篩選PC射擊競技遊戲
            const shooterGames = await this.intelligentShooterFiltering(twitchGames);
            
            console.log(`✅ 發現 ${shooterGames.length} 個PC射擊競技遊戲:`);
            shooterGames.forEach(game => {
                const confidence = game.advancedAiConfidence || game.aiConfidence || game.confidence || 'N/A';
                const analysisType = game.analysisType || 'unknown';
                const perspective = game.perspective ? `(${game.perspective})` : '';
                const pcStatus = game.pcAvailable ? '💻PC' : '❓';
                console.log(`   🎯 ${game.name} ${perspective} ${pcStatus} - 觀看數: ${game.viewers.toLocaleString()} - ${analysisType}置信度: ${confidence}%`);
            });
            
            return shooterGames;
            
        } catch (error) {
            console.error('❌ 動態遊戲發現失敗:', error.message);
            console.log('🔄 使用備用預設遊戲列表...');
            return this.getFallbackGameList();
        }
    }

    async intelligentShooterFiltering(games) {
        console.log('🧠 開始智能PC射擊競技遊戲識別...');
        
        // 預先過濾排除的遊戲
        const filteredGames = games.filter(game => {
            // 排除已知的主機獨占遊戲
            if (this.excludedConsoleGames.includes(game.name)) {
                console.log(`   ❌ 排除主機獨占: ${game.name}`);
                return false;
            }
            
            // 排除已知的手機遊戲
            if (this.excludedMobileGames.includes(game.name)) {
                console.log(`   ❌ 排除手機遊戲: ${game.name}`);
                return false;
            }
            
            return true;
        });
        
        console.log(`📊 預過濾結果: ${games.length} → ${filteredGames.length} 個遊戲`);
        
        // 分類遊戲：已知 vs 新遊戲
        const knownGames = [];
        const unknownGames = [];
        
        filteredGames.forEach(game => {
            if (this.knownShooterGames[game.name]) {
                knownGames.push(game);
            } else {
                unknownGames.push(game);
            }
        });
        
        console.log(`📊 遊戲分類:`);
        console.log(`   ✅ 已知PC射擊遊戲: ${knownGames.length} 個`);
        console.log(`   🔍 新遊戲: ${unknownGames.length} 個`);
        
        const allShooterGames = [];
        
        // 處理已知遊戲（直接使用資料庫配置）
        knownGames.forEach(game => {
            if (this.knownShooterGames[game.name]) {
                const config = this.knownShooterGames[game.name];
                allShooterGames.push({
                    ...this.generateGameConfig(game),
                    analysisType: '已知遊戲',
                    confidence: 100,
                    perspective: config.perspective,
                    pcAvailable: config.pcAvailable,
                    isKnown: true
                });
                console.log(`   ✅ 已知PC射擊遊戲: ${game.name} (${config.perspective}, PC可用)`);
            }
        });
        
        // 處理新遊戲（使用AI分析）
        if (unknownGames.length > 0) {
            console.log(`\n🤖 開始分析 ${unknownGames.length} 個新遊戲...`);
            
            // 為新遊戲添加描述和標籤
            const enrichedUnknownGames = unknownGames.map(game => ({
                ...game,
                description: this.getGameDescription(game.name),
                tags: this.getGameTags(game.name),
                genre: this.getKnownGenre(game.name)
            }));
            
            // 使用高級AI分析新遊戲
            if (this.useAdvancedAI) {
                try {
                    console.log('🧠 使用高級AI深度分析新遊戲 (包含PC平台檢查)...');
                    
                    for (const game of enrichedUnknownGames) {
                        try {
                            console.log(`🔍 深度分析: ${game.name}`);
                            
                            const analysis = await advancedAIClassifier.analyzeUnknownGame(game.name, {
                                description: game.description,
                                tags: game.tags,
                                viewers: game.viewers,
                                platforms: this.guessPlatforms(game.name)
                            });
                            
                            if (analysis.success && analysis.isShooter) {
                                const gameConfig = this.generateGameConfig(game, analysis);
                                allShooterGames.push({
                                    ...gameConfig,
                                    advancedAiConfidence: analysis.overallConfidence,
                                    aiReason: analysis.primaryReason,
                                    analysisType: '高級AI',
                                    weightedScore: analysis.weightedScore,
                                    shooterLikeDimensions: analysis.shooterLikeDimensions,
                                    perspective: analysis.perspective,
                                    pcAvailable: analysis.pcAvailability === 'available',
                                    coreScores: analysis.coreScores,
                                    isKnown: false
                                });
                                
                                const pcStatus = analysis.pcAvailability === 'available' ? '💻PC可用' : '❓PC狀態未知';
                                console.log(`   🎯 新PC射擊遊戲: ${game.name} (${analysis.perspective}, ${pcStatus}, 置信度: ${analysis.overallConfidence}%)`);
                            } else {
                                const reason = analysis.pcAvailability === 'unavailable' ? 'PC不可用' : 
                                             analysis.pcAvailability === 'exclusive' ? '主機獨占' : '不符合射擊競技要求';
                                console.log(`   ❌ 非PC射擊遊戲: ${game.name} (${reason}, 置信度: ${analysis.overallConfidence}%)`);
                            }
                            
                            // 避免API限制
                            await this.delay(2000);
                            
                        } catch (error) {
                            console.error(`❌ 高級AI分析 ${game.name} 失敗:`, error.message);
                            
                            // 降級到基礎AI
                            if (this.useAI) {
                                try {
                                    console.log(`🔄 降級使用基礎AI分析 ${game.name}...`);
                                    const basicAnalysis = await aiClassifier.classifyGame(game.name, {
                                        description: game.description,
                                        tags: game.tags,
                                        viewers: game.viewers
                                    });
                                    
                                    // 基礎AI沒有PC平台檢查，需要手動檢查
                                    const isPCAvailable = this.checkPCAvailability(game.name);
                                    
                                    if (basicAnalysis.success && basicAnalysis.isFPS && isPCAvailable) {
                                        const gameConfig = this.generateGameConfig(game, basicAnalysis);
                                        allShooterGames.push({
                                            ...gameConfig,
                                            aiConfidence: basicAnalysis.confidence,
                                            analysisType: '基礎AI',
                                            pcAvailable: true,
                                            isKnown: false
                                        });
                                        console.log(`   🎯 新PC射擊遊戲 (基礎AI): ${game.name} (置信度: ${basicAnalysis.confidence}%)`);
                                    } else if (!isPCAvailable) {
                                        console.log(`   ❌ 非PC遊戲: ${game.name} (不在PC平台)`);
                                    }
                                } catch (basicError) {
                                    console.error(`❌ 基礎AI也失敗:`, basicError.message);
                                    // 最後使用關鍵詞匹配
                                    if (await this.isShooterGame(game) && this.checkPCAvailability(game.name)) {
                                        const gameConfig = this.generateGameConfig(game);
                                        allShooterGames.push({
                                            ...gameConfig,
                                            analysisType: '關鍵詞匹配',
                                            confidence: 60,
                                            pcAvailable: true,
                                            isKnown: false
                                        });
                                        console.log(`   🎯 PC射擊遊戲 (關鍵詞): ${game.name}`);
                                    }
                                }
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error('❌ 高級AI批量分析失敗:', error.message);
                    console.log('🔄 降級到基礎AI分析...');
                    
                    // 降級到基礎AI
                    const basicShooterGames = await this.filterShooterGamesWithAI(enrichedUnknownGames);
                    allShooterGames.push(...basicShooterGames.filter(game => !game.isKnown));
                }
            } else {
                // 使用基礎AI或關鍵詞匹配
                const basicShooterGames = await this.filterShooterGamesWithAI(enrichedUnknownGames);
                allShooterGames.push(...basicShooterGames.filter(game => !game.isKnown));
            }
        }
        
        // 按綜合評分排序
        return allShooterGames.sort((a, b) => {
            const scoreA = this.calculateGameScore(a);
            const scoreB = this.calculateGameScore(b);
            return scoreB - scoreA;
        });
    }

    // 檢查PC平台可用性（基於遊戲名的啟發式方法）
    checkPCAvailability(gameName) {
        const name = gameName.toLowerCase();
        
        // 排除已知主機獨占
        if (this.excludedConsoleGames.some(game => name.includes(game.toLowerCase()))) {
            return false;
        }
        
        // 排除已知手機遊戲
        if (this.excludedMobileGames.some(game => name.includes(game.toLowerCase()))) {
            return false;
        }
        
        // 任天堂遊戲通常是主機獨占
        if (name.includes('mario') || name.includes('zelda') || name.includes('pokemon') || 
            name.includes('splatoon') || name.includes('smash bros')) {
            return false;
        }
        
        // PlayStation獨占關鍵詞
        if (name.includes('last of us') || name.includes('god of war') || 
            name.includes('spider-man') || name.includes('horizon')) {
            return false;
        }
        
        // 手機遊戲關鍵詞
        if (name.includes('mobile') || name.includes('legends') || 
            name.includes('clash') || name.includes('candy')) {
            return false;
        }
        
        // 其他遊戲默認假設PC可用
        return true;
    }

    calculateGameScore(game) {
        // 綜合評分：觀看數 + AI置信度 + PC可用性加成
        const viewerScore = Math.log(game.viewers + 1) * 10;
        const confidenceScore = (game.advancedAiConfidence || game.aiConfidence || game.confidence || 50) / 100 * 50;
        const pcBonus = game.pcAvailable ? 10 : -20; // PC可用性加成/懲罰
        return viewerScore + confidenceScore + pcBonus;
    }

    async getTwitchGamesViaAPI(topCount) {
        try {
            const response = await axios.get('https://api.twitch.tv/helix/games/top', {
                headers: {
                    'Client-ID': this.twitchClientId,
                    'Authorization': `Bearer ${this.twitchAccessToken}`
                },
                params: {
                    first: topCount
                }
            });
            
            return response.data.data.map(game => ({
                name: game.name,
                id: game.id,
                viewers: parseInt(game.viewer_count) || 0,
                boxArtUrl: game.box_art_url
            }));
            
        } catch (error) {
            console.error('❌ Twitch API請求失敗:', error.message);
            throw error;
        }
    }

    async getTwitchGamesViaScraping(topCount) {
        try {
            console.log('🕷️ 正在爬取Twitch熱門遊戲...');
            
            const response = await axios.get('https://www.twitch.tv/directory/game', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            const games = [];
            
            // 嘗試多種選擇器來適應Twitch的頁面結構
            const gameSelectors = [
                '[data-a-target="browse-game-card"]',
                '.tw-tower',
                '[data-target="directory-game"]'
            ];
            
            for (const selector of gameSelectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    elements.slice(0, topCount).each((index, element) => {
                        const $elem = $(element);
                        const name = $elem.find('h3, .tw-title, [data-a-target="tw-core-text-title"]').text().trim();
                        const viewerText = $elem.find('[data-a-target="tw-core-text-viewer-count"], .tw-media-card-stat').text().trim();
                        
                        if (name) {
                            const viewers = this.parseViewerCount(viewerText);
                            games.push({
                                name: name,
                                viewers: viewers,
                                source: 'scraping'
                            });
                        }
                    });
                    break; // 找到有效的選擇器就停止
                }
            }
            
            if (games.length === 0) {
                throw new Error('無法從Twitch頁面提取遊戲數據');
            }
            
            console.log(`✅ 成功爬取到 ${games.length} 個熱門遊戲`);
            return games;
            
        } catch (error) {
            console.error('❌ 網頁爬蟲失敗:', error.message);
            // 使用模擬的熱門遊戲數據作為最後備用
            return this.getMockTwitchData();
        }
    }

    getMockTwitchData() {
        console.log('🎭 使用模擬的Twitch熱門遊戲數據...');
        return [
            { name: 'Counter-Strike 2', viewers: 85000 },
            { name: 'VALORANT', viewers: 75000 },
            { name: 'Fortnite', viewers: 95000 },
            { name: 'Apex Legends', viewers: 45000 },
            { name: 'Call of Duty: Modern Warfare III', viewers: 35000 },
            { name: 'Overwatch 2', viewers: 28000 },
            { name: 'PUBG: BATTLEGROUNDS', viewers: 32000 },
            { name: 'Tom Clancy\'s Rainbow Six Siege', viewers: 20000 },
            { name: 'Battlefield 2042', viewers: 12000 },
            { name: 'Destiny 2', viewers: 15000 },
            // 加入一些非射擊遊戲來測試AI分類能力
            { name: 'League of Legends', viewers: 120000 },
            { name: 'World of Warcraft', viewers: 40000 },
            { name: 'Minecraft', viewers: 60000 },
            { name: 'Grand Theft Auto V', viewers: 50000 },
            { name: 'Among Us', viewers: 30000 },
            // 加入一些新的假想射擊遊戲測試高級AI
            { name: 'Titanfall 3', viewers: 22000 },
            { name: 'The Finals', viewers: 35000 },
            { name: 'XDefiant', viewers: 25000 },
            // 加入PC第三人稱射擊遊戲
            { name: 'Gears 5', viewers: 8000 },
            // 加入主機獨占遊戲來測試排除機制
            { name: 'Splatoon 3', viewers: 18000 }, // 應該被排除
            // 加入手機遊戲來測試排除機制
            { name: 'PUBG Mobile', viewers: 15000 } // 應該被排除
        ];
    }

    parseViewerCount(viewerText) {
        if (!viewerText) return 0;
        
        const text = viewerText.toLowerCase().replace(/[^0-9.km]/g, '');
        
        if (text.includes('k')) {
            return Math.floor(parseFloat(text) * 1000);
        } else if (text.includes('m')) {
            return Math.floor(parseFloat(text) * 1000000);
        } else {
            return parseInt(text) || 0;
        }
    }

    async filterShooterGamesWithAI(games) {
        if (!this.useAI) {
            console.log('🔄 AI模式未啟用，使用傳統方法...');
            return await this.filterShooterGames(games);
        }

        console.log('🤖 開始基礎AI智能分類 (包含PC平台檢查)...');
        
        // 檢查AI API配置
        const apiStatus = aiClassifier.checkAPIKeys();
        if (!apiStatus.openai && !apiStatus.claude) {
            console.warn('⚠️ 未配置AI API密鑰，使用傳統方法...');
            return await this.filterShooterGames(games);
        }

        try {
            // 準備遊戲資料用於AI分析
            const gamesWithInfo =  games.map(game => ({
                ...game,
                description: this.getGameDescription(game.name),
                tags: this.getGameTags(game.name),
                genre: this.getKnownGenre(game.name)
            }));

            // 使用AI批量分類
            const classifiedGames = await aiClassifier.classifyGames(gamesWithInfo, 3); // 小批次避免API限制
            
            // 轉換為我們需要的格式，並檢查PC可用性
            const shooterGames = classifiedGames
                .filter(game => this.checkPCAvailability(game.name)) // 額外的PC檢查
                .map(game => {
                    const gameConfig = this.generateGameConfig(game, game.classification);
                    return {
                        ...gameConfig,
                        aiConfidence: game.classification.confidence,
                        aiReason: game.classification.reason,
                        aiSubGenre: game.classification.subGenre,
                        analysisType: '基礎AI',
                        pcAvailable: true
                    };
                });

            // 按置信度和觀看數排序
            return shooterGames.sort((a, b) => {
                const scoreA = this.calculateGameScore(a);
                const scoreB = this.calculateGameScore(b);
                return scoreB - scoreA;
            });

        } catch (error) {
            console.error('❌ AI分類失敗，使用備用方法:', error.message);
            return await this.filterShooterGames(games);
        }
    }

    async filterShooterGames(games) {
        console.log('🔍 使用傳統關鍵詞匹配方法 (包含PC平台檢查)...');
        const shooterGames = [];
        
        for (const game of games) {
            if (await this.isShooterGame(game) && this.checkPCAvailability(game.name)) {
                // 添加平台和配置信息
                const gameConfig = this.generateGameConfig(game);
                gameConfig.analysisType = '關鍵詞匹配';
                gameConfig.confidence = 60;
                gameConfig.pcAvailable = true;
                shooterGames.push(gameConfig);
            }
        }
        
        // 按觀看數排序
        return shooterGames.sort((a, b) => this.calculateGameScore(b) - this.calculateGameScore(a));
    }

    getGameDescription(gameName) {
        // 基於遊戲名提供基本描述（可以後續從遊戲資料庫獲取）
        const descriptions = {
            'Counter-Strike 2': '戰術第一人稱射擊遊戲，PC平台',
            'VALORANT': 'Riot Games開發的戰術FPS遊戲，PC平台',
            'Apex Legends': '英雄大逃殺遊戲，PC平台，每個角色都有獨特能力',
            'Call of Duty: Modern Warfare III': '軍事主題第一人稱射擊遊戲，PC平台',
            'Overwatch 2': '英雄射擊遊戲，PC平台，基於團隊的目標導向戰鬥',
            'Fortnite': '建造與戰鬥結合的第三人稱大逃殺遊戲，PC平台，射擊是主要戰鬥方式',
            'PUBG: BATTLEGROUNDS': '大逃殺遊戲，PC平台，支持第一人稱和第三人稱視角',
            'League of Legends': 'MOBA遊戲，PC平台，兩隊玩家控制英雄角色進行戰略對戰',
            'World of Warcraft': 'MMORPG奇幻角色扮演遊戲，PC平台',
            'Minecraft': '沙盒建造遊戲，PC平台，可以創造和探索方塊世界',
            'Titanfall 3': '科幻射擊遊戲，PC平台，結合機器人和壁跑機制',
            'The Finals': '破壞性競技射擊遊戲，PC平台，注重環境破壞',
            'XDefiant': '競技射擊遊戲，PC平台，融合多個Ubisoft遊戲世界',
            'Gears 5': '微軟開發的第三人稱射擊遊戲，PC平台，以掩護射擊為特色',
            'Splatoon 3': '任天堂開發的第三人稱射擊遊戲，Nintendo Switch獨占，不在PC上',
            'PUBG Mobile': '手機版大逃殺遊戲，不在PC平台'
        };
        
        return descriptions[gameName] || '';
    }

    getGameTags(gameName) {
        // 基於遊戲名提供標籤
        const tags = {
            'Counter-Strike 2': ['FPS', 'Tactical', 'Competitive', 'PC'],
            'VALORANT': ['FPS', 'Tactical', 'Hero-based', 'Competitive', 'PC'],
            'Apex Legends': ['Battle Royale', 'FPS', 'Hero-based', 'Team-based', 'PC'],
            'Fortnite': ['Battle Royale', 'TPS', 'Building', 'Third-person', 'Shooter', 'PC'],
            'PUBG: BATTLEGROUNDS': ['Battle Royale', 'Shooter', 'Mixed-perspective', 'PC'],
            'League of Legends': ['MOBA', 'Strategy', 'Team-based', 'PC'],
            'World of Warcraft': ['MMORPG', 'Fantasy', 'RPG', 'PC'],
            'Minecraft': ['Sandbox', 'Building', 'Survival', 'PC'],
            'Titanfall 3': ['FPS', 'Sci-fi', 'Mechs', 'Parkour', 'PC'],
            'The Finals': ['FPS', 'Competitive', 'Destruction', 'PC'],
            'XDefiant': ['FPS', 'Competitive', 'Team-based', 'PC'],
            'Gears 5': ['TPS', 'Cover-based', 'Action', 'PC'],
            'Splatoon 3': ['TPS', 'Nintendo', 'Colorful', 'Team-based', 'Console'],
            'PUBG Mobile': ['Battle Royale', 'Mobile', 'Shooter']
        };
        
        return tags[gameName] || [];
    }

    getKnownGenre(gameName) {
        if (this.knownShooterGames[gameName]) {
            return this.knownShooterGames[gameName].genre;
        }
        return null;
    }

    async isShooterGame(game) {
        const gameName = game.name.toLowerCase();
        
        // 1. 檢查已知PC射擊遊戲資料庫
        if (this.knownShooterGames[game.name]) {
            return true;
        }
        
        // 2. 檢查PC可用性
        if (!this.checkPCAvailability(game.name)) {
            return false;
        }
        
        // 3. 檢查遊戲名包含射擊關鍵詞
        for (const keyword of this.shooterKeywords) {
            if (gameName.includes(keyword.toLowerCase())) {
                return true;
            }
        }
        
        // 4. 額外的模糊匹配
        const shooterPatterns = [
            /\b(fps|tps|shooter|tactical|battle\s*royale)\b/i,
            /\b(counter|strike|warfare|battlefield|siege)\b/i,
            /\b(apex|valorant|overwatch|destiny|fortnite|pubg)\b/i
        ];
        
        for (const pattern of shooterPatterns) {
            if (pattern.test(gameName)) {
                return true;
            }
        }
        
        return false;
    }

    generateGameConfig(game, aiClassification = null) {
        // 如果是已知遊戲，使用預設配置
        if (this.knownShooterGames[game.name]) {
            const knownConfig = this.knownShooterGames[game.name];
            return {
                name: game.name,
                platforms: knownConfig.platforms,
                keywords: this.generateKeywords(game.name),
                mainPlatform: knownConfig.mainPlatform,
                genre: aiClassification?.subGenre || knownConfig.genre,
                perspective: knownConfig.perspective,
                pcAvailable: knownConfig.pcAvailable,
                viewers: game.viewers,
                isDiscovered: true,
                isKnown: true
            };
        }
        
        // 新發現的遊戲，嘗試推測配置
        const platforms = this.guessPlatforms(game.name);
        const mainPlatform = this.guessMainPlatform(game.name, platforms);
        const pcAvailable = aiClassification?.pcAvailability === 'available' || 
                           this.checkPCAvailability(game.name);
        
        return {
            name: game.name,
            platforms: platforms,
            keywords: this.generateKeywords(game.name),
            mainPlatform: mainPlatform,
            genre: aiClassification?.subGenre || 'pc-shooter',
            perspective: aiClassification?.perspective || 'unknown',
            pcAvailable: pcAvailable,
            viewers: game.viewers,
            isDiscovered: true,
            isKnown: false
        };
    }

    guessPlatforms(gameName) {
        const name = gameName.toLowerCase();
        const platforms = {};
        
        // 基於遊戲名推測平台
        if (name.includes('valorant') || name.includes('riot')) {
            platforms.riot = 'valorant';
        } else if (name.includes('call of duty') || name.includes('overwatch')) {
            platforms.battlenet = name.replace(/[^a-z0-9]/g, '-');
        } else if (name.includes('fortnite')) {
            platforms.epic = 'fortnite';
        } else if (!this.checkPCAvailability(gameName)) {
            // 如果不在PC上，不添加PC平台
            platforms.console = 'exclusive';
        } else {
            // 默認假設有PC平台
            platforms.steam = 'unknown';
        }
        
        return platforms;
    }

    guessMainPlatform(gameName, platforms) {
        if (platforms.riot) return 'riot';
        if (platforms.battlenet) return 'battlenet';
        if (platforms.epic) return 'epic';
        if (platforms.console) return 'console';
        if (platforms.steam) return 'steam';
        return 'multi';
    }

    generateKeywords(gameName) {
        const words = gameName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
        
        return words.slice(0, 3); // 取前3個關鍵詞
    }

    getFallbackGameList() {
        console.log('🔄 使用預設PC射擊競技遊戲列表...');
        return Object.entries(this.knownShooterGames).map(([name, config]) => ({
            name: name,
            platforms: config.platforms,
            keywords: this.generateKeywords(name),
            mainPlatform: config.mainPlatform,
            genre: config.genre,
            perspective: config.perspective,
            pcAvailable: config.pcAvailable,
            viewers: Math.floor(Math.random() * 50000) + 10000, // 模擬觀看數
            isDiscovered: false,
            isKnown: true,
            analysisType: '預設清單',
            confidence: 100
        }));
    }

    // 設置AI模式
    setAIMode(enabled, advanced = false) {
        this.useAI = enabled;
        this.useAdvancedAI = advanced;
        console.log(`🤖 基礎AI模式: ${enabled ? '✅ 已啟用' : '❌ 已停用'}`);
        console.log(`🧠 高級AI模式: ${advanced ? '✅ 已啟用' : '❌ 已停用'}`);
    }

    // 設置Twitch API憑證
    setTwitchCredentials(clientId, accessToken) {
        this.twitchClientId = clientId;
        this.twitchAccessToken = accessToken;
        console.log('✅ Twitch API憑證已設置');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 向後兼容的方法
    async discoverFpsGames(topCount = 30) {
        return await this.discoverShooterGames(topCount);
    }
}

module.exports = new DynamicGameDiscovery(); 