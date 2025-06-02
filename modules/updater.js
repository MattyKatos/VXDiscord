const simpleGit = require('simple-git');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

// Auto-update configuration
const git = simpleGit();
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || config.autoUpdate.interval || '0 * * * *'; // Check once every hour
let updateInProgress = false;

// Function to check for updates and restart if needed
async function checkForUpdates() {
    if (updateInProgress) return;
    updateInProgress = true;
    
    try {
        console.log('[Auto-Update] Checking for updates...');
        
        // Check if git repository exists
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.log('[Auto-Update] Not a git repository. Skipping update check.');
            updateInProgress = false;
            return;
        }
        
        // Fetch the latest changes
        await git.fetch();
        
        // Get the status
        const status = await git.status();
        
        if (status.behind > 0) {
            console.log(`[Auto-Update] New updates found (${status.behind} commits behind). Pulling changes...`);
            
            try {
                // Pull the latest changes
                await git.pull();
                
                console.log('[Auto-Update] Changes pulled successfully.');
                console.log('[Auto-Update] Please restart the bot manually to apply changes.');
                
                // Instead of auto-restarting, just log that updates were found
                // This avoids potential restart loops or connection issues
                updateInProgress = false;
            } catch (pullError) {
                console.error('[Auto-Update] Error pulling changes:', pullError);
                updateInProgress = false;
            }
        } else {
            console.log('[Auto-Update] No updates found.');
            updateInProgress = false;
        }
    } catch (error) {
        console.error('[Auto-Update] Error checking for updates:', error);
        updateInProgress = false;
    }
}

// Initialize the auto-update feature
function initAutoUpdate() {
    // Check if auto-update is enabled in config
    if (!config.autoUpdate.enabled) {
        console.log('[Auto-Update] Auto-update feature is disabled in config.');
        return;
    }
    
    // Schedule the update check
    cron.schedule(UPDATE_INTERVAL, checkForUpdates, {
        scheduled: true,
        timezone: config.autoUpdate.timezone || 'America/New_York'
    });
    
    // Run an initial update check when the bot starts
    const initialDelay = (config.autoUpdate.initialDelaySeconds || 10) * 1000;
    setTimeout(() => {
        console.log('[Auto-Update] Running initial update check...');
        checkForUpdates();
    }, initialDelay);
    
    console.log('[Auto-Update] Auto-update feature initialized.');
}

module.exports = {
    initAutoUpdate,
    checkForUpdates
};
