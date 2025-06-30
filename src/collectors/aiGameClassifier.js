const axios = require('axios');

class AIGameClassifier {
    constructor() {
        // 支援多種AI服務
        this.aiServices = {
            openai: {
                url: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            },
            claude: {
                url: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
            }
        };
        
        // 當前使用的AI服務
        this.currentService = 'openai'; // 可改為 'claude'
        
        // 備用規則匹配器（AI失敗時使用）
        this.fallbackKeywords = [
            'fps', 'first person shooter', 'tactical shooter', 'battle royale',
            'counter-strike', 'valorant', 'apex', 'call of duty', 'overwatch',
            'battlefield', 'rainbow six', 'pubg', 'fortnite', 'destiny'
        ];
    }

    async classifyGame(gameName, additionalInfo = {}) {
        console.log(`🤖 AI正在分析遊戲: ${gameName}`);
        
        try {
            // 嘗試使用AI分類
            const aiResult = await this.classifyWithAI(gameName, additionalInfo);
            
            if (aiResult.success) {
                console.log(`✅ AI判斷: ${gameName} ${aiResult.isFPS ? '是' : '不是'} FPS遊戲`);
                if (aiResult.confidence) {
                    console.log(`   🎯 置信度: ${aiResult.confidence}%`);
                }
                if (aiResult.subGenre) {
                    console.log(`   📝 子類型: ${aiResult.subGenre}`);
                }
                return aiResult;
            }
        } catch (error) {
            console.warn(`⚠️ AI分類失敗，使用備用方法: ${error.message}`);
        }
        
        // AI失敗時使用備用規則匹配
        return this.fallbackClassification(gameName, additionalInfo);
    }

    async classifyWithAI(gameName, additionalInfo) {
        const prompt = this.buildClassificationPrompt(gameName, additionalInfo);
        
        if (this.currentService === 'openai') {
            return await this.classifyWithOpenAI(prompt);
        } else if (this.currentService === 'claude') {
            return await this.classifyWithClaude(prompt);
        }
        
        throw new Error('未配置AI服務');
    }

    buildClassificationPrompt(gameName, additionalInfo) {
        const { description, tags, viewers, genre } = additionalInfo;
        
        let prompt = `請分析以下遊戲是否為FPS（第一人稱射擊）遊戲：

遊戲名稱: "${gameName}"`;

        if (description) prompt += `\n遊戲描述: ${description}`;
        if (tags && tags.length > 0) prompt += `\n遊戲標籤: ${tags.join(', ')}`;
        if (viewers) prompt += `\nTwitch觀看數: ${viewers}`;
        if (genre) prompt += `\n已知類型: ${genre}`;

        prompt += `

請回答以下問題：
1. 這是否為FPS遊戲？（是/否）
2. 置信度（0-100%）
3. 如果是FPS，屬於哪個子類型？（戰術FPS、大逃殺、英雄射擊、軍事FPS、科幻FPS等）
4. 簡短理由

請以JSON格式回答：
{
  "isFPS": true/false,
  "confidence": 數字,
  "subGenre": "子類型",
  "reason": "判斷理由"
}`;

        return prompt;
    }

