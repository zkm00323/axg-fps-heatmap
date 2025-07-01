#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 FPS遊戲熱度追踪器 - 部署前檢查');
console.log('====================================');

let allChecksPass = true;

// 檢查必要文件
const requiredFiles = [
    'package.json',
    'improved-server.js',
    'zbpack.json',
    'public/index.html',
    'public/script.js',
    'public/styles.css',
    'src/collectors/improvedGameDataCollector.js',
    'src/database/database.js',
    'src/processors/dataProcessor.js'
];

console.log('📁 檢查必要文件...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - 文件不存在`);
        allChecksPass = false;
    }
});

// 檢查package.json配置
console.log('\n📦 檢查package.json配置...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.main === 'improved-server.js') {
        console.log('✅ main字段正確指向improved-server.js');
    } else {
        console.log('❌ main字段應該指向improved-server.js');
        allChecksPass = false;
    }
    
    if (packageJson.scripts.start === 'node improved-server.js') {
        console.log('✅ start腳本正確');
    } else {
        console.log('❌ start腳本應該是 "node improved-server.js"');
        allChecksPass = false;
    }
    
    if (packageJson.engines && packageJson.engines.node) {
        console.log(`✅ Node.js版本要求: ${packageJson.engines.node}`);
    } else {
        console.log('⚠️ 建議添加Node.js版本要求');
    }
    
} catch (error) {
    console.log('❌ package.json格式錯誤');
    allChecksPass = false;
}

// 檢查zbpack.json配置
console.log('\n⚙️ 檢查zbpack.json配置...');
try {
    const zbpackJson = JSON.parse(fs.readFileSync('zbpack.json', 'utf8'));
    
    if (zbpackJson.start_command === 'npm start') {
        console.log('✅ Zeabur啟動命令正確');
    } else {
        console.log('❌ Zeabur啟動命令應該是 "npm start"');
        allChecksPass = false;
    }
    
    console.log(`✅ Node.js版本: ${zbpackJson.node_version}`);
    
} catch (error) {
    console.log('❌ zbpack.json格式錯誤');
    allChecksPass = false;
}

// 檢查gitignore
console.log('\n🚫 檢查.gitignore配置...');
if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('node_modules')) {
        console.log('✅ node_modules已被忽略');
    } else {
        console.log('❌ .gitignore應該包含node_modules');
        allChecksPass = false;
    }
} else {
    console.log('❌ .gitignore文件不存在');
    allChecksPass = false;
}

// 檢查data資料夾
console.log('\n💾 檢查data資料夾...');
if (fs.existsSync('data')) {
    console.log('✅ data資料夾存在');
} else {
    console.log('⚠️ data資料夾不存在（程式會自動創建）');
}

// 檢查服務器代碼
console.log('\n🔧 檢查服務器代碼...');
try {
    const serverCode = fs.readFileSync('improved-server.js', 'utf8');
    
    if (serverCode.includes('process.env.PORT')) {
        console.log('✅ 正確使用環境變數PORT');
    } else {
        console.log('❌ 服務器應該使用process.env.PORT');
        allChecksPass = false;
    }
    
    if (serverCode.includes("'0.0.0.0'")) {
        console.log('✅ 正確綁定到0.0.0.0');
    } else {
        console.log('⚠️ 建議綁定到0.0.0.0以確保在容器中正常運行');
    }
    
    if (serverCode.includes('/health')) {
        console.log('✅ 包含健康檢查端點');
    } else {
        console.log('⚠️ 建議添加健康檢查端點');
    }
    
} catch (error) {
    console.log('❌ 無法讀取服務器代碼');
    allChecksPass = false;
}

// 最終結果
console.log('\n' + '='.repeat(40));
if (allChecksPass) {
    console.log('🎉 所有檢查都通過！');
    console.log('✅ 您的應用已準備好部署到Zeabur');
    console.log('');
    console.log('📋 下一步：');
    console.log('1. 運行: chmod +x deploy.sh && ./deploy.sh');
    console.log('2. 前往 https://zeabur.com 部署');
    process.exit(0);
} else {
    console.log('❌ 部分檢查未通過');
    console.log('🔧 請修復上述問題後再嘗試部署');
    process.exit(1);
} 