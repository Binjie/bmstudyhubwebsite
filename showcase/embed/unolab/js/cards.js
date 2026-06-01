// 卡牌定义和游戏规则
const UNO = {
    // 颜色定义
    COLORS: ['red', 'blue', 'green', 'yellow'],
    
    // 数字牌 (0-9)
    NUMBERS: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    
    // 功能牌
    ACTION_CARDS: ['skip', 'reverse', 'draw2'],
    
    // 万能牌
    WILD_CARDS: ['wild', 'wild_draw4'],
    
    // 创建一副牌 (5副牌)
    createDeck: function() {
        let deck = [];
        
        for (let deckNum = 0; deckNum < 5; deckNum++) {
            // 添加数字牌
            this.COLORS.forEach(color => {
                // 每个颜色一个0
                deck.push(this.createCard(color, '0', 'number'));
                
                // 每个颜色两个1-9
                for (let i = 1; i <= 9; i++) {
                    deck.push(this.createCard(color, i.toString(), 'number'));
                    deck.push(this.createCard(color, i.toString(), 'number'));
                }
                
                // 添加功能牌 (每个颜色每种2张)
                this.ACTION_CARDS.forEach(action => {
                    deck.push(this.createCard(color, action, 'action'));
                    deck.push(this.createCard(color, action, 'action'));
                });
            });
            
            // 添加万能牌 (每种4张)
            for (let i = 0; i < 4; i++) {
                deck.push(this.createCard('black', 'wild', 'wild'));
                deck.push(this.createCard('black', 'wild_draw4', 'wild'));
            }
        }
        
        return this.shuffleDeck(deck);
    },
    
    // 创建单张卡牌
    createCard: function(color, value, type) {
        return {
            id: Math.random().toString(36).substr(2, 9),
            color: color,
            value: value,
            type: type,
            playable: false
        };
    },
    
    // 洗牌
    shuffleDeck: function(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    },
    
    // 检查牌是否可以打出
    canPlay: function(card, topCard, currentColor) {
        // 万能牌总是可以打出
        if (card.type === 'wild') {
            return true;
        }
        
        // 检查颜色
        if (card.color === currentColor) {
            return true;
        }
        
        // 检查数字或功能是否匹配
        if (card.value === topCard.value) {
            return true;
        }
        
        return false;
    },
    
    // 获取牌显示文本
    getCardDisplay: function(card) {
        if (card.type === 'wild') {
            return card.value === 'wild' ? 'W' : 'W+4';
        }
        
        switch(card.value) {
            case 'skip': return '🚫';
            case 'reverse': return '🔄';
            case 'draw2': return '+2';
            default: return card.value;
        }
    },
    
    // 获取颜色名称的中文
    getColorName: function(color) {
        const colorMap = {
            'red': '红色',
            'blue': '蓝色',
            'green': '绿色',
            'yellow': '黄色',
            'black': '万能'
        };
        return colorMap[color] || color;
    },
    
    // 获取牌的价值（用于AI评分）
    getCardValue: function(card) {
        if (card.type === 'wild') {
            return card.value === 'wild' ? 50 : 60; // wild draw4 价值更高
        }
        
        if (card.type === 'action') {
            return 20; // 功能牌价值
        }
        
        return parseInt(card.value); // 数字牌就是数字本身
    }
};

// 导出UNO对象
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UNO;
}