    async classifyWithOpenAI(prompt) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('未設置OpenAI API密鑰');
        }

        const response = await axios.post(this.aiServices.openai.url, {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "你是一個專業的遊戲分類專家，擅長識別FPS遊戲。請準確分析並以JSON格式回答。"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
            max_tokens: 300
        }, {
            headers: this.aiServices.openai.headers,
            timeout: 10000
        });

        const content = response.data.choices[0].message.content;
        return this.parseAIResponse(content);
    }

    async classifyWithClaude(prompt) {
        if (!process.env.CLAUDE_API_KEY) {
            throw new Error('未設置Claude API密鑰');
        }

        const response = await axios.post(this.aiServices.claude.url, {
            model: "claude-3-haiku-20240307",
            max_tokens: 300,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        }, {
            headers: this.aiServices.claude.headers,
            timeout: 10000
        });

        const content = response.data.content[0].text;
        return this.parseAIResponse(content);
    }

    parseAIResponse(content) {
        try {
            // 嘗試提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    isFPS: result.isFPS === true,
                    confidence: result.confidence || 85,
                    subGenre: result.subGenre || null,
                    reason: result.reason || '無',
                    aiProvider: this.currentService
                };
            }
            
            // 如果沒有找到JSON，嘗試文本解析
            const isFPS = /是.*fps|fps.*遊戲|第一人稱射擊/i.test(content) && 
                         !/不是|非fps|不屬於/i.test(content);
            
            return {
                success: true,
                isFPS: isFPS,
                confidence: 70,
                subGenre: null,
                reason: '基於文本解析',
                aiProvider: this.currentService
            };
            
        } catch (error) {
            console.error('AI回應解析失敗:', error.message);
            throw new Error('AI回應格式無效');
        }
    }

    fallbackClassification(gameName, additionalInfo) {
        console.log(`🔄 使用備用規則匹配: ${gameName}`);
        
        const name = gameName.toLowerCase();
        const { description = '', tags = [] } = additionalInfo;
        const allText = `${name} ${description} ${tags.join(' ')}`.toLowerCase();
        
        // 規則匹配
        const isFPS = this.fallbackKeywords.some(keyword => 
            allText.includes(keyword.toLowerCase())
        );
        
        let subGenre = null;
        if (isFPS) {
            if (allText.includes('battle royale') || allText.includes('大逃殺')) {
                subGenre = 'battle-royale';
            } else if (allText.includes('tactical') || allText.includes('戰術')) {
                subGenre = 'tactical-fps';
            } else if (allText.includes('hero') || allText.includes('英雄')) {
                subGenre = 'hero-fps';
            } else {
                subGenre = 'fps';
            }
        }
        
        return {
            success: true,
            isFPS: isFPS,
            confidence: isFPS ? 60 : 80, // 匹配到的置信度較低，未匹配到的較高
            subGenre: subGenre,
            reason: '規則匹配',
            aiProvider: 'fallback'
        };
    }

    // 批量分類
    async classifyGames(games, batchSize = 5) {
        console.log(`🤖 開始批量AI分類 ${games.length} 個遊戲...`);
        
        const results = [];
        
        for (let i = 0; i < games.length; i += batchSize) {
            const batch = games.slice(i, i + batchSize);
            console.log(`📊 處理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(games.length/batchSize)}`);
            
            const batchPromises = batch.map(game => 
                this.classifyGame(game.name, {
                    description: game.description,
                    tags: game.tags,
                    viewers: game.viewers,
                    genre: game.genre
                }).then(result => ({
                    ...game,
                    classification: result
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // 避免API限制
            if (i + batchSize < games.length) {
                await this.delay(1000);
            }
        }
        
        const fpsGames = results.filter(game => game.classification.isFPS);
        
        console.log(`✅ AI分類完成！發現 ${fpsGames.length} 個FPS遊戲`);
        console.log(`📊 使用AI分析: ${results.filter(r => r.classification.aiProvider !== 'fallback').length} 個`);
        console.log(`🔄 使用備用方法: ${results.filter(r => r.classification.aiProvider === 'fallback').length} 個`);
        
        return fpsGames;
    }

    // 設置AI服務
    setAIService(service) {
        if (this.aiServices[service]) {
            this.currentService = service;
            console.log(`✅ 切換到 ${service.toUpperCase()} AI服務`);
        } else {
            console.error(`❌ 不支援的AI服務: ${service}`);
        }
    }

    // 檢查API密鑰配置
    checkAPIKeys() {
        const status = {
            openai: !!process.env.OPENAI_API_KEY,
            claude: !!process.env.CLAUDE_API_KEY
        };
        
        console.log('🔑 AI API密鑰狀態:');
        console.log(`   OpenAI: ${status.openai ? '✅ 已配置' : '❌ 未配置'}`);
        console.log(`   Claude: ${status.claude ? '✅ 已配置' : '❌ 未配置'}`);
        
        return status;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AIGameClassifier(); 