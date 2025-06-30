const database = require('../database/database');

class DataProcessor {
    async getAllGames() {
        try {
            const games = await database.getAllGames();
            return games.map(game => ({
                name: game.name,
                heatScore: Math.round(game.avg_heat_score || 0),
                maxPlayers: game.max_players || 0,
                maxViewers: game.max_viewers || 0,
                dataPoints: game.data_points || 0,
                lastUpdate: game.last_update,
                status: this.getGameStatus(game.avg_heat_score)
            }));
        } catch (error) {
            console.error('獲取遊戲數據錯誤:', error);
            throw error;
        }
    }

    async getGameStats(gameName) {
        try {
            const stats = await database.getGameStats(gameName);
            return {
                gameName,
                hourlyData: stats.map(stat => ({
                    timestamp: stat.timestamp,
                    heatScore: stat.heat_score,
                    steamPlayers: stat.steam_players,
                    twitchViewers: stat.twitch_viewers,
                    youtubeViews: stat.youtube_views,
                    redditPosts: stat.reddit_posts
                })),
                summary: this.calculateGameSummary(stats)
            };
        } catch (error) {
            console.error('獲取遊戲統計錯誤:', error);
            throw error;
        }
    }

    async getTrendingGames() {
        try {
            const trending = await database.getTrendingGames();
            return trending.map(game => ({
                name: game.name,
                currentScore: Math.round(game.current_score || 0),
                previousScore: Math.round(game.previous_score || 0),
                trendChange: Math.round(game.trend_change || 0),
                trendDirection: this.getTrendDirection(game.trend_change),
                trendPercentage: this.calculateTrendPercentage(game.current_score, game.previous_score)
            }));
        } catch (error) {
            console.error('獲取趨勢數據錯誤:', error);
            throw error;
        }
    }

    getGameStatus(heatScore) {
        if (heatScore >= 80) return '🔥 超熱門';
        if (heatScore >= 60) return '📈 熱門';
        if (heatScore >= 40) return '📊 普通';
        if (heatScore >= 20) return '📉 冷門';
        return '❄️ 極冷門';
    }

    getTrendDirection(trendChange) {
        if (trendChange > 10) return '🚀 急升';
        if (trendChange > 5) return '📈 上升';
        if (trendChange > -5) return '➡️ 持平';
        if (trendChange > -10) return '📉 下降';
        return '⬇️ 急降';
    }

    calculateTrendPercentage(current, previous) {
        if (!previous || previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    calculateGameSummary(stats) {
        if (!stats || stats.length === 0) {
            return {
                averageHeatScore: 0,
                peakHeatScore: 0,
                peakPlayers: 0,
                peakViewers: 0,
                totalDataPoints: 0
            };
        }

        const heatScores = stats.map(s => s.heat_score);
        const players = stats.map(s => s.steam_players);
        const viewers = stats.map(s => s.twitch_viewers);

        return {
            averageHeatScore: Math.round(heatScores.reduce((a, b) => a + b, 0) / heatScores.length),
            peakHeatScore: Math.max(...heatScores),
            peakPlayers: Math.max(...players),
            peakViewers: Math.max(...viewers),
            totalDataPoints: stats.length
        };
    }
}

module.exports = new DataProcessor(); 