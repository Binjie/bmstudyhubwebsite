// 游戏主逻辑
class UNOGame {
    constructor() {
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.currentPlayer = 0;
        this.direction = 1; // 1: 顺时针, -1: 逆时针
        this.currentColor = null;
        this.gameState = 'playing'; // 改为直接开始游戏
        this.aiMode = 'deep-learning'; // 默认使用深度学习AI
        this.drawPileSize = 0;
        this.waitingForColorSelection = false; // 新增：等待颜色选择状态
        
        // 先设置事件监听
        this.setupEventListeners();
        // 再初始化游戏
        this.initGame();
    }
    
    // 初始化游戏
    initGame() {
        // 创建6个玩家 (0是人类，1-5是AI)
        this.players = [];
        for (let i = 0; i < 6; i++) {
            this.players.push({
                id: i,
                isHuman: i === 0,
                hand: [],
                ai: i === 0 ? null : createAI(this.aiMode, i),
                unoCalled: false
            });
        }
        
        // 创建并洗牌
        this.deck = UNO.createDeck();
        this.drawPileSize = this.deck.length;
        
        // 每个玩家发7张牌
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                if (this.deck.length > 0) {
                    this.players[i].hand.push(this.deck.pop());
                }
            }
        }
        
        // 翻开第一张牌作为起始牌
        let firstCard;
        do {
            if (this.deck.length === 0) break;
            firstCard = this.deck.pop();
        } while (firstCard && firstCard.type === 'wild');
        
        if (firstCard) {
            this.discardPile.push(firstCard);
            this.currentColor = firstCard.color;
        }
        
        // 重置游戏状态
        this.gameState = 'playing';
        this.currentPlayer = 0;
        this.direction = 1;
        this.waitingForColorSelection = false;
        
        // 更新界面
        this.updateUI();
        this.updateGameStatus();
        
        // 移除所有模态框的active类
        document.getElementById('colorSelectModal').classList.remove('active');
        document.getElementById('guideModal').classList.remove('active');
        
        // 清空AI决策显示
        this.clearAIDecision();
        
        // 如果第一个玩家是AI，让AI出牌
        if (this.players[0] && !this.players[0].isHuman) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }
    
    // 清空AI决策显示
    clearAIDecision() {
        const box = document.getElementById('aiDecisionBox');
        if (box) {
            const typeSpan = document.getElementById('aiType');
            const confidenceSpan = document.getElementById('aiConfidence');
            const reasonDiv = document.getElementById('aiReason');
            const probabilitiesDiv = document.getElementById('aiProbabilities');
            
            if (typeSpan) typeSpan.textContent = '等待AI决策';
            if (confidenceSpan) confidenceSpan.textContent = '--';
            if (reasonDiv) reasonDiv.textContent = '等待AI思考...';
            if (probabilitiesDiv) probabilitiesDiv.innerHTML = '';
        }
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 新游戏按钮
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initGame();
            });
        }
        
        // 摸牌按钮
        const drawCardBtn = document.getElementById('drawCardBtn');
        if (drawCardBtn) {
            drawCardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing' && 
                    this.players[this.currentPlayer] && 
                    this.players[this.currentPlayer].isHuman &&
                    !this.waitingForColorSelection) {
                    this.drawCard();
                }
            });
        }
        
        // UNO按钮
        const unoBtn = document.getElementById('unoBtn');
        if (unoBtn) {
            unoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing' && 
                    this.players[this.currentPlayer] && 
                    this.players[this.currentPlayer].isHuman) {
                    this.callUno();
                }
            });
        }
        
        // AI模式选择
        const aiModeSelect = document.getElementById('aiModeSelect');
        if (aiModeSelect) {
            aiModeSelect.addEventListener('change', (e) => {
                this.aiMode = e.target.value;
                // 重新创建AI
                for (let i = 1; i < 6; i++) {
                    if (this.players[i]) {
                        this.players[i].ai = createAI(this.aiMode, i);
                    }
                }
                this.showNotification(`已切换至 ${this.aiMode === 'rule-based' ? '规则AI' : '深度学习AI'} 模式`);
            });
        }
        
        // 显示指南按钮
        const showGuideBtn = document.getElementById('showGuideBtn');
        if (showGuideBtn) {
            showGuideBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showGuide();
            });
        }
        
        // 关闭指南按钮
        const closeGuideBtn = document.getElementById('closeGuideBtn');
        if (closeGuideBtn) {
            closeGuideBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('guideModal').classList.remove('active');
            });
        }
        
        // 颜色选择按钮
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const color = e.target.dataset.color;
                this.handleColorSelection(color);
            });
        });
        
        // 点击牌堆摸牌
        const drawPile = document.getElementById('drawPile');
        if (drawPile) {
            drawPile.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameState === 'playing' && 
                    this.players[this.currentPlayer] && 
                    this.players[this.currentPlayer].isHuman &&
                    !this.waitingForColorSelection) {
                    this.drawCard();
                }
            });
        }
        
        // 点击模态框背景关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('guideModal');
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // 处理玩家出牌
    playCard(card, playerIndex) {
        if (this.waitingForColorSelection) {
            this.showNotification('请先选择颜色');
            return false;
        }
        
        const player = this.players[playerIndex];
        if (!player) return false;
        
        const topCard = this.discardPile[this.discardPile.length - 1];
        
        // 检查是否可以出牌
        if (!UNO.canPlay(card, topCard, this.currentColor)) {
            this.showNotification('不能出这张牌！');
            return false;
        }
        
        // 从手牌中移除
        const cardIndex = player.hand.findIndex(c => c.id === card.id);
        if (cardIndex === -1) return false;
        
        player.hand.splice(cardIndex, 1);
        
        // 放到弃牌堆
        this.discardPile.push(card);
        
        // 播放动画
        this.playCardAnimation(card);
        
        // 处理功能牌效果
        const needsColorSelection = this.handleActionCard(card, player);
        
        // 检查是否赢了
        if (player.hand.length === 0) {
            this.gameWon(playerIndex);
            return true;
        }
        
        // 如果不需要选择颜色，才进入下一个玩家
        if (!needsColorSelection) {
            this.nextPlayer();
        }
        
        // 更新界面
        this.updateUI();
        this.updateGameStatus();
        
        // 如果是AI回合且不需要等待颜色选择，自动出牌
        if (this.gameState === 'playing' && 
            !this.waitingForColorSelection && 
            this.players[this.currentPlayer] && 
            !this.players[this.currentPlayer].isHuman) {
            setTimeout(() => this.aiTurn(), 1000);
        }
        
        return true;
    }
    
    // 播放卡牌动画
    playCardAnimation(card) {
        const cardElement = document.querySelector(`[data-id="${card.id}"]`);
        if (cardElement) {
            cardElement.classList.add('card-played');
            setTimeout(() => {
                cardElement.classList.remove('card-played');
            }, 300);
        }
    }
    
    // 处理功能牌
    handleActionCard(card, player) {
        switch(card.value) {
            case 'skip':
                this.nextPlayer(); // 跳过下一个玩家
                this.showNotification('跳过下一个玩家！');
                return false;
                
            case 'reverse':
                this.direction *= -1;
                this.showNotification('方向反转！');
                return false;
                
            case 'draw2':
                const nextPlayerIndex = this.getNextPlayerIndex();
                if (nextPlayerIndex !== -1) {
                    for (let i = 0; i < 2; i++) {
                        if (this.deck.length > 0) {
                            this.players[nextPlayerIndex].hand.push(this.deck.pop());
                        } else {
                            this.reshuffleDiscardPile();
                        }
                    }
                    this.showNotification(`玩家${nextPlayerIndex + 1}摸2张牌！`);
                }
                return false;
                
            case 'wild':
                this.waitingForColorSelection = true;
                this.showColorSelection();
                return true;
                
            case 'wild_draw4':
                const nextIdx = this.getNextPlayerIndex();
                if (nextIdx !== -1) {
                    for (let i = 0; i < 4; i++) {
                        if (this.deck.length > 0) {
                            this.players[nextIdx].hand.push(this.deck.pop());
                        } else {
                            this.reshuffleDiscardPile();
                        }
                    }
                    this.showNotification(`玩家${nextIdx + 1}摸4张牌！`);
                }
                this.waitingForColorSelection = true;
                this.showColorSelection();
                return true;
                
            default:
                // 数字牌，更新颜色
                this.currentColor = card.color;
                return false;
        }
    }
    
    // 摸牌
    drawCard() {
        const player = this.players[this.currentPlayer];
        if (!player) return;
        
        if (this.deck.length === 0) {
            this.reshuffleDiscardPile();
        }
        
        if (this.deck.length > 0) {
            const drawnCard = this.deck.pop();
            player.hand.push(drawnCard);
            
            // 播放摸牌动画
            this.playDrawAnimation();
            
            // 检查摸到的牌是否能立即出
            const topCard = this.discardPile[this.discardPile.length - 1];
            if (UNO.canPlay(drawnCard, topCard, this.currentColor)) {
                this.showNotification('摸到可出的牌，点击出牌');
            } else {
                // 不能出，轮到下家
                this.nextPlayer();
            }
            
            this.updateUI();
            
            // 如果是AI回合，自动出牌
            if (this.gameState === 'playing' && 
                this.players[this.currentPlayer] && 
                !this.players[this.currentPlayer].isHuman) {
                setTimeout(() => this.aiTurn(), 1000);
            }
        }
    }
    
    // 播放摸牌动画
    playDrawAnimation() {
        const drawPile = document.getElementById('drawPile');
        const card = drawPile.querySelector('.card');
        if (card) {
            card.classList.add('card-drawn');
            setTimeout(() => {
                card.classList.remove('card-drawn');
            }, 300);
        }
    }
    
    // AI回合
    aiTurn() {
        if (this.gameState !== 'playing' || this.waitingForColorSelection) return;
        
        const player = this.players[this.currentPlayer];
        if (!player || player.isHuman) return;
        
        const topCard = this.discardPile[this.discardPile.length - 1];
        
        // 获取游戏状态
        const gameState = {
            direction: this.direction === 1 ? 'clockwise' : 'counterclockwise',
            currentPlayer: this.currentPlayer,
            drawPileSize: this.deck.length,
            players: this.players.map(p => ({ handSize: p ? p.hand.length : 0 }))
        };
        
        // AI决策
        const decision = player.ai.decidePlay(
            player.hand,
            topCard,
            this.currentColor,
            gameState
        );
        
        // 显示AI决策分析
        this.showAIDecision(decision, player.ai);
        
        if (decision.action === 'play' && decision.card) {
            this.playCard(decision.card, this.currentPlayer);
            
            // 如果是万能牌，AI自动选择颜色
            if (decision.card.type === 'wild' && decision.selectedColor) {
                setTimeout(() => {
                    this.handleColorSelection(decision.selectedColor);
                }, 500);
            }
        } else {
            this.drawCard();
        }
        
        // 检查是否喊UNO
        if (player.hand.length === 1 && player.ai && player.ai.shouldCallUno) {
            setTimeout(() => this.callUno(), 500);
        }
    }
    
    // 显示AI决策
    showAIDecision(decision, ai) {
        const typeSpan = document.getElementById('aiType');
        const confidenceSpan = document.getElementById('aiConfidence');
        const reasonDiv = document.getElementById('aiReason');
        const probabilitiesDiv = document.getElementById('aiProbabilities');
        
        if (!typeSpan || !confidenceSpan || !reasonDiv || !probabilitiesDiv) return;
        
        typeSpan.textContent = ai ? ai.name : 'AI';
        
        if (decision && decision.action === 'play' && decision.card) {
            confidenceSpan.textContent = decision.confidence ? 
                `${Math.round(decision.confidence * 100)}%` : '85%';
            const colorName = UNO.getColorName(decision.card.color);
            reasonDiv.textContent = `选择出 ${colorName} ${decision.card.value}`;
        } else {
            confidenceSpan.textContent = '65%';
            reasonDiv.textContent = '选择摸牌 (没有可出的牌)';
        }
        
        // 显示概率分布
        if (decision && decision.probabilities) {
            probabilitiesDiv.innerHTML = '';
            decision.probabilities.forEach(item => {
                const probItem = document.createElement('div');
                probItem.className = 'probability-item';
                probItem.innerHTML = `
                    <span>${item.label || '未知'}</span>
                    <div class="probability-bar">
                        <div class="probability-fill" style="width: ${(item.probability || 0.5) * 100}%"></div>
                    </div>
                    <span>${Math.round((item.probability || 0.5) * 100)}%</span>
                `;
                probabilitiesDiv.appendChild(probItem);
            });
        }
    }
    
    // 下一个玩家
    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + this.direction + 6) % 6;
        // 确保currentPlayer在有效范围内
        if (this.currentPlayer < 0) this.currentPlayer = 5;
        if (this.currentPlayer > 5) this.currentPlayer = 0;
    }
    
    // 获取下一个玩家索引
    getNextPlayerIndex() {
        const next = (this.currentPlayer + this.direction + 6) % 6;
        return next < 0 ? 5 : (next > 5 ? 0 : next);
    }
    
    // 重新洗牌（从弃牌堆）
    reshuffleDiscardPile() {
        if (this.discardPile.length <= 1) return;
        
        const topCard = this.discardPile.pop();
        this.deck = UNO.shuffleDeck([...this.discardPile]);
        this.discardPile = [topCard];
        this.drawPileSize = this.deck.length;
    }
    
    // 游戏胜利
    gameWon(playerIndex) {
        this.gameState = 'ended';
        const playerNum = playerIndex + 1;
        const playerName = playerIndex === 0 ? '你' : `AI玩家${playerNum}`;
        this.showNotification(`${playerName} 获胜！`);
        document.getElementById('gameStatus').textContent = `${playerName} 获胜！ 🎉`;
    }
    
    // 喊UNO
    callUno() {
        const player = this.players[this.currentPlayer];
        if (!player) return;
        
        if (player.hand.length === 1) {
            player.unoCalled = true;
            this.showNotification('UNO!');
        } else {
            this.showNotification('手牌数不是1，不能喊UNO');
        }
    }
    
    // 显示颜色选择
    showColorSelection() {
        const modal = document.getElementById('colorSelectModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    // 处理颜色选择
    handleColorSelection(color) {
        this.currentColor = color;
        this.waitingForColorSelection = false;
        
        const modal = document.getElementById('colorSelectModal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        this.showNotification(`颜色变为 ${UNO.getColorName(color)}`);
        this.updateUI();
        
        // 进入下一个玩家
        this.nextPlayer();
        this.updateGameStatus();
        
        // 如果是AI回合，自动出牌
        if (this.gameState === 'playing' && 
            this.players[this.currentPlayer] && 
            !this.players[this.currentPlayer].isHuman) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }
    
    // 显示指南
    showGuide() {
        const guideContent = document.getElementById('guideContent');
        if (guideContent) {
            guideContent.innerHTML = DeepLearningGuide.getGuideHTML();
        }
        const modal = document.getElementById('guideModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    // 显示通知
    showNotification(message) {
        const status = document.getElementById('gameStatus');
        if (status) {
            status.textContent = message;
            setTimeout(() => this.updateGameStatus(), 2000);
        }
    }
    
    // 更新游戏状态显示
    updateGameStatus() {
        const status = document.getElementById('gameStatus');
        if (!status) return;
        
        if (this.gameState === 'ended') return;
        
        const player = this.players[this.currentPlayer];
        if (!player) return;
        
        const playerName = player.isHuman ? '你' : `AI玩家${this.currentPlayer + 1}`;
        status.textContent = `轮到 ${playerName}`;
    }
    
    // 更新UI
    updateUI() {
        // 更新每个玩家的手牌显示
        for (let i = 0; i < 6; i++) {
            this.updatePlayerHand(i);
        }
        
        // 更新当前牌显示
        this.updateDiscardPile();
        
        // 更新牌堆数量
        const drawPileCount = document.getElementById('drawPileCount');
        if (drawPileCount) {
            drawPileCount.textContent = this.deck.length;
        }
        
        const remainingCards = document.getElementById('remainingCards');
        if (remainingCards) {
            remainingCards.textContent = this.deck.length;
        }
        
        // 更新游戏信息
        const currentColorEl = document.getElementById('currentColor');
        if (currentColorEl) {
            currentColorEl.textContent = UNO.getColorName(this.currentColor);
        }
        
        const topCard = this.discardPile[this.discardPile.length - 1];
        const currentValueEl = document.getElementById('currentValue');
        if (currentValueEl && topCard) {
            currentValueEl.textContent = topCard.value;
        }
        
        const gameDirectionEl = document.getElementById('gameDirection');
        if (gameDirectionEl) {
            gameDirectionEl.textContent = this.direction === 1 ? '顺时针' : '逆时针';
        }
        
        // 更新玩家手牌数
        for (let i = 0; i < 6; i++) {
            const countEl = document.getElementById(`player${i + 1}-count`);
            if (countEl && this.players[i]) {
                countEl.textContent = this.players[i].hand.length;
            }
        }
        
        // 高亮可出的牌（仅对当前玩家）
        if (this.gameState === 'playing' && 
            this.players[this.currentPlayer] && 
            this.players[this.currentPlayer].isHuman) {
            this.highlightPlayableCards();
        }
    }
    
    // 更新玩家手牌显示
    updatePlayerHand(playerIndex) {
        const player = this.players[playerIndex];
        if (!player) return;
        
        const handElement = document.getElementById(`player${playerIndex + 1}-hand`);
        const countElement = document.getElementById(`player${playerIndex + 1}-count`);
        
        if (!handElement) return;
        
        handElement.innerHTML = '';
        if (countElement) {
            countElement.textContent = player.hand.length;
        }
        
        if (player.isHuman) {
            // 显示具体牌
            player.hand.forEach(card => {
                const cardElement = this.createCardElement(card);
                cardElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.gameState === 'playing' && 
                        this.currentPlayer === 0 &&
                        !this.waitingForColorSelection) {
                        this.playCard(card, 0);
                    }
                });
                handElement.appendChild(cardElement);
            });
        } else {
            // 显示牌背
            for (let i = 0; i < player.hand.length; i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card card-back';
                handElement.appendChild(cardBack);
            }
        }
    }
    
    // 创建卡牌元素
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.color}`;
        cardDiv.dataset.id = card.id;
        
        const topCorner = document.createElement('div');
        topCorner.className = 'card-corner top';
        topCorner.textContent = UNO.getCardDisplay(card);
        
        const center = document.createElement('div');
        center.className = 'card-center';
        center.textContent = UNO.getCardDisplay(card);
        
        const bottomCorner = document.createElement('div');
        bottomCorner.className = 'card-corner bottom';
        bottomCorner.textContent = UNO.getCardDisplay(card);
        
        cardDiv.appendChild(topCorner);
        cardDiv.appendChild(center);
        cardDiv.appendChild(bottomCorner);
        
        return cardDiv;
    }
    
    // 更新弃牌堆
    updateDiscardPile() {
        const discardElement = document.getElementById('discardPile');
        if (!discardElement) return;
        
        discardElement.innerHTML = '';
        
        if (this.discardPile.length > 0) {
            const topCard = this.discardPile[this.discardPile.length - 1];
            discardElement.appendChild(this.createCardElement(topCard));
        }
    }
    
    // 高亮可出的牌
    highlightPlayableCards() {
        const player = this.players[0];
        if (!player) return;
        
        const topCard = this.discardPile[this.discardPile.length - 1];
        
        // 移除所有高亮
        document.querySelectorAll('.card.playable').forEach(card => {
            card.classList.remove('playable');
        });
        
        // 添加新的高亮
        player.hand.forEach(card => {
            if (UNO.canPlay(card, topCard, this.currentColor)) {
                const cardElement = document.querySelector(`[data-id="${card.id}"]`);
                if (cardElement) {
                    cardElement.classList.add('playable');
                }
            }
        });
    }
}

// 确保DOM加载完成后再启动游戏
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new UNOGame();
        console.log('UNO游戏初始化成功');
    } catch (error) {
        console.error('游戏初始化失败:', error);
    }
});