const { Client, GatewayIntentBits, Partials, REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
        process.exit(1);
    }
}

// Load configuration
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));

// Import database helpers
const { db, isUserOptedOut, incrementLinkFixCount } = require('./modules/database');

// Check for bot token
if (!config.bot.token || config.bot.token === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
    console.error('\x1b[31mERROR: Bot token is required!\x1b[0m');
    console.error('Please add your Discord bot token to the bot.token field in config.json');
    process.exit(1);
}

// Check config version
const configOutOfDate = config.configVersion !== defaultConfig.configVersion;

// Import modules
const { loadCommands } = require('./modules/commandHandler');
const { initAutoUpdate } = require('./modules/updater');

// Initialize auto-update feature
initAutoUpdate();

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
    
    // Set the bot's activity status, or show CONFIG OUT OF DATE if needed
    const activityType = config.bot.activityType === 'WATCHING' ? ActivityType.Watching : 
                         config.bot.activityType === 'PLAYING' ? ActivityType.Playing : 
                         config.bot.activityType === 'LISTENING' ? ActivityType.Listening : 
                         config.bot.activityType === 'COMPETING' ? ActivityType.Competing : 
                         ActivityType.Watching;

    if (configOutOfDate) {
        client.user.setActivity('UPDATE CONFIG', { type: activityType });
        console.warn('\x1b[33mYour config.json is out of date! Please update it to match default_config.json.\x1b[0m');
    } else {
        client.user.setActivity(config.bot.activity, { type: activityType });
        console.log(`Bot activity status set to: ${config.bot.activityType} ${config.bot.activity}`);
    }
    
    try {
        const rest = new REST({ version: '10' }).setToken(config.bot.token);
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
        
        
        // Check if user has opted out
        const isOptedOut = await isUserOptedOut(message.author.id);
        if (isOptedOut) return; // Skip processing for opted-out users
        
        const content = message.content;
        // Simple URL regex: looks for http(s):// or www. and at least one dot
        const urlRegex = /https?:\/\/\S+|www\.\S+/i;

        // Check each replacement rule
        for (const rule of config.linkReplacements) {
            // Skip if message already contains the replacement domain
            const replacementDomainPattern = new RegExp(rule.replaceWith.replace('.', '\\.'), 'i');
            if (replacementDomainPattern.test(content)) continue;

            // Create a regex to match any of the source domains
            const matchPattern = new RegExp(rule.matchDomains.map(domain => domain.replace('.', '\\.')).join('|'), 'gi');
            if (urlRegex.test(content) && matchPattern.test(content)) {
                // Replace all instances of the matched domains with the replacement domain
                const fixed = content.replace(matchPattern, rule.replaceWith);
                await incrementLinkFixCount(rule.matchDomains[0].includes('instagram') ? 'instagram' : 'twitter');
                await message.reply({
                    content: `${config.messages.fixedMessagePrefix}${fixed}`,
                });
                break; // Only reply once for the first applicable rule
            }
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

client.login(config.bot.token);