class TerminalGame {
    constructor() {
        this.terminalContent = document.querySelector('.terminal-content');
        this.currentThemeIndex = 0;
        this.currentPuzzleIndex = 0;
        this.currentMenuIndex = 0;
        this.currentPuzzle = null;
        this.currentProgress = 0;
        this.discoveredPoints = 0;
        this.hintCount = 2;

        // 先加载开始菜单
        this.loadView('start-menu')
            .then(() => {
                return Promise.all([
                    this.loadView('rules-screen'),
                    this.loadView('social-screen'),
                    this.loadView('game-content')
                ]);
            })
            .then(() => {
                this.initializeElements();
                this.hideAllScreens();
                this.startMenu.classList.remove('hidden');
                this.setupMenuClickEvents();
            });
    }

    setupMenuClickEvents() {
        // 设置主菜单点击事件
        const menuOptions = document.querySelectorAll('.menu-option');
        menuOptions.forEach((option, index) => {
            option.addEventListener('click', () => {
                this.handleMenuSelection(index);
            });
        });

        // 设置返回主菜单按钮点击事件
        document.querySelectorAll('.terminal-button').forEach(button => {
            if (button.textContent.includes('返回主菜单')) {
                button.addEventListener('click', () => this.showStartMenu());
            }
        });
    }

    init() {
        if (this.themeList) {
            this.themeList.innerHTML = '<div class="prompt">> 选择你的任务：</div>';
            this.renderThemes();
            this.themeList.classList.remove('hidden');
        }
        this.setupGameEvents();
    }

    renderThemes() {
        gameData.themes.forEach((theme, index) => {
            const themeElement = document.createElement('div');
            themeElement.className = 'theme-option';
            themeElement.textContent = theme.name;
            themeElement.addEventListener('click', () => {
                this.currentThemeIndex = index;
                this.selectTheme();
            });
            this.themeList.appendChild(themeElement);
        });
    }

    showPuzzleList(puzzles) {
        if (this.puzzleList) {
            this.puzzleList.remove();
        }
        
        this.puzzleList = document.createElement('div');
        this.puzzleList.className = 'puzzle-list';
        this.puzzleList.innerHTML = '<div class="prompt">> 选择一个故事：</div>';

        puzzles.forEach((puzzle, index) => {
            const puzzleElement = document.createElement('div');
            puzzleElement.className = 'theme-option';
            puzzleElement.textContent = puzzle.title;
            puzzleElement.addEventListener('click', () => {
                this.currentPuzzleIndex = index;
                this.selectPuzzle(puzzles);
            });
            this.puzzleList.appendChild(puzzleElement);
        });

        this.gameContent.appendChild(this.puzzleList);
    }

