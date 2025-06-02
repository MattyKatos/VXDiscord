const fs = require('fs');
const path = require('path');

// Collection to store commands
const commands = new Map();
const commandsData = [];

// Load all command files from the commands directory
function loadCommands() {
    const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, '..', 'commands', file));
        
        // Set command in the collection
        commands.set(command.data.name, command);
        
        // Add command data for registration
        commandsData.push(command.data.toJSON());
        
        console.log(`Loaded command: ${command.data.name}`);
    }
    
    return { commands, commandsData };
}

module.exports = { loadCommands };
