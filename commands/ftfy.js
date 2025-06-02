const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { isUserOptedOut, addUserToOptOut, removeUserFromOptOut } = require('../modules/database');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ftfy')
        .setDescription('Manage your Twitter/X link fixing preferences')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(false)
                .addChoices(
                    { name: 'start', value: 'start' },
                    { name: 'stop', value: 'stop' }
                )
        ),
    async execute(interaction) {
        const { user } = interaction;
        const action = interaction.options.getString('action');
        
        try {
            // Check current status
            const isOptedOut = await isUserOptedOut(user.id);
            
            if (action === 'stop') {
                // Opt out
                await addUserToOptOut(user.id);
                await interaction.reply({ 
                    content: 'You have opted out of automatic Twitter/X link fixing.', 
                    flags: 64 // Ephemeral flag (1 << 6)
                });
            } else if (action === 'start') {
                // Opt in
                await removeUserFromOptOut(user.id);
                await interaction.reply({ 
                    content: 'You have opted in to automatic Twitter/X link fixing.', 
                    flags: 64 // Ephemeral flag (1 << 6)
                });
            } else {
                // Show status (no action provided)
                const status = isOptedOut ? 'OFF' : 'ON';
                
                // Create a single row with all buttons
                const buttonRow = {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            custom_id: 'ftfy_toggle',
                            style: isOptedOut ? ButtonStyle.Success : ButtonStyle.Danger,
                            label: isOptedOut ? 'Turn FTFY ON' : 'Turn FTFY OFF'
                        },
                        {
                            type: 2, // Button
                            style: 5, // Link style
                            label: 'Add to Server',
                            url: 'https://discord.com/oauth2/authorize?client_id=1378964421766025267'
                        },
                        {
                            type: 2, // Button
                            style: 5, // Link style
                            label: 'Tip the Dev',
                            url: 'https://streamelements.com/mattykatos/tip'
                        },
                        {
                            type: 2, // Button
                            style: 5, // Link style
                            label: 'More Info',
                            url: 'https://www.katos.xyz/ftfy/'
                        }
                    ]
                };
                
                // Create an embed for better appearance
                const embed = new EmbedBuilder()
                    .setColor(config.embeds.twitterBlue) // Twitter blue color from config
                    .setTitle('FTFY (Fixed That For You)')
                    .setDescription('Automatically replaces Twitter/X links with vxtwitter links to fix embeds.')
                    .addFields(
                        { name: 'Status', value: `**${status}**`, inline: true },
                        { name: 'Links', value: isOptedOut ? 'Will not be automatically fixed' : 'Will be automatically fixed', inline: true },
                        { name: 'Data', value: isOptedOut ? 'UID is stored' : 'No data stored', inline: true }                            
                    )
                    .setFooter({ text: 'Use the buttons below to change your settings' })
                    .setTimestamp();
                
                await interaction.reply({
                    embeds: [embed],
                    components: [buttonRow],
                    flags: 64 // Ephemeral flag (1 << 6)
                });
            }
        } catch (error) {
            console.error(`Error handling FTFY command:`, error);
            await interaction.reply({ 
                content: 'There was an error processing your request.', 
                flags: 64 // Ephemeral flag (1 << 6)
            });
        }
    },
    async handleButton(interaction) {
        try {
            const { user } = interaction;
            const isOptedOut = await isUserOptedOut(user.id);
            
            if (isOptedOut) {
                // User is currently opted out, so opt them in
                await removeUserFromOptOut(user.id);
                
                // Create a single row with all buttons
                const buttonRow = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: 'ftfy_toggle',
                            style: ButtonStyle.Danger,
                            label: 'Turn FTFY OFF'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'Add to Server',
                            url: 'https://discord.com/oauth2/authorize?client_id=1378964421766025267'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'Tip the Dev',
                            url: 'https://streamelements.com/mattykatos/tip'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'More Info',
                            url: 'https://www.katos.xyz/ftfy/'
                        }
                    ]
                };
                
                // Create an embed for better appearance
                const embed = new EmbedBuilder()
                    .setColor(config.embeds.twitterBlue) // Twitter blue color from config
                    .setTitle('FTFY (Fixed That For You)')
                    .setDescription('Automatically replaces Twitter/X links with vxtwitter links to fix embeds.')
                    .addFields(
                        { name: 'Status', value: '**ON**', inline: true },
                        { name: 'Links', value: 'Will be automatically fixed', inline: true },
                        { name: 'Data', value: 'No data stored', inline: true },
                    )
                    .setFooter({ text: 'Use the buttons below to change your settings' })
                    .setTimestamp();
                
                await interaction.update({
                    embeds: [embed],
                    components: [buttonRow],
                    content: null // Remove content as we're using embeds now
                });
            } else {
                // User is currently opted in, so opt them out
                await addUserToOptOut(user.id);
                
                // Create a single row with all buttons
                const buttonRow = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: 'ftfy_toggle',
                            style: ButtonStyle.Success,
                            label: 'Turn FTFY ON'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'Add to Server',
                            url: 'https://discord.com/oauth2/authorize?client_id=1378964421766025267'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'Tip the Dev',
                            url: 'https://streamelements.com/mattykatos/tip'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'More Info',
                            url: 'https://www.katos.xyz/ftfy/'
                        }
                    ]
                };
                
                // Create an embed for better appearance
                const embed = new EmbedBuilder()
                    .setColor(config.embeds.twitterBlue) // Twitter blue color from config
                    .setTitle('FTFY (Fixed That For You)')
                    .setDescription('Automatically replaces Twitter/X links with vxtwitter links to fix embeds.')
                    .addFields(
                        { name: 'Status', value: '**OFF**', inline: true },
                        { name: 'Links', value: 'Will not be automatically fixed', inline: true },
                        { name: 'Data', value: 'UID is stored', inline: true },
                    )
                    .setFooter({ text: 'Use the buttons below to change your settings' })
                    .setTimestamp();
                
                await interaction.update({
                    embeds: [embed],
                    components: [buttonRow],
                    content: null // Remove content as we're using embeds now
                });
            }
        } catch (error) {
            console.error('Error handling button interaction:', error);
            await interaction.reply({
                content: 'There was an error processing your request.',
                ephemeral: true
            });
        }
    }
};
