#!/bin/bash

# 🚀 FPS遊戲熱度追踪器 - Zeabur部署腳本

echo "🎯 FPS遊戲熱度追踪器 - Zeabur部署準備"
echo "========================================"

# 檢查是否在Git倉庫中
if [ ! -d ".git" ]; then
    echo "❌ 錯誤：當前目錄不是Git倉庫"
    echo "請先初始化Git倉庫："
    echo "  git init"
    echo "  git remote add origin <your-repo-url>"
    exit 1
fi

# 檢查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 發現未提交的更改，正在提交..."
    git add .
    git commit -m "準備Zeabur部署：更新配置和定時任務"
    echo "✅ 更改已提交"
else
    echo "✅ 沒有未提交的更改"
fi

# 推送到遠程倉庫
echo "🚀 推送到GitHub..."
git push origin main

echo ""
echo "🎉 部署準備完成！"
echo ""
echo "📋 下一步："
echo "1. 前往 https://zeabur.com"
echo "2. 使用GitHub帳號登入"
echo "3. 點擊 'Create Project'"
echo "4. 選擇 'Deploy New Service'"
echo "5. 選擇 'Git' 並找到您的倉庫"
echo "6. 點擊 'Import' 開始部署"
echo ""
echo "📖 詳細說明請查看 DEPLOY-README.md"
echo ""
echo "🌐 部署完成後，您的應用將："
echo "   - 每天凌晨2點自動更新數據"
echo "   - 24/7不間斷運行"
echo "   - 提供免費SSL證書"
echo "   - 支援自動擴展" 