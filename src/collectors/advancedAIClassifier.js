const axios = require('axios');

class AdvancedAIClassifier {
    constructor() {
        // OpenAI API配置
        this.openaiApiKey = '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';
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        
        // 多維度分析框架 - 射擊競技遊戲 + PC平台
        this.analysisFramework = {
            shooting: '射擊機制',
            combat: '戰鬥系統',
            multiplayer: '多人競技',
            objectives: '遊戲目標',
            weapons: '武器系統',
            competition: '競技屬性',
            platforms: 'PC平台可用性',
            community: '社群特徵'
        };
    }

    async analyzeUnknownGame(gameName, additionalInfo = {}) {
        console.log(`🔍 開始多維度AI分析新遊戲: "${gameName}"`);
        
        try {
            // 多維度分析
            const analysis = await this.performMultiDimensionalAnalysis(gameName, additionalInfo);
            
            // 整合分析結果
            const finalResult = this.integrateFinalDecision(analysis);
            
            console.log(`✅ 深度分析完成 - ${gameName}:`);
            console.log(`   🎯 最終判定: ${finalResult.isShooter ? 'PC射擊競技遊戲' : '不符合要求'}`);
            console.log(`   🎯 總體置信度: ${finalResult.overallConfidence}%`);
            console.log(`   🎯 主要理由: ${finalResult.primaryReason}`);
            console.log(`   🎯 子類型: ${finalResult.subGenre || 'N/A'}`);
            
            return finalResult;
            
        } catch (error) {
            console.error(`❌ 高級AI分析失敗: ${error.message}`);
            throw error;
        }
    }

