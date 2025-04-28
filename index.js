const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require('openai');
const fs = require('fs');
require('dotenv').config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: "sk-proj-zO0j1aB3ooKIazaQiAItT3BlbkFJnEwhqVZhVZtCyl7cadmB",  // Use environment variable for the API key
});

const chatHistoryFile = 'chatHistory.txt';
const commandPrefix = '!ai';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return; // Ignore messages from bots

    if (!msg.content.startsWith(commandPrefix)) return; // Process only messages that start with the command prefix

    const commandBody = msg.content.slice(commandPrefix.length).trim();
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        msg.reply('Available commands:\n' +
            `${commandPrefix} [message] - Ask a question to the AI\n` +
            `${commandPrefix} clear - Clear the chat history\n` +
            `${commandPrefix} prompt [custom prompt] - Set a custom prompt for the AI`);
        return;
    }

    if (command === 'clear') {
        fs.writeFileSync(chatHistoryFile, '', 'utf8');
        msg.reply('Chat history cleared.');
        return;
    }

    if (command === 'prompt') {
        const customPrompt = args.join(' ');
        fs.writeFileSync('customPrompt.txt', customPrompt, 'utf8');
        msg.reply('Custom prompt set.');
        return;
    }

    const cleanedContent = commandBody; // Remaining text after command

    // Read previous conversation history
    let previousConversation = '';
    if (fs.existsSync(chatHistoryFile)) {
        previousConversation = fs.readFileSync(chatHistoryFile, 'utf8');
    }

    // Read custom prompt if it exists
    let customPrompt = '';
    if (fs.existsSync('customPrompt.txt')) {
        customPrompt = fs.readFileSync('customPrompt.txt', 'utf8');
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                ...previousConversation.split('\n').filter(line => line).map(line => {
                    const [role, content] = line.split(':');
                    return { role, content };
                }),
                { role: 'system', content: customPrompt },
                { role: 'user', content: cleanedContent },
            ],
        });

        const replyText = response.choices[0].message.content.trim();

        // Append new conversation to the chat history file
        fs.appendFileSync(chatHistoryFile, `user:${cleanedContent}\nassistant:${replyText}\n`);

        msg.reply(replyText);
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        msg.reply('Sorry, I encountered an error while processing your request.');
    }
});

client.login("MTI1OTUwNzcyMzc3OTgzNzk5Mg.GgTUSu.xt1iQUd_u-JddVnlMlFU77_72z1dD-SuhZ2i74");  // Use environment variable for the bot token




