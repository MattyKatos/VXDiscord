const { Client, GatewayIntentBits, Partials, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Check if .env file exists, if not create it
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('.env file not found. Creating template...');
    try {
        fs.writeFileSync(envPath, 'BOT_TOKEN=', 'utf8');
        console.error('\x1b[31mERROR: Bot token is required!\x1b[0m');
        console.error('Please edit the .env file and add your Discord bot token after BOT_TOKEN=');
        process.exit(1);
    } catch (error) {
        console.error('Error creating .env file:', error);
        process.exit(1);
    }
}

// Load environment variables
require('dotenv').config();

// Check if BOT_TOKEN is empty or undefined
if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === '') {
    console.error('\x1b[31mERROR: Bot token is required!\x1b[0m');
    console.error('Please edit the .env file and add your Discord bot token after BOT_TOKEN=');
    process.exit(1);
}

// Check if config.json exists, if not create it from default_config.json
const configPath = path.join(__dirname, 'config.json');
const defaultConfigPath = path.join(__dirname, 'default_config.json');

if (!fs.existsSync(configPath)) {
    console.log('Config file not found. Creating from default config...');
    try {
        // Read the default config
        const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf8');
        // Write it to config.json
        fs.writeFileSync(configPath, defaultConfig, 'utf8');
        console.log('Config file created successfully.');
    } catch (error) {
        console.error('Error creating config file:', error);
        process.exit(1); // Exit if we can't create the config file
    }
}

// Load configuration
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Import modules
const { db } = require('./modules/database');
const { loadCommands } = require('./modules/commandHandler');
const { initAutoUpdate } = require('./modules/updater');

// Initialize auto-update feature
initAutoUpdate();

// Database is now imported from database.js

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Define slash commands
// Load commands from the commands directory
const { commands, commandsData } = loadCommands();

// Register slash commands when the bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Set the bot's activity status from config
    const activityType = config.bot.activityType === 'WATCHING' ? ActivityType.Watching : 
                         config.bot.activityType === 'PLAYING' ? ActivityType.Playing : 
                         config.bot.activityType === 'LISTENING' ? ActivityType.Listening : 
                         config.bot.activityType === 'COMPETING' ? ActivityType.Competing : 
                         ActivityType.Watching;
    
    client.user.setActivity(config.bot.activity, { type: activityType });
    console.log(`Bot activity status set to: ${config.bot.activityType} ${config.bot.activity}`);
    
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsData }
        );
        
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error refreshing application commands:', error);
    }
});

// Handle interactions (commands and buttons)
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isCommand()) {
        const command = commands.get(interaction.commandName);
        
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            await interaction.reply({
                content: 'There was an error executing this command.',
                flags: 64 // Ephemeral flag
            }).catch(console.error);
        }
    }
    
    // Handle button interactions
    if (interaction.isButton()) {
        if (interaction.customId === 'ftfy_toggle') {
            try {
                const ftfyCommand = commands.get('ftfy');
                if (ftfyCommand && ftfyCommand.handleButton) {
                    await ftfyCommand.handleButton(interaction);
                }
            } catch (error) {
                console.error('Error handling button interaction:', error);
                await interaction.reply({
                    content: 'There was an error processing your request.',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    }
});

// Handle message creation
client.on('messageCreate', async (message) => {
    // Ignore messages from bots (including itself)
    if (message.author.bot) return;
    
    try {
        // Import the database functions
        const { isUserOptedOut } = require('./modules/database');
        
        // Check if user has opted out
        const isOptedOut = await isUserOptedOut(message.author.id);
        if (isOptedOut) return; // Skip processing for opted-out users
        
        const content = message.content;
        // Simple URL regex: looks for http(s):// or www. and at least one dot
        const urlRegex = /https?:\/\/\S+|www\.\S+/i;
        
        // Create a regex pattern from all alternative domains to skip messages that already contain fixed links
        const domainPattern = new RegExp(config.alternativeDomains.map(domain => domain.replace('.', '\\.')).join('|'), 'i');
        
        // Skip if the message already contains any of the alternative domains
        if (domainPattern.test(content)) return;
        
        if (urlRegex.test(content) && /twitter\.com|x\.com/i.test(content)) {
            // Replace all instances of twitter.com or x.com with the configured domain
            const fixed = content.replace(/twitter\.com|x\.com/gi, config.fixDomain);
            await message.reply({
                content: `${config.messages.fixedMessagePrefix}${fixed}`,
            });
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

// Handle application shutdown
process.on('SIGINT', () => {
    const { db } = require('./modules/database');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

client.login(process.env.BOT_TOKEN);
