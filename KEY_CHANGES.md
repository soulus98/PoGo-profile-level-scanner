# Version 3 key changes and release checklist

## What changed

- Upgraded Discord integration from discord.js 13.6 to discord.js 14.27 and migrated embeds, buttons, attachments, channel creation, permissions, partials, and enum usage to the current API.
- Upgraded Tesseract.js from 2.1 to 7.0 and migrated worker initialization to the supported async API for modern Node.js.
- Added a digit-only sparse OCR fallback for profile crops where the general pass reads `LEVEL` but drops the isolated level number.
- Removed unused `canvas`, `imagemagick`, and native prebuild-helper npm dependencies, clearing their vulnerable `tar` dependency chain. The active crop path still requires the ImageMagick or GraphicsMagick system tool used by `gm`.
- Removed all privileged Gateway intents. The client now requests only Guilds, Guild Messages, Direct Messages, and Guild Moderation.
- Replaced prefix parsing with exact mention commands. The bot mention must be the first token, for example `@Bot admin config show`.
- Added short staff routes for the commonly used `@Bot c|confirm [user] [level]` and `@Bot revert <user>` actions; confirm can infer the user inside a modmail ticket.
- Added a separate staff `/screenshot confirm` and `/screenshot revert` command with typed Discord user and level fields; the public submission command remains `/submit-profile`.
- OCR-unreadable guild submissions are reposted to `screenshotChannel` with the image, staff tag, member details, OCR output, and confirm instructions. Confirming deletes only exact review-marker matches for that member.
- Added guild-scoped `/submit-profile` with a required screenshot attachment. Passive, ordinary screenshot-channel uploads are no longer read.
- Added `/ticket` subcommands for reply, open, close, delayed close, timer cancellation/listing, queue repair, and ticket information.
- Kept natural user DMs for modmail. Ordinary staff messages inside a ticket are now internal discussion and cannot be forwarded accidentally; staff must use `/ticket reply`.
- Replaced the verified-role member-update listener with an audit-log event. This requires Guild Moderation and View Audit Log, but not the privileged Server Members intent.
- Removed join welcome messages and immediate leave events. Known members are fetched individually when a screenshot or ticket action needs them.
- Added staff authorization to screenshot review buttons and added confirmation buttons for shutdown, restart, and clearing the entire blacklist.
- Added `npm run register-commands`; slash commands are not registered automatically at startup.
- Added `applicationId` and `ownerIds` to the keys template. Existing real `server/` configuration files were not overwritten.

## Before release

1. Use Node.js 18 or newer and run `npm install`.
2. Merge the new fields from `serverTemplate/keys.json` into `server/keys.json`:

   ```json
   {
     "applicationId": "YOUR_APPLICATION_ID",
     "ownerIds": ["OWNER_USER_ID"]
   }
   ```

3. Confirm all required IDs in `server/config.json`, especially `serverID`, `screenshotChannel`, `logsChannel`, `profileChannel`, `modRole`, the level roles, and the two modmail IDs.
4. In the Developer Portal, disable Message Content Intent, Server Members Intent, and Presence Intent.
5. Confirm the installation has `bot` and `applications.commands` OAuth2 scopes.
6. Run `npm run register-commands` once for the release guild.
7. Run `npm test`, then start the bot with `npm start`.

## Release smoke tests

### Startup and access

- Bot logs in with every privileged intent disabled and reports the configured guild/channels.
- `/submit-profile`, `/screenshot`, and `/ticket` appear in the configured guild after registration.
- Commands are rejected in another guild, and `/ticket` cannot be used in DMs.
- A non-staff member cannot run `/ticket`, admin mention commands, or screenshot review buttons.
- A member with `modRole` and a Discord Administrator can use normal staff actions.

### Profile submissions

