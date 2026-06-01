// AI 决策系统

// 基于规则的AI
class RuleBasedAI {
    constructor(playerId) {
        this.playerId = playerId;
        this.name = '规则AI';
    }
    
    // 决定要出的牌
    decidePlay(hand, topCard, currentColor, gameState) {
        const playableCards = hand.filter(card => 
            UNO.canPlay(card, topCard, currentColor)
        );
        
        if (playableCards.length === 0) {
            return { action: 'draw', card: null };
        }
        
        // 规则1: 优先出功能牌和万能牌
        const actionCards = playableCards.filter(c => c.type !== 'number');
        if (actionCards.length > 0) {
            // 如果有万能牌，优先考虑
            const wildCards = actionCards.filter(c => c.type === 'wild');
            if (wildCards.length > 0) {
                // 选择万能牌，并决定最佳颜色
                const selectedCard = wildCards[0];
                const bestColor = this.chooseBestColor(gameState);
                return { 
                    action: 'play', 
                    card: selectedCard,
                    selectedColor: bestColor
                };
            }
            return { action: 'play', card: actionCards[0] };
        }
        
        // 规则2: 出数字最大的牌
        const sortedCards = playableCards.sort((a, b) => {
            return parseInt(b.value) - parseInt(a.value);
        });
        
        return { action: 'play', card: sortedCards[0] };
    }
    
    // 选择最佳颜色（基于当前手牌）
    chooseBestColor(gameState) {
        const colorCounts = {
            'red': 0,
            'blue': 0,
            'green': 0,
            'yellow': 0
        };
        
        // 统计其他玩家的手牌颜色（这里简化处理）
        // 实际应该基于游戏状态分析
        
        // 返回拥有最多牌的颜色
        return 'red'; // 简化返回
    }
    
    // 决定是否喊UNO
    shouldCallUno(hand) {
        return hand.length === 1;
    }
}

// 深度学习AI（模拟神经网络决策）
class DeepLearningAI {
    constructor(playerId) {
        this.playerId = playerId;
        this.name = '深度学习AI';
        
        // 模拟神经网络参数
        this.network = {
            inputSize: 128,  // 输入层大小
            hiddenLayers: [256, 512, 256],  // 隐藏层
            outputSize: 54,  // 输出层大小（最大可能出牌数）
            activation: 'ReLU',
            learningRate: 0.001
        };
    }
    
    // 将游戏状态编码为输入向量
    encodeGameState(hand, topCard, currentColor, gameState) {
        let inputVector = [];
        
        // 1. 手牌编码 (每种颜色和数字组合)
        for (let color of UNO.COLORS) {
            for (let num of UNO.NUMBERS) {
                const count = hand.filter(c => c.color === color && c.value === num.toString()).length;
                inputVector.push(count / 5); // 归一化
            }
            
            // 功能牌编码
            for (let action of UNO.ACTION_CARDS) {
                const count = hand.filter(c => c.color === color && c.value === action).length;
                inputVector.push(count / 2);
            }
        }
        
        // 万能牌编码
        for (let wild of UNO.WILD_CARDS) {
            const count = hand.filter(c => c.value === wild).length;
            inputVector.push(count / 4);
        }
        
        // 2. 当前牌编码
        inputVector.push(UNO.COLORS.indexOf(topCard.color) / 4);
        inputVector.push(parseInt(topCard.value) / 9 || 0.5);
        
        // 3. 当前颜色编码
        inputVector.push(UNO.COLORS.indexOf(currentColor) / 4);
        
        // 4. 游戏状态编码
        inputVector.push(gameState.direction === 'clockwise' ? 1 : 0);
        inputVector.push(gameState.currentPlayer / 5);
        inputVector.push(gameState.drawPileSize / 108);
        
        // 填充到固定大小
        while (inputVector.length < this.network.inputSize) {
            inputVector.push(0);
        }
        
        return inputVector;
    }
    
