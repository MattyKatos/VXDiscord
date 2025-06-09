const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { isUserOptedOut, addUserToOptOut, removeUserFromOptOut, getLinkFixCount } = require('../modules/database');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ftfy')
        .setDescription('Manage your Twitter, Instagram, and TikTok link fixing preferences'),
    async execute(interaction) {
    // Get stats for links fixed
    const twitterCount = await getLinkFixCount('twitter');
    const instagramCount = await getLinkFixCount('instagram');
    const tiktokCount = await getLinkFixCount('tiktok');

        const { user } = interaction;

        try {
            // Check current status
            const isOptedOut = await isUserOptedOut(user.id);
            
            // Always show status (buttons now handle opt-in/out)
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
                            url: 'https://coff.ee/mattykatos'
                        },
                        {
                            type: 2, // Button
                            style: 5, // Link style
                            label: 'More Info',
                            url: 'https://www.katos.xyz/ftfy/'
                        }
                    ]
                };
                
                // Build a list of active redirects (current replaceWith for each rule)
                const activeRedirects = config.linkReplacements.map(rule => {
                    return `${rule.matchDomains.join(', ')} → **${rule.replaceWith}**`;
                }).join('\n');

                // Embed - Default
                const embed = new EmbedBuilder()
                    .setColor(config.embeds.color) // Twitter blue color from config
                    .setTitle('FTFY (Fixed That For You)')
                    .setDescription('Automatically replaces supported social links (Twitter, Instagram, TikTok) with the currently active redirect domains for better embeds.')
                    .addFields(
                        { name: 'Status', value: `**${status}**`, inline: true },
                        { name: 'Links', value: isOptedOut ? 'Will not be automatically fixed' : 'Will be automatically fixed', inline: true },
                        { name: 'Data', value: isOptedOut ? 'UID is stored' : 'No data stored', inline: true },
                        { name: 'Active Redirects', value: activeRedirects, inline: false },
                        { name: 'Links Fixed (Global)', value: `Twitter: **${twitterCount}**\nInstagram: **${instagramCount}**\nTikTok: **${tiktokCount}**`, inline: false }
                    )
                    .setFooter({ text: 'Use the buttons below to change your settings' })
                    .setTimestamp();
                
                await interaction.reply({
                    embeds: [embed],
                    components: [buttonRow],
                    flags: 64 // Ephemeral flag (1 << 6)
                });
            }
        catch (error) {
            console.error(`Error handling FTFY command:`, error);
            await interaction.reply({ 
                content: 'There was an error processing your request.', 
                flags: 64 // Ephemeral flag (1 << 6)
            });
        }
    },

    async handleButton(interaction) {
    // Get stats for links fixed
    const twitterCount = await getLinkFixCount('twitter');
    const instagramCount = await getLinkFixCount('instagram');
    const tiktokCount = await getLinkFixCount('tiktok');

        try {
            const { user } = interaction;
            const isOptedOut = await isUserOptedOut(user.id);
            // Build a list of active redirects (current replaceWith for each rule)
            const activeRedirects = config.linkReplacements.map(rule => {
                return `${rule.matchDomains.join(', ')} → **${rule.replaceWith}**`;
            }).join('\n');
            
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
                            url: 'https://coff.ee/mattykatos'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'More Info',
                            url: 'https://www.katos.xyz/ftfy/'
                        }
                    ]
                };
                
                // Embed - Opted In
                const embed = new EmbedBuilder()
                    .setColor(config.embeds.color) // Twitter blue color from config
                    .setTitle('FTFY (Fixed That For You)')
                    .setDescription('Automatically replaces supported social links with the currently active redirect domains for better embeds.')
                    .addFields(
                        { name: 'Status', value: `**ON**`, inline: true },
                        { name: 'Links', value: isOptedOut ? 'Will not be automatically fixed' : 'Will be automatically fixed', inline: true },
                        { name: 'Data', value: isOptedOut ? 'UID is stored' : 'No data stored', inline: true },
                        { name: 'Active Redirects', value: activeRedirects, inline: false },
                        { name: 'Links Fixed (Global)', value: `Twitter: **${twitterCount}**\nInstagram: **${instagramCount}**\nTikTok: **${tiktokCount}**`, inline: false }
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
                            url: 'https://coff.ee/mattykatos'
                        },
                        {
                            type: 2,
                            style: 5, // Link style
                            label: 'More Info',
                            url: 'https://www.katos.xyz/ftfy/'
                        }
                    ]
                };
                
                // Embed - Opted Out
                const embed = new EmbedBuilder()
                    .setColor(config.embeds.color) // Twitter blue color from config
                    .setTitle('FTFY (Fixed That For You)')
                    .setDescription('Automatically replaces supported social links with the currently active redirect domains for better embeds.')
                    .addFields(
                        { name: 'Status', value: `**OFF**`, inline: true },
                        { name: 'Links', value: isOptedOut ? 'Will not be automatically fixed' : 'Will be automatically fixed', inline: true },
                        { name: 'Data', value: isOptedOut ? 'UID is stored' : 'No data stored', inline: true },
                        { name: 'Active Redirects', value: activeRedirects, inline: false },
                        { name: 'Links Fixed (Global)', value: `Twitter: **${twitterCount}**\nInstagram: **${instagramCount}**\nTikTok: **${tiktokCount}**`, inline: false }
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
