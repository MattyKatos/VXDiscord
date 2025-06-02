const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages from bots (including itself)
    if (message.author.bot) return;

    const content = message.content;
    if (/twitter\.com|x\.com/i.test(content)) {
        // Replace all instances of twitter.com or x.com with vxtwitter.com
        const fixed = content.replace(/twitter\.com|x\.com/gi, 'vxtwitter.com');
        await message.reply(`Fixed that for you\n${fixed}`);
    }
});

client.login(process.env.BOT_TOKEN);
