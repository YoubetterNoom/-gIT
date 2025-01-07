const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 添加静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// 添加环境变量验证
if (!process.env.OPENAI_API_KEY) {
    console.error('错误: 未设置 OPENAI_API_KEY 环境变量');
    process.exit(1);
}

// 添加错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 分析用户输入
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, type } = req.body;
        
        let systemPrompt = '';
        let userPrompt = '';

        if (type === 'analyze') {
            systemPrompt = `你是海龟汤游戏的评判系统。
            分析规则：
            1. 仔细对比用户输入与故事答案的每个要素
            2. 考虑直接关联和间接关联
            3. 优先回答"是"或"否"
            4. 只在完全无法判断时才回答"无关"
            5. 注意故事的逻辑性和完整性`;

            userPrompt = `
            当前谜题：${prompt.question}
            完整故事：${prompt.answer}
            玩家输入：${prompt.input}

            评估规则：[这里是完整的评估规则...]`;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取提示
app.post('/api/hint', async (req, res) => {
    try {
        const { puzzle, progress } = req.body;

        const prompt = `
        基于当前进度(${progress}%)，生成一个引导性问题。

        谜题：${puzzle.question}

        提示规则：[这里是完整的提示规则...]`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "你是海龟汤游戏的提示系统..."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        const hint = data.choices[0].message.content.trim();
        res.json({ hint });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
}); 