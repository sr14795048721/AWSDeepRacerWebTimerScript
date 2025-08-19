// ==UserScript==
// @name         AWS DeepRacer Timer and Leaderboard
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  为AWS DeepRacer添加计时器、排名和模型记录功能，支持自动计时和模型识别 | Adds timer, ranking and model recording for AWS DeepRacer, supports auto-timing and model recognition
// @author       Your Name
// @match        https://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式
    GM_addStyle(`
        .timer-container {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            padding: 20px;
            width: 320px;
            z-index: 10000;
            border: 1px solid #ddd;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .timer-container h2 {
            color: #232f3e;
            margin-top: 0;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
        }

        .timer-container h2:before {
            content: "";
            display: inline-block;
            width: 8px;
            height: 25px;
            background: #ff9900;
            border-radius: 4px;
            margin-right: 12px;
        }

        .timer-display {
            font-size: 42px;
            font-weight: 700;
            text-align: center;
            background: linear-gradient(135deg, #232f3e 0%, #152939 100%);
            color: #ff9900;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
        }

        .timer-display:after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff9900, #ffcc00, #ff9900);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { background-position: -100% 0; }
            100% { background-position: 200% 0; }
        }

        .model-select-container {
            margin: 20px 0;
        }

        .model-select-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #232f3e;
            font-size: 14px;
        }

        .model-select {
            width: 100%;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            background-color: #f8f9fa;
            font-size: 15px;
            transition: all 0.2s;
        }

        .model-select:focus {
            outline: none;
            border-color: #ff9900;
            box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.2);
        }

        .timer-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 20px 0;
        }

        .timer-btn {
            padding: 14px 0;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .timer-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        .timer-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .timer-btn:active:not(:disabled) {
            transform: translateY(1px);
        }

        .start-btn {
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            color: white;
        }

        .stop-btn {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
        }

        .reset-btn {
            grid-column: span 2;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
        }

        .current-model {
            margin: 20px 0;
            padding: 18px;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-radius: 10px;
            font-size: 14px;
            border-left: 4px solid #3498db;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            box-shadow: 0 0 8px currentColor;
        }

        .status-active {
            background-color: #2ecc71;
            color: #2ecc71;
            animation: pulseStatus 1.5s infinite;
        }

        @keyframes pulseStatus {
            0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(46, 204, 113, 0); }
            100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }

        .status-inactive {
            background-color: #e74c3c;
            color: #e74c3c;
        }

        .leaderboard {
            margin-top: 25px;
            max-height: 320px;
            overflow-y: auto;
            border: 1px solid #e0e5eb;
            border-radius: 10px;
            background: white;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .leaderboard h3 {
            text-align: center;
            margin: 0;
            padding: 15px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            position: sticky;
            top: 0;
            z-index: 1;
            border-bottom: 1px solid #e0e5eb;
            color: #232f3e;
            font-size: 17px;
        }

        .leaderboard-item {
            display: flex;
            padding: 14px;
            border-bottom: 1px solid #f0f2f5;
            background-color: #fff;
            transition: background-color 0.2s;
            position: relative;
        }

        .leaderboard-item:hover {
            background-color: #f8f9fa;
        }

        .leaderboard-item:nth-child(even) {
            background-color: #f9fbfd;
        }

        .leaderboard-item:first-child {
            background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
            border-left: 4px solid #ff9900;
        }

        .leaderboard-item:first-child .rank {
            background: linear-gradient(135deg, #ff9900 0%, #ff8c00 100%);
            color: white;
            box-shadow: 0 4px 8px rgba(255, 153, 0, 0.3);
        }

        .rank {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
            font-size: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .model-info {
            flex-grow: 1;
            font-size: 14px;
        }

        .model-name {
            font-weight: 600;
            color: #232f3e;
            margin-bottom: 4px;
            font-size: 15px;
        }

        .time-result {
            color: #2c3e50;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            font-size: 15px;
            letter-spacing: 1px;
        }

        .date-info {
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 6px;
        }

        .clear-btn {
            width: 100%;
            padding: 14px 0;
            background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 20px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.2s;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .clear-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .clear-btn:active {
            transform: translateY(1px);
        }

        .auto-sync-indicator {
            display: inline-flex;
            align-items: center;
            margin-top: 8px;
            font-size: 13px;
            color: #2ecc71;
        }

        .auto-sync-indicator .status-indicator {
            margin-right: 5px;
        }

        @media (max-width: 768px) {
            .timer-container {
                width: calc(100% - 40px);
                right: 20px;
                left: 20px;
                top: 10px;
            }

            .timer-display {
                font-size: 36px;
                padding: 15px;
            }

            .timer-controls {
                grid-template-columns: 1fr;
            }

            .reset-btn {
                grid-column: 1;
            }
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
            vertical-align: middle;
        }

        .badge-new {
            background: #ff9900;
            color: white;
        }
    `);

    // 创建计时器UI
    function createTimerUI() {
        const container = document.createElement('div');
        container.className = 'timer-container';
        container.innerHTML = `
            <h2>AWS DeepRacer 智能计时器</h2>
            <div class="timer-display" id="timer">00:00.000</div>
            <div class="model-select-container">
                <label class="model-select-label">当前模型</label>
                <select class="model-select" id="modelSelect">
                    <option value="">正在加载模型...</option>
                </select>
            </div>
            <div class="timer-controls">
                <button class="timer-btn start-btn" id="startBtn">开始计时</button>
                <button class="timer-btn stop-btn" id="stopBtn" disabled>停止</button>
                <button class="timer-btn reset-btn" id="resetBtn">重置</button>
            </div>
            <div class="current-model">
                当前模型: <strong id="currentModelName">未选择</strong>
                <div>状态: <span id="vehicleStatus"><span class="status-indicator status-inactive"></span>未运行</span></div>
                <div id="autoSyncStatus" class="auto-sync-indicator">
                    <span class="status-indicator status-active"></span>自动同步已启用
                </div>
            </div>
            <div class="leaderboard">
                <h3>最佳成绩排行榜</h3>
                <div id="leaderboardContent">
                    <div class="leaderboard-item">
                        <div class="rank">1</div>
                        <div class="model-info">
                            <div class="model-name">强化学习模型 <span class="badge badge-new">新纪录</span></div>
                            <div class="time-result">00:45.320</div>
                            <div class="date-info">2023-10-15 14:30:22</div>
                        </div>
                    </div>
                </div>
            </div>
            <button class="clear-btn" id="clearBtn">清除所有记录</button>
        `;

        document.body.appendChild(container);
        return container;
    }

    // 计时器功能
    function setupTimer() {
        // 计时器变量
        let startTime = 0;
        let elapsedTime = 0;
        let timerInterval = null;
        let isRunning = false;
        let lastModelName = "";

        // 模型数据
        let selectedModel = '';
        let records = GM_getValue('deepracer_records', []);

        // DOM元素
        const timerDisplay = document.getElementById('timer');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const resetBtn = document.getElementById('resetBtn');
        const modelSelect = document.getElementById('modelSelect');
        const currentModelName = document.getElementById('currentModelName');
        const leaderboardContent = document.getElementById('leaderboardContent');
        const clearBtn = document.getElementById('clearBtn');
        const vehicleStatus = document.getElementById('vehicleStatus');
        const autoSyncStatus = document.getElementById('autoSyncStatus');

        // 初始化页面
        function initialize() {
            updateStatus();
            renderLeaderboard();
            setupModelDetection();
            listenToVehicleButtons();
        }

        // 更新状态显示
        function updateStatus() {
            if (vehicleStatus) {
                if (isRunning) {
                    vehicleStatus.innerHTML = '<span class="status-indicator status-active"></span>运行中';
                } else {
                    vehicleStatus.innerHTML = '<span class="status-indicator status-inactive"></span>未运行';
                }
            }
        }

        // 开始计时
        function startTimer() {
            if (isRunning) return;

            startTime = Date.now() - elapsedTime;
            timerInterval = setInterval(updateTimer, 10);
            isRunning = true;

            if (startBtn) startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;

            updateStatus();
        }

        // 更新计时器显示
        function updateTimer() {
            const currentTime = Date.now();
            elapsedTime = currentTime - startTime;

            const minutes = Math.floor(elapsedTime / 60000);
            const seconds = Math.floor((elapsedTime % 60000) / 1000);
            const milliseconds = Math.floor((elapsedTime % 1000));

            if (timerDisplay) {
                timerDisplay.textContent =
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
            }
        }

        // 停止计时
        function stopTimer() {
            if (!isRunning) return;

            clearInterval(timerInterval);
            isRunning = false;

            if (startBtn) startBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;

            updateStatus();

            // 保存记录
            saveRecord();
        }

        // 重置计时器
        function resetTimer() {
            clearInterval(timerInterval);
            isRunning = false;
            elapsedTime = 0;

            if (timerDisplay) timerDisplay.textContent = '00:00.000';

            if (startBtn) startBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;

            updateStatus();
        }

        // 保存记录
        function saveRecord() {
            if (elapsedTime <= 0 || !selectedModel) return;

            const modelName = currentModelName.textContent || "未知模型";
            const time = timerDisplay ? timerDisplay.textContent : '00:00.000';
            const date = new Date().toLocaleString();

            const record = {
                modelId: selectedModel,
                modelName: modelName,
                time: time,
                timestamp: Date.now(),
                date: date,
                milliseconds: elapsedTime
            };

            records.push(record);
            records.sort((a, b) => a.milliseconds - b.milliseconds);

            // 只保留前10名
            if (records.length > 10) {
                records = records.slice(0, 10);
            }

            GM_setValue('deepracer_records', records);
            renderLeaderboard();
        }

        // 渲染排名板
        function renderLeaderboard() {
            if (!leaderboardContent) return;

            leaderboardContent.innerHTML = '';

            if (records.length === 0) {
                leaderboardContent.innerHTML = '<div class="leaderboard-item" style="justify-content: center; color: #95a5a6;">暂无记录</div>';
                return;
            }

            records.forEach((record, index) => {
                const isNewRecord = index === 0 && record.milliseconds === Math.min(...records.map(r => r.milliseconds));

                const item = document.createElement('div');
                item.className = 'leaderboard-item';

                item.innerHTML = `
                    <div class="rank">${index + 1}</div>
                    <div class="model-info">
                        <div class="model-name">${record.modelName} ${isNewRecord ? '<span class="badge badge-new">新纪录</span>' : ''}</div>
                        <div class="time-result">${record.time}</div>
                        <div class="date-info">${record.date}</div>
                    </div>
                `;

                leaderboardContent.appendChild(item);
            });
        }

        // 清除所有记录
        function clearRecords() {
            if (confirm('确定要清除所有计时记录吗？此操作不可撤销。')) {
                records = [];
                GM_setValue('deepracer_records', []);
                renderLeaderboard();
            }
        }

        // 设置模型检测
        function setupModelDetection() {
            // 使用MutationObserver监听模型选择变化
            const observer = new MutationObserver(() => {
                detectModelChange();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'aria-selected']
            });

            // 立即尝试检测模型
            detectModelChange();
        }

        // 检测模型变化
        function detectModelChange() {
            try {
                // 尝试从页面获取模型名称
                const modelElement = document.querySelector('.awsui-select-trigger .awsui-select-trigger-textbox');
                if (!modelElement) return;

                const modelName = modelElement.textContent.trim();
                if (!modelName || modelName === 'Choose a model') return;

                // 更新模型名称显示
                if (currentModelName && modelName !== lastModelName) {
                    currentModelName.textContent = modelName;
                    lastModelName = modelName;

                    // 更新模型选择下拉菜单
                    updateModelSelect(modelName);

                    // 显示同步状态
                    if (autoSyncStatus) {
                        autoSyncStatus.innerHTML = `
                            <span class="status-indicator status-active"></span>
                            已检测到模型: ${modelName}
                        `;
                    }
                }
            } catch (e) {
                console.error('模型检测错误:', e);
            }
        }

        // 更新模型选择下拉菜单
        function updateModelSelect(modelName) {
            if (!modelSelect) return;

            // 检查是否已存在该模型
            let exists = false;
            for (let i = 0; i < modelSelect.options.length; i++) {
                if (modelSelect.options[i].text === modelName) {
                    exists = true;
                    break;
                }
            }

            // 如果不存在则添加
            if (!exists && modelName) {
                const option = document.createElement('option');
                option.value = `Model_${modelSelect.options.length + 1}`;
                option.text = modelName;
                modelSelect.appendChild(option);
            }

            // 设置当前选中项
            for (let i = 0; i < modelSelect.options.length; i++) {
                if (modelSelect.options[i].text === modelName) {
                    modelSelect.selectedIndex = i;
                    selectedModel = modelSelect.value;
                    break;
                }
            }
        }

        // 监听车辆按钮
        function listenToVehicleButtons() {
            // 使用MutationObserver监听车辆控制按钮的变化
            const observer = new MutationObserver(() => {
                findVehicleButtons();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['disabled']
            });

            // 立即尝试查找按钮
            findVehicleButtons();
        }

        // 查找车辆控制按钮
        function findVehicleButtons() {
            try {
                // 查找车辆控制区域
                const controlArea = document.querySelector('.vehicle-control-controls');
                if (!controlArea) return;

                // 查找所有按钮
                const buttons = controlArea.querySelectorAll('button');

                let startVehicleBtn = null;
                let stopVehicleBtn = null;

                // 识别按钮
                buttons.forEach(button => {
                    // 查找按钮文本元素
                    const buttonTextSpan = button.querySelector('span[awsui-button-region="text"]');
                    if (buttonTextSpan) {
                        const buttonText = buttonTextSpan.textContent.trim();

                        if (buttonText === 'Start vehicle') {
                            startVehicleBtn = button;
                        } else if (buttonText === 'Stop vehicle') {
                            stopVehicleBtn = button;
                        }
                    }
                });

                if (!startVehicleBtn || !stopVehicleBtn) return;

                console.log('找到车辆控制按钮: ', {
                    startVehicleBtn: startVehicleBtn.textContent.trim(),
                    stopVehicleBtn: stopVehicleBtn.textContent.trim()
                });

                // 当车辆运行时自动开始计时
                if (stopVehicleBtn && !stopVehicleBtn.disabled && !isRunning) {
                    console.log('车辆已启动 - 开始计时');
                    startTimer();
                }

                // 当车辆停止时自动停止计时
                if (startVehicleBtn && !startVehicleBtn.disabled && isRunning) {
                    console.log('车辆已停止 - 停止计时');
                    stopTimer();
                }
            } catch (e) {
                console.error('车辆按钮检测错误:', e);
            }
        }

        // 事件监听
        if (startBtn) startBtn.addEventListener('click', startTimer);
        if (stopBtn) stopBtn.addEventListener('click', stopTimer);
        if (resetBtn) resetBtn.addEventListener('click', resetTimer);
        if (clearBtn) clearBtn.addEventListener('click', clearRecords);

        // 模型选择变化事件
        if (modelSelect) {
            modelSelect.addEventListener('change', function() {
                selectedModel = this.value;
                if (currentModelName) {
                    currentModelName.textContent = this.options[this.selectedIndex].text;
                }
            });
        }

        // 初始化页面
        initialize();
    }

    // 等待页面加载完成后初始化
    function initApp() {
        // 检查是否在控制车辆页面
        const isControlPage = window.location.hash.includes('controlVehicle') ||
                             (document.querySelector('h1') && document.querySelector('h1').textContent.includes('Control vehicle')) ||
                             document.querySelector('.vehicle-control-controls');

        if (!isControlPage) {
            // 如果不是控制页面，每隔1秒检查一次
            setTimeout(initApp, 1000);
            return;
        }

        // 确保页面主体已加载
        if (!document.body) {
            setTimeout(initApp, 100);
            return;
        }

        // 创建UI
        createTimerUI();

        // 设置计时器
        setTimeout(setupTimer, 500);
    }

    // 启动初始化过程
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        setTimeout(initApp, 1000);
    }
})();