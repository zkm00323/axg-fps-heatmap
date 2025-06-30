// 全局變量
let gamesData = [];
let trendingData = [];
let taiwanRankingData = [];
let gameChart = null;
let currentSort = 'heat';

// 🌍 地區標誌映射
const regionFlags = {
    '台灣': '🇹🇼',
    '美國': '🇺🇸',
    '日本': '🇯🇵',
    '韓國': '🇰🇷',
    '中國': '🇨🇳',
    '德國': '🇩🇪',
    '英國': '🇬🇧',
    '巴西': '🇧🇷',
    '俄羅斯': '🇷🇺',
    '法國': '🇫🇷',
    '印度': '🇮🇳'
};

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 FPS遊戲熱度追踪器已載入');
    console.log('🌍 包含全球地區熱度分析功能');
    loadAllData();
    
    // 每5分鐘自動刷新數據
    setInterval(loadAllData, 5 * 60 * 1000);
});

// 載入所有數據
async function loadAllData() {
    try {
        await Promise.all([
            loadGamesData(),
            loadTrendingData(),
            loadTaiwanRankingData()
        ]);
        updateLastUpdateTime();
    } catch (error) {
        console.error('載入數據失敗:', error);
        showError('無法載入數據，請稍後再試');
    }
}

// 載入遊戲數據
async function loadGamesData() {
    try {
        const response = await fetch('/api/games');
        if (!response.ok) throw new Error('網路錯誤');
        
        gamesData = await response.json();
        console.log('遊戲數據載入成功:', gamesData.length, '個遊戲');
        
        updateStatsCards();
        renderGamesGrid();
        updateGameSelect();
        
    } catch (error) {
        console.error('載入遊戲數據失敗:', error);
        document.getElementById('gamesGrid').innerHTML = 
            '<div class="error">載入遊戲數據失敗，請刷新頁面重試</div>';
    }
}

// 載入趨勢數據
async function loadTrendingData() {
    try {
        const response = await fetch('/api/trending');
        if (!response.ok) throw new Error('網路錯誤');
        
        trendingData = await response.json();
        console.log('趨勢數據載入成功:', trendingData.length, '個趨勢項目');
        
        renderTrendingGames();
        
    } catch (error) {
        console.error('載入趨勢數據失敗:', error);
        document.getElementById('trendingList').innerHTML = 
            '<div class="error">載入趨勢數據失敗</div>';
    }
}

// 🇹🇼 新增：載入台灣熱度排行榜
async function loadTaiwanRankingData() {
    try {
        const response = await fetch('/api/taiwan-ranking');
        if (!response.ok) throw new Error('網路錯誤');
        
        taiwanRankingData = await response.json();
        console.log('🇹🇼 台灣熱度數據載入成功:', taiwanRankingData.length, '個遊戲');
        
        renderTaiwanRankingData();
        
    } catch (error) {
        console.error('載入台灣熱度數據失敗:', error);
        document.getElementById('taiwanRanking').innerHTML = 
            '<div class="error">載入台灣熱度數據失敗</div>';
    }
}

// 🇹🇼 渲染台灣熱度排行榜
function renderTaiwanRankingData() {
    const taiwanRanking = document.getElementById('taiwanRanking');
    
    if (!taiwanRankingData || taiwanRankingData.length === 0) {
        taiwanRanking.innerHTML = '<div class="loading">暫無台灣熱度數據</div>';
        return;
    }
    
    const taiwanHTML = taiwanRankingData.slice(0, 8).map((game, index) => {
        const rank = index + 1;
        const topRegionsHTML = game.top_regions.map(region => 
            `<span class="region-flag">${regionFlags[region] || '🌍'}</span>`
        ).join('');
        
        return `
            <div class="taiwan-rank-item">
                <div class="taiwan-rank-header">
                    <div class="taiwan-rank-number">${rank}</div>
                    <div class="taiwan-game-name">${game.name}</div>
                </div>
                <div class="taiwan-scores">
                    <div class="taiwan-heat-score">${game.avg_taiwan_score}</div>
                    <div class="global-comparison">全球: ${game.avg_global_score}</div>
                </div>
                <div class="region-indicators">
                    <span style="font-size: 0.8rem; color: #666;">熱門地區:</span>
                    ${topRegionsHTML}
                </div>
            </div>
        `;
    }).join('');
    
    taiwanRanking.innerHTML = taiwanHTML;
}

// 更新統計卡片
function updateStatsCards() {
    const totalGames = gamesData.length;
    const hotGames = gamesData.filter(game => (game.avg_heat_score || game.heatScore) >= 60).length;
    
    // 🇹🇼 找出台灣最熱門的遊戲
    let taiwanTopGame = '-';
    if (taiwanRankingData && taiwanRankingData.length > 0) {
        taiwanTopGame = taiwanRankingData[0].name.length > 10 ? 
            taiwanRankingData[0].name.substring(0, 8) + '...' : 
            taiwanRankingData[0].name;
    }
    
    // 🌍 統計追踪的地區數量
    const regionSet = new Set();
    gamesData.forEach(game => {
        if (game.region_scores) {
            Object.keys(game.region_scores).forEach(region => regionSet.add(region));
        }
    });
    const globalRegions = regionSet.size || Object.keys(regionFlags).length;
    
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('hotGames').textContent = hotGames;
    document.getElementById('taiwanTopGame').textContent = taiwanTopGame;
    document.getElementById('globalRegions').textContent = globalRegions;
}