- `/submit-profile` accepts PNG and JPEG trainer screenshots in `screenshotChannel` and queues OCR.
- A known test image completes OCR without a WASM path/URL error, and an OCR engine failure produces a short console/log message rather than an unhandled minified runtime dump.
- The command rejects use outside `screenshotChannel` with a private response.
- Invalid file types, tiny images, files over 15 MB, missing guild members, manually blacklisted users, automatically blacklisted users, and users with all configured roles receive the expected response and log entry.
- Successful scans still apply the target, level 40, and level 50/80 roles according to existing configuration and send the existing profile/log/DM messages.
- Failed and one-level-short scans still reach logs and the staff review buttons work only for staff.
- An OCR-unreadable guild submission creates a visible staff review post in `screenshotChannel` containing the original image, member ID, OCR output, and confirm instructions.
- With review posts for several members present, confirming one member deletes all unpinned review posts for that exact member within the latest 100 messages and preserves every other member's posts.
- An ordinary unmentioned screenshot upload is ignored. This is intentional.
- If `dmScanning` is enabled, a screenshot sent directly to the bot still follows the DM scan/modmail path.

### Mention commands

- `@Bot help`, `@Bot ping`, and `@Bot version` work for normal members.
- Mentioning the bot later in ordinary prose does not execute a command.
- `@Bot admin help` lists the new grammar.
- `/screenshot confirm user:@user level:39`, ticket-inferred `/screenshot confirm level:39`, and `/screenshot revert user:@user` match their mention-command behavior.
- Test config show, set, and toggle; stats; cache/memory diagnostics; scan confirm; scan revert; and clearing one blacklist ID.
- Clearing `all` requires a confirmation and cancellation/timeout makes no change.
- Restart and quit reject staff who are not in `ownerIds`, and require confirmation for an owner. Test these last in a supervised environment.

### Modmail

- A normal user DM creates the Send/Cancel prompt; both paths and the one-minute timeout work.
- Confirming creates a channel under `mailCategory`, writes the queue, sends the opening embeds, and logs the ticket.
- A later user DM is forwarded into the existing ticket and cancels an active close timer.
- Ordinary text typed by staff in a ticket stays in Discord and is not sent to the user.
- `/ticket reply` works with text only, attachment only, and both together, logs the reply, and cancels an active timer.
- `/ticket open` creates a ticket for a selected server member and rejects duplicates or users who cannot receive the DM.
- `/ticket info` reports the mapped user, current membership state, and timer.
- `/ticket sync` repairs a mapping and rejects an already-linked user.
- `/ticket close` sends the close DM/log, removes the queue mapping, and deletes the ticket channel.
- `/ticket close-after` returns immediately, appears in `/ticket timers`, survives longer than the original interaction token, and closes at expiry. Timers remain in-memory and do not survive a process restart.
- `/ticket timer-cancel` cancels the correct timer; `/ticket timers` works outside an individual ticket but remains staff-only.

### Verified role notification

- With `respondVerify` enabled, adding `verifiedRole` produces one DM via the audit-log event.
- Removing that role or changing another role does not send the DM.
- With View Audit Log removed, the rest of the bot continues operating; the notification is expected not to work.

## Intentional removals and compatibility notes

- `welcomeMsg` is no longer acted on. Use Discord onboarding, welcome screens, or another non-member-event mechanism.
- `dmAutoReply` is no longer acted on. Use `/ticket reply` so internal staff chat cannot leak to a user.
- `prefix` and `prefix2` no longer control command invocation. They remain in the config schema only for compatibility with old files and custom message replacement.
- Immediate open-ticket leave alerts are gone. Ticket actions perform targeted member lookups and report unavailable members lazily.
- Close timers are still process-local, matching the old persistence behavior.
- The upstream `gm` package is sunset. It remains in this release to avoid changing the established crop/OCR pipeline; plan and validate a separate image-backend migration.
- Slash commands are guild-scoped to `serverID`, making release updates fast but requiring registration separately in each test/production guild.

## Rollback

Keep the prior release commit/tag and a backup of `server/`. Rolling code back also requires rerunning that release's application-command registration strategy or removing the v3 guild commands in the Developer Portal. Re-enabling privileged intents should only be necessary when running the old code.
