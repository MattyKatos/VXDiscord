# VXDiscord Bot

A Discord bot that automatically converts Twitter/X links to vxtwitter.com or fxtwitter.com links for better embedding in Discord.

## Features
- Automatically detects and fixes Twitter/X links in any channel it can see
- Configurable fix domain (vxtwitter.com or fxtwitter.com)
- Replies with "Fixed that for you" and the corrected message
- Slash commands for user control:
  - `/ftfy` - Shows current status with a rich embed and interactive toggle button
  - `/ftfy start` - Opts in to automatic link fixing
  - `/ftfy stop` - Opts out of automatic link fixing
  - `/ftfm link` - Allows users to fix a specific Twitter/X link manually
- User opt-out system with SQLite database
- Interactive toggle button for users to easily switch their FTFY status on/off
- Auto-update feature that checks for GitHub updates once per hour

## Simple Setup
Invite the FTFY bot to your server using this link:
https://discord.com/oauth2/authorize?client_id=1378964421766025267

## Self-Hosting Setup
1. Clone/download this repo.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your Discord bot token:
   ```
   BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   ```
4. (Optional) Configure the bot by editing `config.json` (created automatically on first run from `default_config.json`).
5. Start the bot:
   ```
   node bot.js
   ```

## Configuration
The bot uses a configuration system with the following files:
- `default_config.json` - Template with default settings
- `config.json` - Your local configuration (created automatically if missing)

You can customize:
- Fix domain (vxtwitter.com or fxtwitter.com)
- Bot activity status and type
- Auto-update settings (enable/disable, interval, timezone)
- Database path
- Message templates
- UI colors

### Changing the Fix Domain
By default, the bot uses vxtwitter.com to fix Twitter/X links. If you prefer to use fxtwitter.com instead, simply change the `fixDomain` value in your config.json:

```json
"fixDomain": "fxtwitter.com"
```

The bot will automatically recognize both domains as "already fixed" links, so it won't try to fix links that are already using either domain.

## Permissions
The bot needs the following Gateway Intents:
- `GUILD_MESSAGES`
- `MESSAGE_CONTENT`
- `GUILDS`

## Example
User: Check this out! https://twitter.com/username/status/12345

Bot: Fixed that for you
Check this out! https://vxtwitter.com/username/status/12345

## Project Structure
```
├── bot.js                 # Main bot file
├── commands/              # Slash command modules
│   ├── ftfy.js            # FTFY command with button handling
│   └── ftfm.js            # FTFM command for manual fixes
├── modules/               # Core functionality modules
│   ├── commandHandler.js  # Loads and registers commands
│   ├── database.js        # Database operations
│   └── updater.js         # Auto-update functionality
├── config.json            # Local configuration (gitignored)
├── default_config.json    # Default configuration template
└── .env                   # Environment variables (gitignored)
```

---
Made using discord.js & vxtwitter.com/fxtwitter.com
