# Pokémon GO profile level scanner

This Discord bot scans Pokémon GO trainer profile screenshots, assigns configured level roles, and provides a staff modmail system. Version 3 uses discord.js 14 and does not require Discord's privileged Message Content, Server Members, or Presence intents.

## Requirements

- Node.js 18 or newer (a current Node.js LTS release is recommended)
- npm
- ImageMagick or GraphicsMagick, used by the `gm` crop pipeline
- A Discord application with a bot user

Install dependencies with:

```sh
npm install
```

On Windows, `first setup.bat` can create `server/` from the checked-in templates. Existing server files are overwritten by that script, so back them up first.

## Configuration

Copy the three files from `serverTemplate/` into a local `server/` directory, then configure them:

- `server/keys.json`: bot token, application ID, and bot-owner IDs
- `server/config.json`: guild, channel, role, OCR, and modmail settings
- `server/messagetxt.js`: customizable user-facing messages

Example keys file:

```json
{
  "token": "YOUR_BOT_TOKEN",
  "applicationId": "YOUR_APPLICATION_ID",
  "ownerIds": ["YOUR_DISCORD_USER_ID"]
}
```

`applicationId` is shown as **Application ID** on the Discord Developer Portal's General Information page. The registration script can derive it from a normal bot token, but setting it explicitly is clearer and more robust. Never commit `server/keys.json`.

Set at least these IDs in `server/config.json` before launch:

- `serverID`
- `screenshotChannel`
- `logsChannel`
- `profileChannel`
- `targetLevelRole`
- `modRole`
- `mailCategory` and `mailLogChannel` when modmail is enabled

The legacy `prefix`, `prefix2`, `welcomeMsg`, and `dmAutoReply` settings are retained only so existing configuration files continue to load. Prefixes are replaced by mention commands; welcome messages and passive ticket-channel forwarding are disabled because they relied on privileged intents.

## Register slash commands

After configuring `server/keys.json` and `server/config.json`, run:

```sh
npm run register-commands
```

This registers `/submit-profile`, `/screenshot`, and `/ticket` as guild commands in `ids.serverID`. Guild command changes normally appear immediately. Rerun the command whenever the definitions in `interactions/definitions.js` change. The script replaces this application's guild command set with the definitions in this repository.

The application must be installed in the server with both OAuth2 scopes:

- `bot`
- `applications.commands`

If the bot was installed without `applications.commands`, create a new install URL in the Developer Portal's OAuth2 URL Generator and authorize it again. You do not need to remove the bot first.

## Discord intents and permissions

The bot requests only these standard Gateway intents:

- Guilds
- Guild Messages
- Direct Messages
- Guild Moderation, used for the optional verified-role audit-log notification

Leave **Message Content Intent**, **Server Members Intent**, and **Presence Intent** disabled in the Developer Portal. Natural DMs to the bot and guild messages that directly mention the bot remain available without Message Content.

Recommended bot permissions are:

- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages
- Manage Channels, for modmail ticket creation/deletion
- Manage Roles, with the bot's role above every role it assigns or removes
- View Audit Log, only when `respondVerify` is enabled

## Commands

Users submit a screenshot explicitly:

```text
/submit-profile screenshot:<image>
```

The command must be used in the configured screenshot channel. Direct-message scanning remains available when `dmScanning` is enabled.

When OCR cannot determine a valid level from a guild submission, the bot reposts the screenshot in that channel as a staff review item, tags `modRole`, and includes the member ID, OCR output, and confirmation instructions. Running the confirm command removes only review posts marked for that member; concurrent failures belonging to other members are preserved.

Staff modmail actions use the `/ticket` subcommands:

```text
/ticket reply [message] [attachment]
/ticket open user
/ticket close [reason]
/ticket close-after hours [reason]
/ticket timer-cancel
/ticket timers
/ticket sync user
/ticket info
```

Ordinary messages typed in a ticket channel are internal staff discussion and are not forwarded. Users still open and continue tickets by sending natural DMs to the bot.

Public utility and staff administration use an exact bot mention as the first token:

```text
@Bot help
@Bot ping
@Bot version
@Bot admin help
```

Use `@Bot admin help` for the complete staff command list. Normal staff actions require the configured `modRole` or Administrator. Process restart/quit additionally require an ID in `server/keys.json` `ownerIds` and a confirmation button.

The frequently used screenshot moderation shortcuts are:

```text
@Bot c @user 39
@Bot confirm @user 39
@Bot revert @user
```

Inside a modmail ticket, `@Bot c 39` infers the ticket user from the channel. `@Bot c` also works there when the level should be treated as missing, matching the previous confirm behavior.

The same staff-only actions are also available with typed slash-command fields:

```text
/screenshot confirm user:@user level:39
/screenshot confirm level:39
/screenshot revert user:@user
```

The user is optional for `/screenshot confirm` only when invoked inside a modmail ticket, where the existing ticket lookup is used. Runtime permission checks require `modRole` or Administrator. If desired, server administrators can additionally hide `/screenshot` from other roles in Discord's integration command permissions.

## Run and validate

```sh
npm test
npm start
```

`npm test` runs lint checks and validates the application-command definitions. `npm start` starts the bot. Slash-command registration is deliberately separate from startup so an ordinary restart cannot unexpectedly modify Discord commands.

See [KEY_CHANGES.md](KEY_CHANGES.md) for migration notes and the release test checklist. The original design review is retained in [plan.md](plan.md).

## Licence

Copyright (C) Soul Green - All Rights Reserved. Unauthorized use is prohibited without express permission.