    setupGameEvents() {
        // 聊天输入框的事件
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.handleChatInput();
                }
            });
        }

        // 返回按钮事件
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.returnToMainMenu();
            });
        }

        // 提示按钮事件
        if (this.hintButton) {
            this.hintButton.addEventListener('click', () => {
                if (this.hintCount > 0) {
                    this.getHint();
                }
            });
        }
    }

    async loadView(viewName) {
        try {
            const response = await fetch(`views/${viewName}.html`);
            const html = await response.text();
            this.terminalContent.innerHTML += html;
        } catch (error) {
            console.error(`加载视图 ${viewName} 失败:`, error);
        }
    }

    async handleMenuSelection(index) {
        switch (index) {
            case 0: // 开始游戏
                if (!this.gameContent) {
                    await this.loadView('game-content');
                    this.initializeElements();
                }
                if (this.startMenu) {
                    this.startMenu.classList.add('hidden');
                }
                if (this.gameContent) {
                    this.gameContent.classList.remove('hidden');
                    this.init();
                }
                break;
                
            case 1: // 游戏规则
                if (!this.rulesScreen) {
                    await this.loadView('rules-screen');
                    this.initializeElements();
                }
                if (this.startMenu) {
                    this.startMenu.classList.add('hidden');
                }
                if (this.rulesScreen) {
                    this.rulesScreen.classList.remove('hidden');
                }
                break;
                
            case 2: // 社交媒体
                if (!this.socialScreen) {
                    await this.loadView('social-screen');
                    this.initializeElements();
                }
                if (this.startMenu) {
                    this.startMenu.classList.add('hidden');
                }
                if (this.socialScreen) {
                    this.socialScreen.classList.remove('hidden');
                }
                break;
        }
    }

    initializeElements() {
        this.startMenu = document.getElementById('start-menu');
        this.rulesScreen = document.getElementById('rules-screen');
        this.socialScreen = document.getElementById('social-screen');
        this.gameContent = document.getElementById('game-content');

        this.themeList = document.getElementById('theme-list');
        this.puzzleContent = document.getElementById('puzzle-content');
        this.chatWindow = document.getElementById('chat-window');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.puzzleText = document.getElementById('puzzle-text');

        this.progress = document.getElementById('progress');
        this.progressText = document.querySelector('.progress-text');
        this.backButton = document.getElementById('back-button');
        this.hintButton = document.getElementById('hint-button');
        this.hintCountElement = document.querySelector('.hint-count');
        this.feedback = document.getElementById('feedback');
    }

    hideAllScreens() {
        [
            this.startMenu,
            this.rulesScreen,
            this.socialScreen,
            this.gameContent,
            this.themeList,
            this.puzzleContent,
            this.chatWindow,
            this.backButton,
            this.hintButton
        ].forEach(element => {
            if (element) {
                element.classList.add('hidden');
            }
        });
    }

    selectTheme() {
        const selectedTheme = gameData.themes[this.currentThemeIndex];
        
        // 先隐藏主题列表
        if (this.themeList) {
            this.themeList.classList.add('hidden');
        }
        
        if (selectedTheme.puzzles.length > 1) {
            this.showPuzzleList(selectedTheme.puzzles);
        } else {
            // 如果只有一个故事，直接开始
            this.startPuzzle(selectedTheme.puzzles[0]);
        }
    }

    selectPuzzle(puzzles) {
        const selectedPuzzle = puzzles[this.currentPuzzleIndex];
        this.puzzleList.remove();
        this.startPuzzle(selectedPuzzle);
    }

    returnToThemeList() {
        if (this.puzzleList) {
            this.puzzleList.remove();
        }
        this.currentPuzzleIndex = 0;
        this.themeList.classList.remove('hidden');
    }

    startPuzzle(puzzle) {
        if (!this.puzzleContent || !this.chatWindow || !this.backButton || !this.hintButton) {
            console.error('游戏元素未正确初始化');
            return;
        }

        // 清理可能存在的故事列表
        if (this.puzzleList) {
            this.puzzleList.remove();
        }

        // 确保主题列表和其他不相关元素都被隐藏
        if (this.themeList) {
            this.themeList.classList.add('hidden');
        }

        this.currentPuzzle = puzzle;
        this.puzzleContent.classList.remove('hidden');
        this.chatWindow.classList.remove('hidden');
        this.backButton.classList.remove('hidden');
        this.hintButton.classList.remove('hidden');
        
        const puzzleText = document.getElementById('puzzle-text');
        if (puzzleText) {
            puzzleText.textContent = puzzle.question;
        }

        if (this.chatInput) {
            this.chatInput.focus();
        }

        this.currentProgress = 0;
        if (this.progress) {
            this.progress.style.width = '0%';
        }
        if (this.progressText) {
            this.progressText.textContent = '0%';
        }

        this.addMessage('系统', '你可以问我问题，我会回答"是"或"否"。当你想到答案时，直接告诉我答案。', 'ai');
        this.discoveredPoints = 0;
        this.hintCount = 2;
        this.updateHintCount();
    }

    returnToMainMenu() {
        // 清理聊天和进度
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
        if (this.chatInput) {
            this.chatInput.value = '';
        }
        this.currentProgress = 0;
        if (this.progress) {
            this.progress.style.width = '0%';
        }
        if (this.progressText) {
            this.progressText.textContent = '0%';
        }
        
        // 隐藏所有游戏相关元素
        if (this.puzzleContent) {
            this.puzzleContent.classList.add('hidden');
        }
        if (this.chatWindow) {
            this.chatWindow.classList.add('hidden');
        }
        if (this.backButton) {
            this.backButton.classList.add('hidden');
        }
        if (this.hintButton) {
            this.hintButton.classList.add('hidden');
        }
        
        // 清理故事列表
        if (this.puzzleList) {
            this.puzzleList.remove();
        }
        
        // 显示主题列表
        if (this.themeList) {
            this.themeList.classList.remove('hidden');
        }
        
        this.currentPuzzleIndex = 0;
    }

    async handleChatInput() {
        const input = this.chatInput.value.trim();
        if (!input) return;

        this.addMessage('你', input, 'user');
        this.chatInput.value = '';

        try {
            const analysis = await this.analyzeInput(input);
            
            if (analysis.progress > this.currentProgress) {
                this.updateProgress(analysis.progress);
            }

            this.addMessage('AI', analysis.response, 'ai');

        } catch (error) {
            console.error('AI 回答出错:', error);
            this.addMessage('AI', '无关', 'ai');
        }
    }

    async analyzeInput(input) {
        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{
                        role: "system",
                        content: "你是海龟汤游戏的评判系统..."
                    }, {
                        role: "user",
                        content: prompt
                    }],
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error('API 请求失败');
            }

            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            console.error('分析输入失败:', error);
            return {
                isAnswer: false,
                isCorrect: false,
                response: "无关",
                progress: this.currentProgress
            };
        }
    }

    updateProgress(progress) {
        if (progress > this.currentProgress) {
            this.currentProgress = progress;
            this.progress.style.width = `${this.currentProgress}%`;
            this.progressText.textContent = `${Math.round(this.currentProgress)}%`;
            
            this.progress.style.transition = 'width 0.5s ease-in-out';

            if (this.currentProgress >= 100) {
                this.showCelebration();
            }
        }
    }

    showCelebration() {
        const modal = document.createElement('div');
        modal.className = 'celebration-modal';
        modal.innerHTML = `
            <h2>🎉 恭喜你解开了谜题！ 🎉</h2>
            <p>完整故事：</p>
            <div class="answer">${this.currentPuzzle.answer}</div>
            <button class="terminal-button">继续探索</button>
        `;

        document.body.appendChild(modal);

        const button = modal.querySelector('button');
        button.addEventListener('click', () => {
            modal.remove();
            this.returnToMainMenu();
        });

        const handleKeydown = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                modal.remove();
                this.returnToMainMenu();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    addMessage(sender, message, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.textContent = `${sender}: ${message}`;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateHintCount() {
        this.hintCountElement.textContent = this.hintCount;
        this.hintButton.disabled = this.hintCount === 0;
    }

    async getHint() {
        if (this.hintCount <= 0) return;

        const prompt = `
        基于当前进度(${this.currentProgress}%)，生成一个引导性问题。

        谜题：${this.currentPuzzle.question}

        提示规则：
        1. 不要涉及任何具体答案内容
        2. 引导玩家思考方向，而不是具体细节
        3. 必须是"是"或"否"的问题
        4. 根据进度提供不同层次的引导：
           - 0-30%: 引导关注故事的基本要素（人物、地点、时间等）
           - 31-60%: 引导思考事件的性质（动机、原因、目的等）
           - 61-90%: 引导思考事件的关联性（因果、影响、结果等）
           - 91-100%: 引导思考整体逻辑

        提示类型示例：
        - "这件事是否与人际关系有关？"
        - "事情的发生是否有特定的时间背景？"
        - "是否需要考虑环境因素？"
        - "这个结果是否是必然的？"

        请直接返回一个引导性问题，不要包含任何具体剧情信息。
        `;

        try {
            const response = await fetch(`${CONFIG.OPENAI_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "system",
                        content: "你是海龟汤游戏的提示系统。你的任务是生成抽象的引导性问题，帮助玩家思考方向，但绝不能暴露任何与答案相关的具体信息。"
                    }, {
                        role: "user",
                        content: prompt
                    }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error('API 请求失败');
            }

            const data = await response.json();
            const hint = data.choices[0].message.content.trim();
            
            this.addMessage('系统', hint, 'ai');
            this.hintCount--;
            this.updateHintCount();

        } catch (error) {
            console.error('获取提示失败:', error);
            this.addMessage('系统', '抱歉，无法获取提示，请稍后再试。', 'ai');
        }
    }

    showStartMenu() {
        if (this.rulesScreen) {
            this.rulesScreen.classList.add('hidden');
        }
        if (this.socialScreen) {
            this.socialScreen.classList.add('hidden');
        }
        if (this.gameContent) {
            this.gameContent.classList.add('hidden');
        }
        if (this.startMenu) {
            this.startMenu.classList.remove('hidden');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new TerminalGame();
}); 