    // 神经网络前向传播（模拟）
    forwardPass(inputVector) {
        // 这里简化处理，实际应该是矩阵运算
        // 我们模拟神经网络的输出
        
        // 生成随机但有一定逻辑的输出
        let output = [];
        for (let i = 0; i < this.network.outputSize; i++) {
            // 基础概率
            let probability = Math.random() * 0.5;
            
            // 根据输入调整概率（这里简化模拟）
            if (i < 40 && inputVector[i] > 0.1) {
                probability += 0.3; // 手牌中有的牌概率更高
            }
            
            output.push(probability);
        }
        
        // Softmax归一化
        const sum = output.reduce((a, b) => a + b, 0);
        output = output.map(v => v / sum);
        
        return output;
    }
    
    // 决定要出的牌
    decidePlay(hand, topCard, currentColor, gameState) {
        // 编码状态
        const inputVector = this.encodeGameState(hand, topCard, currentColor, gameState);
        
        // 神经网络推理
        const outputProbabilities = this.forwardPass(inputVector);
        
        // 找到可出的牌
        const playableCards = hand.filter(card => 
            UNO.canPlay(card, topCard, currentColor)
        );
        
        if (playableCards.length === 0) {
            // 分析摸牌概率
            const drawProbability = this.analyzeDrawProbability(gameState);
            return { 
                action: 'draw', 
                card: null,
                confidence: drawProbability,
                probabilities: this.generateProbabilityDisplay(outputProbabilities)
            };
        }
        
        // 根据神经网络输出选择牌
        let bestCard = null;
        let bestScore = -1;
        let bestColor = null;
        
        playableCards.forEach((card, index) => {
            const cardScore = outputProbabilities[index] || 0.5;
            
            // 如果是万能牌，还需要决定颜色
            if (card.type === 'wild') {
                const colorScores = this.analyzeColorProbabilities(gameState);
                const selectedColor = this.chooseColorByProbability(colorScores);
                card.selectedColor = selectedColor;
            }
            
            if (cardScore > bestScore) {
                bestScore = cardScore;
                bestCard = card;
            }
        });
        
        return {
            action: 'play',
            card: bestCard,
            confidence: bestScore,
            probabilities: this.generateProbabilityDisplay(outputProbabilities, playableCards)
        };
    }
    
    // 分析摸牌概率
    analyzeDrawProbability(gameState) {
        // 基于游戏状态计算摸到可出牌的概率
        const remainingCards = gameState.drawPileSize;
        const playableCount = this.estimatePlayableCards(gameState);
        
        return Math.min(playableCount / remainingCards, 0.8);
    }
    
    // 估计可出牌的数量
    estimatePlayableCards(gameState) {
        // 简化估算
        return 20;
    }
    
    // 分析颜色概率
    analyzeColorProbabilities(gameState) {
        return {
            'red': Math.random() * 0.5 + 0.3,
            'blue': Math.random() * 0.5 + 0.3,
            'green': Math.random() * 0.5 + 0.3,
            'yellow': Math.random() * 0.5 + 0.3
        };
    }
    
    // 根据概率选择颜色
    chooseColorByProbability(colorScores) {
        let total = Object.values(colorScores).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (let [color, score] of Object.entries(colorScores)) {
            if (random < score) return color;
            random -= score;
        }
        
        return 'red';
    }
    
    // 生成概率显示数据
    generateProbabilityDisplay(probabilities, playableCards = []) {
        const display = [];
        
        if (playableCards.length > 0) {
            // 显示前5个最高概率的可出牌
            const cardProbabilities = playableCards.map((card, i) => ({
                card: card,
                probability: probabilities[i] || 0.5
            }));
            
            cardProbabilities.sort((a, b) => b.probability - a.probability);
            
            cardProbabilities.slice(0, 5).forEach(item => {
                display.push({
                    label: `${UNO.getColorName(item.card.color)} ${item.card.value}`,
                    probability: item.probability
                });
            });
        }
        
        return display;
    }
}

// AI工厂函数
function createAI(type, playerId) {
    switch(type) {
        case 'rule-based':
            return new RuleBasedAI(playerId);
        case 'deep-learning':
            return new DeepLearningAI(playerId);
        default:
            return new DeepLearningAI(playerId);
    }
}

// 导出AI模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RuleBasedAI, DeepLearningAI, createAI };
}