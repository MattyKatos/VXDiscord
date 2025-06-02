# VXDiscord Bot

A Discord bot that listens for messages containing `twitter.com` or `x.com` and replies with a fixed message replacing them with `vxtwitter.com`.

## Features
- Automatically detects and fixes Twitter/X links in any channel it can see.
- Replies with "Fixed that for you" and the corrected message.

## Setup
1. Clone/download this repo.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with your Discord bot token:
   ```
   BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   ```
4. Start the bot:
   ```
   npm start
   ```

## Permissions
The bot needs the following Gateway Intents:
- `GUILD_MESSAGES`
- `MESSAGE_CONTENT`
- `GUILDS`

## Example
User: Check this out! https://twitter.com/username/status/12345

Bot: Fixed that for you
Check this out! https://vxtwitter.com/username/status/12345

---
Made using discord.js
