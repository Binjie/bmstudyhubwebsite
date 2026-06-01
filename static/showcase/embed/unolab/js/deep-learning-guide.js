// 深度学习指南内容
const DeepLearningGuide = {
    title: 'UNO 深度学习模型架构详解',
    
    sections: [
        {
            title: '1. 问题定义',
            content: `
                <p>在UNO游戏中，AI需要基于当前游戏状态（手牌、桌面牌、其他玩家状态等）做出最优决策。这是一个典型的强化学习问题，我们可以将其建模为马尔可夫决策过程(MDP)。</p>
                <h4>状态空间：</h4>
                <ul>
                    <li>当前玩家手牌（最多25张）</li>
                    <li>当前桌面牌（颜色和数字/功能）</li>
                    <li>其他玩家手牌数量</li>
                    <li>游戏方向</li>
                    <li>剩余牌堆数量</li>
                    <li>历史出牌序列</li>
                </ul>
                
                <h4>动作空间：</h4>
                <ul>
                    <li>出牌（最多54种可能）</li>
                    <li>摸牌</li>
                    <li>喊UNO</li>
                    <li>选择颜色（出万能牌时）</li>
                </ul>
            `
        },
        {
            title: '2. 神经网络架构',
            content: `
                <p>我们采用深度Q网络(DQN)架构，结合卷积神经网络和全连接层来处理游戏状态。</p>
                
                <div class="model-diagram">
输入层 (128) 
    ↓
卷积层1 (32 filters, 3x3) + ReLU
    ↓
卷积层2 (64 filters, 3x3) + ReLU
    ↓
池化层 (2x2)
    ↓
全连接层1 (256) + ReLU + Dropout(0.2)
    ↓
全连接层2 (512) + ReLU + Dropout(0.3)
    ↓
全连接层3 (256) + ReLU
    ↓
输出层 (54) + Softmax
                </div>
                
                <h4>详细参数：</h4>
                <ul>
                    <li><strong>输入层:</strong> 128个神经元，编码游戏状态</li>
                    <li><strong>隐藏层1:</strong> 256个神经元，ReLU激活函数</li>
                    <li><strong>隐藏层2:</strong> 512个神经元，ReLU激活函数</li>
                    <li><strong>隐藏层3:</strong> 256个神经元，ReLU激活函数</li>
                    <li><strong>输出层:</strong> 54个神经元，对应所有可能的出牌动作</li>
                    <li><strong>损失函数:</strong> 均方误差(MSE) + L2正则化</li>
                    <li><strong>优化器:</strong> Adam (学习率=0.001)</li>
                </ul>
            `
        },
        {
            title: '3. 输入特征编码',
            content: `
                <h4>特征向量组成（128维）：</h4>
                <ul>
                    <li><strong>手牌编码 (80维):</strong> 每种颜色(4) × 数字(10) + 功能牌(3) = 52维，每种牌的数量归一化</li>
                    <li><strong>万能牌编码 (8维):</strong> 普通万能牌和+4万能牌的数量</li>
                    <li><strong>当前牌编码 (8维):</strong> 颜色(4维one-hot) + 数值(4维归一化)</li>
                    <li><strong>游戏状态 (12维):</strong> 方向、当前玩家、剩余牌数、每个玩家手牌数等</li>
                    <li><strong>历史序列 (20维):</strong> 最近10步的出牌记录编码</li>
                </ul>
                
                <p>所有特征都进行归一化处理，使其范围在[0,1]之间，以加速模型收敛。</p>
            `
        },
        {
            title: '4. 训练策略',
            content: `
                <h4>4.1 经验回放</h4>
                <p>使用经验回放缓冲区存储过去的游戏经历，容量为100万条经验。每次训练随机采样batch size=64的经验，打破时间相关性。</p>
                
                <h4>4.2 目标网络</h4>
                <p>使用两个Q网络：评估网络和目标网络。每1000步更新一次目标网络，提高训练稳定性。</p>
                
                <h4>4.3 ε-贪婪策略</h4>
                <p>初始ε=1.0，逐渐衰减到0.01，平衡探索和利用：</p>
                <ul>
                    <li>ε = max(0.01, 1.0 - 0.9 × (episode / 10000))</li>
                </ul>
                
                <h4>4.4 奖励函数设计</h4>
                <ul>
                    <li><strong>出合法牌:</strong> +1</li>
                    <li><strong>出功能牌:</strong> +2</li>
                    <li><strong>出万能牌:</strong> +3</li>
                    <li><strong>赢得一局:</strong> +10</li>
                    <li><strong>被罚摸牌:</strong> -2</li>
                    <li><strong>忘记喊UNO:</strong> -5</li>
                </ul>
            `
        },
        {
            title: '5. 训练过程',
            content: `
                <h4>阶段1: 预训练（10万局）</h4>
                <p>使用规则AI生成的数据进行监督学习预训练，让模型学习基本的游戏规则。</p>
                
                <h4>阶段2: 强化学习（100万局）</h4>
                <p>使用DQN算法进行自我对弈强化学习，每1000局评估一次性能。</p>
                
                <h4>阶段3: 微调（10万局）</h4>
                <p>降低学习率到0.0001，进行精细调整，优化特定策略。</p>
                
                <h4>超参数设置：</h4>
                <ul>
                    <li><strong>折扣因子γ:</strong> 0.99</li>
                    <li><strong>学习率α:</strong> 0.001 → 0.0001</li>
                    <li><strong>批次大小:</strong> 64</li>
                    <li><strong>目标网络更新频率:</strong> 1000步</li>
                    <li><strong>经验回放大小:</strong> 1,000,000</li>
                    <li><strong>L2正则化系数:</strong> 0.0001</li>
                </ul>
            `
        },
        {
            title: '6. 模型评估指标',
            content: `
                <h4>离线评估：</h4>
                <ul>
                    <li><strong>胜率:</strong> 与规则AI对战的胜率</li>
                    <li><strong>平均回合数:</strong> 完成一局的平均步数</li>
                    <li><strong>决策速度:</strong> 每步决策时间（毫秒）</li>
                </ul>
                
                <h4>在线监控：</h4>
                <ul>
                    <li><strong>Q值收敛情况:</strong> 监控Q值的稳定性</li>
                    <li><strong>损失函数值:</strong> 训练损失的变化趋势</li>
                    <li><strong>探索率:</strong> ε值的变化</li>
                </ul>
                
                <h4>预期性能：</h4>
                <ul>
                    <li>经过100万局训练后，对规则AI胜率 > 70%</li>
                    <li>决策时间 < 100ms</li>
                    <li>平均回合数: 15-20步</li>
                </ul>
            `
        },
        {
            title: '7. 代码示例',
            content: `
                <pre><code>
// 定义DQN模型
class DQN {
    constructor() {
        this.model = tf.sequential();
        
        // 卷积层处理空间特征
        this.model.add(tf.layers.conv2d({
            inputShape: [8, 16, 1],
            filters: 32,
            kernelSize: 3,
            activation: 'relu'
        }));
        
        this.model.add(tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu'
        }));
        
        this.model.add(tf.layers.flatten());
        
        // 全连接层
        this.model.add(tf.layers.dense({
            units: 256,
            activation: 'relu'
        }));
        
        this.model.add(tf.layers.dropout({rate: 0.2}));
        
        this.model.add(tf.layers.dense({
            units: 512,
            activation: 'relu'
        }));
        
        this.model.add(tf.layers.dropout({rate: 0.3}));
        
        this.model.add(tf.layers.dense({
            units: 54,
            activation: 'softmax'
        }));
        
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError'
        });
    }
    
    // 前向传播
    predict(state) {
        return this.model.predict(state);
    }
    
    // 训练步骤
    trainStep(states, actions, rewards, nextStates, dones) {
        const qValues = this.model.predict(states);
        const nextQValues = this.targetModel.predict(nextStates);
        
        // 计算目标Q值
        const targets = qValues.clone();
        for (let i = 0; i < batchSize; i++) {
            if (dones[i]) {
                targets[i][actions[i]] = rewards[i];
            } else {
                targets[i][actions[i]] = rewards[i] + 
                    this.gamma * Math.max(...nextQValues[i]);
            }
        }
        
        // 训练模型
        return this.model.fit(states, targets, {
            epochs: 1,
            verbose: 0
        });
    }
}
                </code></pre>
            `
        }
    ],
    
    // 获取完整的指南HTML
    getGuideHTML: function() {
        let html = '';
        this.sections.forEach(section => {
            html += `
                <div class="guide-section">
                    <h3>${section.title}</h3>
                    ${section.content}
                </div>
            `;
        });
        return html;
    }
};

// 导出指南
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeepLearningGuide;
}