// 渲染遊戲網格
function renderGamesGrid() {
    const gamesGrid = document.getElementById('gamesGrid');
    
    if (!gamesData || gamesData.length === 0) {
        gamesGrid.innerHTML = '<div class="loading">暫無遊戲數據</div>';
        return;
    }
    
    // 根據當前排序方式排序
    const sortedGames = [...gamesData].sort((a, b) => {
        switch (currentSort) {
            case 'heat':
                return (b.avg_heat_score || b.heatScore || 0) - (a.avg_heat_score || a.heatScore || 0);
            case 'taiwan':
                return (b.avg_taiwan_heat_score || 0) - (a.avg_taiwan_heat_score || 0);
            case 'players':
                return (b.max_total_players || b.maxPlayers || 0) - (a.max_total_players || a.maxPlayers || 0);
            case 'viewers':
                return (b.max_viewers || b.maxViewers || 0) - (a.max_viewers || a.maxViewers || 0);
            default:
                return (b.avg_heat_score || b.heatScore || 0) - (a.avg_heat_score || a.heatScore || 0);
        }
    });
    
    const gamesHTML = sortedGames.map((game, index) => {
        const rank = index + 1;
        const rankEmoji = getRankEmoji(rank);
        
        // 🌍 地區信息處理
        const topRegions = game.top_regions || [];
        const regionScores = game.region_scores || {};
        const taiwanScore = game.avg_taiwan_heat_score || regionScores['台灣'] || 0;
        
        const topRegionsHTML = topRegions.slice(0, 3).map(region => 
            `<span class="region-badge">${regionFlags[region] || '🌍'} ${region}</span>`
        ).join('');
        
        return `
            <div class="game-card" onclick="selectGame('${game.name}')">
                <div class="game-header">
                    <div class="game-title">${rankEmoji} ${game.name}</div>
                    <div class="game-status">${game.main_platform || 'Multi'}</div>
                </div>
                <div class="game-metrics">
                    <div class="metric">
                        <span class="metric-value">${formatNumber(game.max_total_players || game.maxPlayers || 0)}</span>
                        <div class="metric-label">總玩家數</div>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${formatNumber(game.max_viewers || game.maxViewers || 0)}</span>
                        <div class="metric-label">觀看數</div>
                    </div>
                </div>
                <div class="heat-score">
                    <div class="heat-value">${Math.round(game.avg_heat_score || game.heatScore || 0)}</div>
                    <div class="heat-label">全球熱度</div>
                </div>
                <div class="game-region-info">
                    <div class="taiwan-heat-display">
                        <span class="taiwan-heat-label">🇹🇼 台灣熱度</span>
                        <span class="taiwan-heat-value">${Math.round(taiwanScore)}</span>
                    </div>
                    <div class="top-regions">
                        <span class="top-regions-label">熱門地區:</span>
                        ${topRegionsHTML || '<span class="region-badge">🌍 全球</span>'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    gamesGrid.innerHTML = gamesHTML;
}

// 渲染趨勢遊戲
function renderTrendingGames() {
    const trendingList = document.getElementById('trendingList');
    
    if (!trendingData || trendingData.length === 0) {
        trendingList.innerHTML = '<div class="loading">暫無趨勢數據</div>';
        return;
    }
    
    const trendingHTML = trendingData.slice(0, 5).map(trend => `
        <div class="trending-item">
            <div class="trending-info">
                <h4>${trend.name}</h4>
                <div style="display: flex; gap: 10px; font-size: 0.9rem; color: #666;">
                    <span>全球: ${Math.round(trend.current_score || 0)}</span>
                    <span>🇹🇼 台灣: ${Math.round(trend.current_taiwan_score || 0)}</span>
                    <span>${(trend.trend_change || 0) > 0 ? '+' : ''}${Math.round(trend.trend_change || 0)}</span>
                </div>
            </div>
            <div class="trending-stats">
                <div class="trend-indicator">${(trend.trend_change || 0) > 0 ? '📈' : '📉'}</div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: ${(trend.trend_change || 0) > 0 ? '#10b981' : '#ef4444'};">
                        ${(trend.trend_change || 0) > 0 ? '+' : ''}${Math.round(trend.trend_change || 0)}
                    </div>
                    <div style="font-size: 0.8rem; color: #666;">全球變化</div>
                </div>
            </div>
        </div>
    `).join('');
    
    trendingList.innerHTML = trendingHTML;
}

// 更新遊戲選擇下拉菜單
function updateGameSelect() {
    const gameSelect = document.getElementById('gameSelect');
    const options = ['<option value="">選擇遊戲...</option>'];
    
    gamesData.forEach(game => {
        options.push(`<option value="${game.name}">${game.name}</option>`);
    });
    
    gameSelect.innerHTML = options.join('');
}

// 載入遊戲圖表
async function loadGameChart() {
    const gameSelect = document.getElementById('gameSelect');
    const selectedGame = gameSelect.value;
    
    if (!selectedGame) {
        if (gameChart) {
            gameChart.destroy();
            gameChart = null;
        }
        return;
    }
    
    try {
        const response = await fetch(`/api/games/${encodeURIComponent(selectedGame)}/stats`);
        if (!response.ok) throw new Error('網路錯誤');
        
        const gameStats = await response.json();
        renderGameChart(gameStats);
        
    } catch (error) {
        console.error('載入遊戲圖表失敗:', error);
        showError('載入圖表數據失敗');
    }
}

// 渲染遊戲圖表
function renderGameChart(gameStats) {
    const ctx = document.getElementById('gameChart').getContext('2d');
    
    if (gameChart) {
        gameChart.destroy();
    }
    
    const labels = gameStats.hourlyData.map(data => 
        new Date(data.timestamp).toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    ).reverse();
    
    const heatScores = gameStats.hourlyData.map(data => data.heatScore).reverse();
    const steamPlayers = gameStats.hourlyData.map(data => data.steamPlayers).reverse();
    const twitchViewers = gameStats.hourlyData.map(data => data.twitchViewers).reverse();
    
    gameChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '熱度分數',
                    data: heatScores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Steam玩家數',
                    data: steamPlayers,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Twitch觀看數',
                    data: twitchViewers,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${gameStats.gameName} - 過去48小時數據趨勢`
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '時間'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '熱度分數'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '玩家/觀看數'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// 排序遊戲
function sortGames(sortType) {
    currentSort = sortType;
    
    // 更新按鈕狀態
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderGamesGrid();
}

// 選擇遊戲
function selectGame(gameName) {
    const gameSelect = document.getElementById('gameSelect');
    gameSelect.value = gameName;
    loadGameChart();
    
    // 滾動到圖表區域
    document.querySelector('.chart-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// 刷新數據
async function refreshData() {
    const refreshBtn = document.querySelector('.refresh-btn');
    const refreshIcon = document.getElementById('refreshIcon');
    
    refreshBtn.classList.add('loading');
    
    try {
        await loadAllData();
        showSuccess('數據刷新成功！');
    } catch (error) {
        showError('刷新失敗，請重試');
    } finally {
        refreshBtn.classList.remove('loading');
    }
}

// 更新最後更新時間
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('lastUpdate').textContent = timeString;
}

// 工具函數
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getRankEmoji(rank) {
    switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `#${rank}`;
    }
}

function showSuccess(message) {
    // 可以添加更好的通知系統
    console.log('✅', message);
}

function showError(message) {
    // 可以添加更好的錯誤提示系統
    console.error('❌', message);
}

// 🌍 新增：地區對比功能
async function compareRegions() {
    const regionSelect = document.getElementById('regionSelect');
    const selectedRegions = Array.from(regionSelect.selectedOptions).map(option => option.value);
    
    if (selectedRegions.length < 2) {
        showError('請至少選擇2個地區進行對比');
        return;
    }
    
    try {
        const response = await fetch(`/api/region-comparison?regions=${selectedRegions.join(',')}`);
        if (!response.ok) throw new Error('網路錯誤');
        
        const comparisonData = await response.json();
        renderRegionComparison(comparisonData, selectedRegions);
        
    } catch (error) {
        console.error('載入地區對比數據失敗:', error);
        document.getElementById('regionComparison').innerHTML = 
            '<div class="error">載入地區對比數據失敗</div>';
    }
}

// 🌍 渲染地區對比結果
function renderRegionComparison(comparisonData, selectedRegions) {
    const regionComparison = document.getElementById('regionComparison');
    
    if (!comparisonData || comparisonData.length === 0) {
        regionComparison.innerHTML = '<div class="hint">暫無對比數據</div>';
        return;
    }
    
    const comparisonHTML = comparisonData.slice(0, 10).map(game => {
        const regionScoresHTML = selectedRegions.map(region => {
            const score = game.region_scores[region] || 0;
            return `
                <div class="region-score-item">
                    <span class="region-score-flag">${regionFlags[region] || '🌍'}</span>
                    <div class="region-score-value">${score}</div>
                    <div class="region-score-name">${region}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="region-comparison-item">
                <div class="comparison-game-name">${game.game_name}</div>
                <div class="region-scores-grid">
                    ${regionScoresHTML}
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 0.9rem; color: #666;">
                    全球: ${Math.round(game.global_score || 0)} | 🇹🇼 台灣: ${Math.round(game.taiwan_score || 0)}
                </div>
            </div>
        `;
    }).join('');
    
    regionComparison.innerHTML = comparisonHTML;
} 