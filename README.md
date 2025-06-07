# VXDiscord Bot

A Discord bot that automatically replaces supported social links with the currently active redirect domains for better embeds in Discord.

## Features
- Automatically detects and fixes Twitter/X and Instagram links in any channel it can see
- Configurable fix domains (vxtwitter.com, fxtwitter.com, or alternative Instagram domains)
- Replies with "Fixed that for you" and the corrected message
- Slash commands for user control:
  - `/ftfy` - Shows plugin and user status with a rich embed and **interactive toggle button** to opt-in/out
  - `/ftfm link` - Allows users to fix a specific Twitter/X or Instagram link manually
- User opt-out system with SQLite database
- Auto-update feature that checks for GitHub updates once per hour
- Config Version checker sets bot status to "UPDATE CONFIG" if config.json is out of date

## Simple Setup
Invite the FTFY bot to your server using this link:
https://discord.com/oauth2/authorize?client_id=1378964421766025267

## Self-Hosting Setup
1. Clone/download this repo.
2. Run `npm install` to install dependencies.
3. Copy `default_config.json` to `config.json`. (If you fail to do this the bot will do this for you, then it will yell at you because the default token is wrong.)
4. Edit `config.json` and set your Discord bot token in the `bot.token` field:
   ```json
   "bot": {
     "token": "YOUR_BOT_TOKEN_HERE",
     ...
   }
   ```
5. Start the bot:
   ```
   node bot.js
   ```

## Configuration
The bot uses a configuration system with the following files:
- `default_config.json` - Template with default settings
- `config.json` - Your local configuration (created automatically if missing)

You can customize:
- Fix domains for Twitter/X and Instagram (e.g. vxtwitter.com, fxtwitter.com, bibliogram.art, etc)
- Bot activity status and type
- Auto-update settings (enable/disable, interval, timezone)
- Database path
- Message templates
- UI colors

### Changing the Fix Domains
By default, the bot uses vxtwitter.com to fix Twitter/X links. If you prefer to use fxtwitter.com or another supported domain (including Instagram alternatives), simply update the `linkReplacements` array in your config.json:

```json
"linkReplacements": [
  {
    "matchDomains": ["twitter.com", "x.com"],
    "replaceWith": "vxtwitter.com",
    ...
  },
  {
    "matchDomains": ["instagram.com"],
    "replaceWith": "bibliogram.art",
    ...
  }
]
```

You can add or modify entries to support new platforms or custom redirect domains.

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
