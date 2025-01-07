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

        // Load start menu first
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

        // 更新返回主菜单按钮的事件监听
        document.querySelectorAll('.terminal-button').forEach(button => {
            if (button.textContent.includes('Back to Menu')) {
                button.addEventListener('click', () => this.showStartMenu());
            }
        });
    }

    init() {
        if (this.themeList) {
            this.themeList.innerHTML = '<div class="prompt">> Select your mission:</div>';
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
        this.puzzleList.innerHTML = '<div class="prompt">> Choose a story:</div>';

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
            const response = await fetch(`/views/${viewName}.html`);
            const html = await response.text();
            this.terminalContent.innerHTML += html;
        } catch (error) {
            console.error(`Failed to load view ${viewName}:`, error);
        }
    }

    async switchScreen(from, to) {
        if (!from || !to) return;

        // 创建 TV 切换效果
        const transition = document.createElement('div');
        transition.className = 'tv-transition';
        
        // 添加各种效果层
        const effects = [
            'tv-scanlines',
            'tv-static',
            'tv-distortion',
            'tv-flicker',
            'tv-rgb'
        ].map(className => {
            const effect = document.createElement('div');
            effect.className = className;
            return effect;
        });
        
        // 添加加载文字
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.innerHTML = 'System Switching<span class="loading-dots"></span>';
        
        effects.forEach(effect => transition.appendChild(effect));
        transition.appendChild(loadingText);
        document.body.appendChild(transition);

        // 添加退出动画
        from.style.transition = 'all 0.2s ease-out';
        from.style.transform = 'scale(0.95) translateY(-30px) skewY(-5deg)';
        from.style.filter = 'brightness(1.5) blur(10px)';
        from.style.opacity = '0';

        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 200));
        from.classList.add('hidden');
        
        // 更新加载文字
        loadingText.innerHTML = 'Loading New Interface<span class="loading-dots"></span>';
        
        // 重置样式
        from.style.transform = '';
        from.style.filter = '';
        from.style.opacity = '';

        // 显示新屏幕
        to.classList.remove('hidden');
        to.style.transform = 'scale(0.95) translateY(30px) skewY(5deg)';
        to.style.filter = 'brightness(1.5) blur(10px)';
        to.style.opacity = '0';
        
        // 强制重排
        to.offsetHeight;
        
        // 更新加载文字
        loadingText.innerHTML = 'Ready<span class="loading-dots"></span>';
        
        // 添加进入动画
        to.style.transition = 'all 0.2s ease-out';
        to.style.transform = 'scale(1) translateY(0) skewY(0)';
        to.style.filter = 'brightness(1) blur(0)';
        to.style.opacity = '1';

        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // 清理样式
        to.style.transform = '';
        to.style.filter = '';
        to.style.opacity = '';
        to.style.transition = '';

        // 移除过渡效果
        transition.remove();
    }

    async handleMenuSelection(index) {
        switch (index) {
            case 0: // 开始游戏
                if (!this.gameContent) {
                    await this.loadView('game-content');
                    this.initializeElements();
                }
                await this.switchScreen(this.startMenu, this.gameContent);
                this.init();
                break;
                
            case 1: // 游戏规则
                if (!this.rulesScreen) {
                    await this.loadView('rules-screen');
                    this.initializeElements();
                }
                await this.switchScreen(this.startMenu, this.rulesScreen);
                break;
                
            case 2: // 社交媒体
                if (!this.socialScreen) {
                    await this.loadView('social-screen');
                    this.initializeElements();
                }
                await this.switchScreen(this.startMenu, this.socialScreen);
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

        // 重新绑定返回按钮事件
        document.querySelectorAll('.terminal-button').forEach(button => {
            if (button.textContent.includes('Back to Menu')) {
                button.addEventListener('click', () => this.showStartMenu());
            }
        });
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

    async startPuzzle(puzzle) {
        if (!this.puzzleContent || !this.chatWindow || !this.backButton || !this.hintButton) {
            console.error('Game elements not properly initialized');
            return;
        }

        // Clean up existing story list
        if (this.puzzleList) {
            this.puzzleList.remove();
        }

        // Hide theme list and other irrelevant elements
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

        this.addMessage('System', 'You can ask me questions, and I will answer with "Yes" or "No". When you think you know the answer, tell me the complete story.', 'ai');
        this.discoveredPoints = 0;
        this.hintCount = 2;
        this.updateHintCount();

        await this.switchScreen(this.themeList, this.puzzleContent);
    }

    async returnToMainMenu() {
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

        await this.switchScreen(this.puzzleContent, this.themeList);
    }

    async handleChatInput() {
        const input = this.chatInput.value.trim();
        if (!input) return;

        this.addMessage('You', input, 'user');
        this.chatInput.value = '';

        try {
            const analysis = await this.analyzeInput(input);
            
            if (analysis.progress > this.currentProgress) {
                this.updateProgress(analysis.progress);
            }

            this.addMessage('AI', analysis.response, 'ai');

        } catch (error) {
            console.error('AI response error:', error);
            this.addMessage('AI', 'Irrelevant', 'ai');
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
                    prompt: {
                        question: this.currentPuzzle.question,
                        answer: this.currentPuzzle.answer,
                        input: input
                    },
                    type: 'analyze'
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('Failed to analyze input:', error);
            return {
                isAnswer: false,
                isCorrect: false,
                response: "Irrelevant",
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
            <h2>🎉 Congratulations! You solved the riddle! 🎉</h2>
            <p>Complete Story:</p>
            <div class="answer">${this.currentPuzzle.answer}</div>
            <button class="terminal-button">Continue Exploring</button>
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

        try {
            const response = await fetch('http://localhost:3000/api/hint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    puzzle: this.currentPuzzle,
                    progress: this.currentProgress
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            this.addMessage('System', data.hint, 'ai');
            this.hintCount--;
            this.updateHintCount();

        } catch (error) {
            console.error('Failed to get hint:', error);
            this.addMessage('System', 'Sorry, unable to get hint. Please try again later.', 'ai');
        }
    }

    async showStartMenu() {
        let currentScreen;
        
        // 确定当前显示的是哪个屏幕
        if (!this.rulesScreen.classList.contains('hidden')) {
            currentScreen = this.rulesScreen;
        } else if (!this.socialScreen.classList.contains('hidden')) {
            currentScreen = this.socialScreen;
        } else if (!this.gameContent.classList.contains('hidden')) {
            currentScreen = this.gameContent;
        }

        if (currentScreen) {
            await this.switchScreen(currentScreen, this.startMenu);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new TerminalGame();
}); 