    async performMultiDimensionalAnalysis(gameName, additionalInfo) {
        const prompt = this.buildAdvancedAnalysisPrompt(gameName, additionalInfo);
        
        const response = await axios.post(this.apiUrl, {
            model: "gpt-4o-mini", // 使用更強大的模型
            messages: [
                {
                    role: "system",
                    content: this.getSystemPrompt()
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1, // 低溫度保證一致性
            max_tokens: 800,
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        const content = response.data.choices[0].message.content;
        return JSON.parse(content);
    }

    getSystemPrompt() {
        return `你是一個專業的遊戲分析專家，擅長從多個維度精確分析PC射擊類競技遊戲。

你的任務是判斷一個遊戲是否為PC平台上的射擊類競技遊戲。

PC射擊類競技遊戲的核心特徵：
1. 射擊是最主要的攻擊戰鬥互動方式（不限第一人稱或第三人稱）
2. 多人線上競技對戰
3. 必須要是PC上遊玩的（Windows/Mac/Linux）
4. 即時戰鬥系統
5. 武器系統是核心機制

包含但不限於：
- PC第一人稱射擊遊戲（FPS）：CS2、Valorant、Apex Legends
- PC第三人稱射擊遊戲（TPS）：Fortnite、PUBG
- PC英雄射擊遊戲：Overwatch 2
- PC大逃殺射擊遊戲：PUBG、Apex Legends、Fortnite

排除：
- 主機獨占遊戲（如Nintendo Switch獨占的Splatoon 3）
- 手機遊戲
- 單人射擊遊戲
- 射擊不是主要戰鬥方式的遊戲
- 非競技性的射擊遊戲

請從以下8個維度進行分析，每個維度給出0-100的評分和詳細解釋：
1. 射擊機制 - 射擊是否是最主要的攻擊戰鬥方式
2. 戰鬥系統 - 即時戰鬥vs回合制，戰鬥的核心性
3. 多人競技 - 是否具有多人線上競技對戰
4. 遊戲目標 - 消滅敵人、佔領據點等射擊遊戲目標
5. 武器系統 - 武器、彈藥、射擊機制的重要性
6. 競技屬性 - 排名系統、電競屬性、技能需求
7. PC平台可用性 - 是否在PC平台（Windows/Mac/Linux）上可用
8. 社群特徵 - 電競、主播文化等射擊遊戲特徵

請以JSON格式回答，包含每個維度的詳細分析。`;
    }

    buildAdvancedAnalysisPrompt(gameName, additionalInfo) {
        const { description, tags, viewers, genre, platforms } = additionalInfo;
        
        let prompt = `請對以下遊戲進行深度的多維度PC射擊競技遊戲分析：

🎮 遊戲名稱: "${gameName}"`;

        if (description) {
            prompt += `\n📝 遊戲描述: ${description}`;
        }
        
        if (tags && tags.length > 0) {
            prompt += `\n🏷️ 遊戲標籤: ${tags.join(', ')}`;
        }
        
        if (viewers) {
            prompt += `\n📺 Twitch觀看數: ${viewers.toLocaleString()}`;
        }
        
        if (genre) {
            prompt += `\n🎯 已知類型: ${genre}`;
        }
        
        if (platforms) {
            prompt += `\n💻 平台信息: ${JSON.stringify(platforms)}`;
        }

        prompt += `

請從以下8個維度進行詳細分析：

1. 【射擊機制】
   - 射擊是否是這個遊戲最主要的攻擊戰鬥互動方式？
   - 不限第一人稱或第三人稱視角
   - 評分(0-100)和理由

2. 【戰鬥系統】
   - 是否為即時戰鬥系統？戰鬥是否是遊戲核心？
   - 評分(0-100)和理由

3. 【多人競技】
   - 是否具有多人線上競技對戰功能？
   - 是否支持玩家vs玩家的競技模式？
   - 評分(0-100)和理由

4. 【遊戲目標】
   - 遊戲目標是否以消滅敵人、佔領據點、生存競技為主？
   - 評分(0-100)和理由

5. 【武器系統】
   - 是否具有豐富的武器系統、彈藥管理、射擊精準度等機制？
   - 武器系統是否是遊戲核心機制？
   - 評分(0-100)和理由

6. 【競技屬性】
   - 是否具有競技對戰、排名系統、電競屬性？
   - 是否需要射擊技巧和戰術技能？
   - 評分(0-100)和理由

7. 【PC平台可用性】
   - 這個遊戲是否在PC平台（Windows/Mac/Linux）上可用？
   - 是否為主機獨占或手機遊戲？
   - 評分(0-100)和理由

8. 【社群特徵】
   - 是否具有電競、主播文化等射擊遊戲社群特徵？
   - 評分(0-100)和理由

請以以下JSON格式回答：
{
  "gameName": "遊戲名稱",
  "dimensions": {
    "shooting": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "combat": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "multiplayer": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "objectives": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "weapons": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "competition": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "platforms": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    },
    "community": {
      "score": 數字,
      "reason": "詳細解釋",
      "isShooterLike": true/false
    }
  },
  "overallAnalysis": {
    "averageScore": 數字,
    "shooterLikeDimensions": 數字,
    "strongestIndicators": ["維度1", "維度2"],
    "weakestIndicators": ["維度1", "維度2"],
    "primaryReason": "主要判斷理由",
    "subGenre": "子類型或null",
    "perspective": "first-person/third-person/mixed/unknown",
    "pcAvailability": "available/exclusive/unavailable"
  }
}`;

        return prompt;
    }

    integrateFinalDecision(analysis) {
        const dimensions = analysis.dimensions;
        const overallAnalysis = analysis.overallAnalysis;
        
        // 重新調整權重 - 三個核心條件：射擊、多人競技、PC平台
        const weights = {
            shooting: 0.25,      // 射擊機制
            multiplayer: 0.25,   // 多人競技
            platforms: 0.25,     // PC平台可用性 - 新增核心要求
            combat: 0.10,        // 戰鬥系統
            weapons: 0.10,       // 武器系統
            competition: 0.05,   // 競技屬性
            objectives: 0.00,    // 遊戲目標權重降低
            community: 0.00      // 社群特徵權重降低
        };
        
        let weightedScore = 0;
        let totalWeight = 0;
        let shooterLikeCount = 0;
        
        Object.entries(dimensions).forEach(([dimension, data]) => {
            const weight = weights[dimension] || 0.1;
            weightedScore += data.score * weight;
            totalWeight += weight;
            
            if (data.isShooterLike) {
                shooterLikeCount++;
            }
        });
        
        const finalScore = Math.round(weightedScore / totalWeight);
        
        // 三重判定邏輯 - 必須滿足三個核心要求
        let isShooter = false;
        let confidence = 0;
        
        // 檢查三個核心維度：射擊機制、多人競技、PC平台
        const coreShootingScore = dimensions.shooting?.score || 0;
        const coreMultiplayerScore = dimensions.multiplayer?.score || 0;
        const corePlatformScore = dimensions.platforms?.score || 0;
        const coreShootingLike = dimensions.shooting?.isShooterLike || false;
        const coreMultiplayerLike = dimensions.multiplayer?.isShooterLike || false;
        const corePlatformLike = dimensions.platforms?.isShooterLike || false;
        
        // 核心邏輯：必須同時滿足射擊為主、多人競技、PC平台
        if (coreShootingLike && coreMultiplayerLike && corePlatformLike) {
            if (finalScore >= 80 && shooterLikeCount >= 6) {
                isShooter = true;
                confidence = 95;
            } else if (finalScore >= 70 && shooterLikeCount >= 5) {
                isShooter = true;
                confidence = 85;
            } else if (finalScore >= 60 && shooterLikeCount >= 4) {
                isShooter = true;
                confidence = 75;
            } else if (coreShootingScore >= 70 && coreMultiplayerScore >= 70 && corePlatformScore >= 70) {
                // 即使其他維度不夠，三個核心維度夠強也可以
                isShooter = true;
                confidence = 65;
            } else {
                isShooter = false;
                confidence = 60;
            }
        } else {
            // 不滿足核心要求
            isShooter = false;
            if (!coreShootingLike) {
                confidence = 85; // 射擊不是主要方式，很確定不是
            } else if (!coreMultiplayerLike) {
                confidence = 80; // 不是多人競技，比較確定不是
            } else if (!corePlatformLike) {
                confidence = 90; // 不在PC平台，非常確定不是
            } else {
                confidence = 70;
            }
        }
        
        // 確定子類型
        let subGenre = null;
        if (isShooter) {
            subGenre = this.determineSubGenre(analysis, overallAnalysis.subGenre, overallAnalysis.perspective);
        }
        
        // 特別檢查：如果是主機獨占，直接排除
        if (overallAnalysis.pcAvailability === 'unavailable' || 
            overallAnalysis.pcAvailability === 'exclusive') {
            isShooter = false;
            confidence = 95;
        }
        
        return {
            success: true,
            isShooter: isShooter,
            isFPS: isShooter, // 向後兼容
            overallConfidence: confidence,
            weightedScore: finalScore,
            shooterLikeDimensions: shooterLikeCount,
            fpsLikeDimensions: shooterLikeCount, // 向後兼容
            totalDimensions: Object.keys(dimensions).length,
            primaryReason: overallAnalysis.primaryReason,
            subGenre: subGenre,
            perspective: overallAnalysis.perspective,
            pcAvailability: overallAnalysis.pcAvailability,
            strongestIndicators: overallAnalysis.strongestIndicators,
            weakestIndicators: overallAnalysis.weakestIndicators,
            coreScores: {
                shooting: coreShootingScore,
                multiplayer: coreMultiplayerScore,
                platform: corePlatformScore
            },
            detailedAnalysis: analysis,
            aiProvider: 'openai-advanced-pc-shooter'
        };
    }
    
    determineSubGenre(analysis, suggestedGenre, perspective) {
        // 基於分析結果確定子類型
        if (suggestedGenre) {
            return suggestedGenre;
        }
        
        const dimensions = analysis.dimensions;
        
        // 根據視角和特徵判斷子類型
        if (perspective === 'first-person') {
            if (dimensions.competition && dimensions.competition.score >= 80) {
                if (dimensions.objectives && dimensions.objectives.reason.toLowerCase().includes('tactical')) {
                    return 'tactical-fps';
                }
                return 'competitive-fps';
            }
            return 'fps';
        } else if (perspective === 'third-person') {
            if (dimensions.objectives && dimensions.objectives.reason.toLowerCase().includes('battle royale')) {
                return 'battle-royale-tps';
            }
            return 'tps';
        }
        
        // 根據玩法特徵判斷
        if (dimensions.objectives && dimensions.objectives.reason.toLowerCase().includes('battle royale')) {
            return 'battle-royale';
        }
        
        if (dimensions.combat && dimensions.combat.reason.toLowerCase().includes('hero')) {
            return 'hero-shooter';
        }
        
        return 'pc-shooter';
    }

    // 批量分析新遊戲
    async analyzeNewGames(games) {
        console.log(`🤖 開始高級AI批量分析 ${games.length} 個新遊戲 (PC平台)...`);
        
        const results = [];
        
        for (const game of games) {
            try {
                console.log(`📊 分析: ${game.name}`);
                
                const analysis = await this.analyzeUnknownGame(game.name, {
                    description: game.description,
                    tags: game.tags,
                    viewers: game.viewers,
                    genre: game.genre,
                    platforms: game.platforms
                });
                
                results.push({
                    ...game,
                    aiAnalysis: analysis
                });
                
                // 避免API限制
                await this.delay(1500);
                
            } catch (error) {
                console.error(`❌ 分析 ${game.name} 失敗:`, error.message);
                results.push({
                    ...game,
                    aiAnalysis: {
                        success: false,
                        error: error.message
                    }
                });
            }
        }
        
        const shooterGames = results.filter(game => 
            game.aiAnalysis.success && game.aiAnalysis.isShooter
        );
        
        console.log(`✅ 高級分析完成！`);
        console.log(`🎯 發現 ${shooterGames.length} 個PC射擊競技遊戲`);
        console.log(`📊 成功分析 ${results.filter(r => r.aiAnalysis.success).length} 個`);
        console.log(`❌ 分析失敗 ${results.filter(r => !r.aiAnalysis.success).length} 個`);
        
        return shooterGames;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AdvancedAIClassifier(); 