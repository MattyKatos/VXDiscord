const { SlashCommandBuilder } = require('discord.js');
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
            
            // Check if the link is a Twitter/X link
            if (!/twitter\.com|x\.com/i.test(link)) {
                await interaction.reply({
                    content: 'This doesn\'t appear to be a Twitter/X link. Please provide a valid Twitter/X URL.',
                    flags: 64 // Ephemeral flag
                });
                return;
            }
            
            // Create a regex pattern from all alternative domains to check if the link already uses a fixed domain
            const domainPattern = new RegExp(config.alternativeDomains.map(domain => domain.replace('.', '\\.')).join('|'), 'i');
            
            // Check if the link already contains any of the alternative domains
            if (domainPattern.test(link)) {
                await interaction.reply({
                    content: `This link is already using a fixed domain!`,
                    flags: 64 // Ephemeral flag
                });
                return;
            }
            
            // Fix the link using the configured domain
            const fixed = link.replace(/twitter\.com|x\.com/gi, config.fixDomain);
            
            // Reply with the fixed link (not ephemeral so others can see it)
            await interaction.reply({
                content: fixed
            });
        } catch (error) {
            console.error('Error handling FTFM command:', error);
            await interaction.reply({
                content: 'There was an error processing your request.',
                flags: 64 // Ephemeral flag
            });
        }
    }
};
