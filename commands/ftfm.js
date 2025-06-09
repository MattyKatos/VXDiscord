const { SlashCommandBuilder } = require('discord.js');
const { incrementLinkFixCount } = require('../modules/database');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ftfm')
        .setDescription('Fix a Twitter/X link for me before sending')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Twitter/X link to fix')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const { user } = interaction;
            const link = interaction.options.getString('link');

            let foundRule = false;
            for (const rule of config.linkReplacements) {
                // Build regex for match domains
                const matchPattern = new RegExp(rule.matchDomains.map(domain => domain.replace('.', '\\.')).join('|'), 'i');
                // Build regex for alternative domains
                const altPattern = new RegExp(rule.alternativeDomains.map(domain => domain.replace('.', '\\.')).join('|'), 'i');

                if (matchPattern.test(link)) {
                    foundRule = true;
                    if (altPattern.test(link)) {
                        await interaction.reply({
                            content: `This link is already using a fixed domain!`,
                            flags: 64 // Ephemeral flag
                        });
                        return;
                    }
                    // Replace all match domains with the chosen replacement
                    const globalMatchPattern = new RegExp(rule.matchDomains.map(domain => domain.replace('.', '\\.')).join('|'), 'gi');
                    const fixed = link.replace(globalMatchPattern, rule.replaceWith);
                    let platform = 'twitter';
if (rule.matchDomains[0].includes('instagram')) platform = 'instagram';
if (rule.matchDomains[0].includes('tiktok')) platform = 'tiktok';
await incrementLinkFixCount(platform);
                    await interaction.reply({
                        content: fixed
                    });
                    return;
                }
            }
            if (!foundRule) {
                await interaction.reply({
                    content: `This link is not supported for fixing.`,
                    flags: 64 // Ephemeral flag
                });
            }
        } catch (error) {
            console.error('Error handling FTFM command:', error);
            await interaction.reply({
                content: 'There was an error processing your request.',
                flags: 64 // Ephemeral flag
            });
        }
    }
};
