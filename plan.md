# Privileged-intent removal plan

> Implementation status: implemented on the `full-update` branch in July 2026. This document remains the design and migration reference; see `KEY_CHANGES.md` for the release test checklist and any implementation-specific decisions.

## Purpose

This document began as the implementation plan for moving this bot off Discord privileged intents, based on the repository as reviewed on 2026-07-20. The follow-up implementation preserves it for future architectural reference.

The target end state is:

- no `GUILD_MEMBERS`, `GUILD_PRESENCES`, or `MESSAGE_CONTENT` privileged Gateway intents;
- administrative and diagnostic commands invoked by mentioning the bot;
- explicit interactions for guild-side modmail actions;
- a slash command for guild screenshot submissions;
- natural DM modmail intake retained, because Discord exposes content in DMs to the app without the Message Content intent;
- member data fetched only for a known user ID or taken from an interaction/message payload, rather than populated by the member Gateway stream.

Discord's current rules are important to the design. Without Message Content, `content`, `embeds`, `attachments`, `components`, and polls are normally empty. The exceptions include DMs with the app, messages that mention the app, messages sent by the app, and the target of a message context-menu command. See the official [Gateway intent documentation](https://docs.discord.com/developers/events/gateway#message-content-intent). This is why mention commands, slash commands, buttons, modals, and DMs work for this migration, while ordinary prefixes and passive attachment scanning do not.

## Executive recommendation

Use this command model:

1. Keep `GUILDS`, `GUILD_MESSAGES`, and `DIRECT_MESSAGES`, which are not privileged.
2. Replace the current prefix command handler with an exact mention router, such as `@Bot admin config show`.
3. Register one guild-scoped `/ticket` command with subcommands for staff modmail operations.
4. Register `/submit-profile screenshot:<attachment>` for normal guild screenshot intake.
5. Keep user-to-bot DMs and the existing Send/Cancel ticket confirmation buttons.
6. Remove ticket-channel `dmAutoReply`; ordinary staff messages must remain internal discussion unless staff explicitly use `/ticket reply` or a Reply button/modal.
7. Replace or retire the three `GUILD_MEMBERS` event-driven features: welcome-on-join, leave alerts, and verified-role update notifications.
8. Upgrade from `discord.js` 13.6.0 before implementing the interaction layer. The installed version predates current intent constants and the modern attachment-option API. Do the library/runtime migration separately from the behavior migration so failures are easier to isolate.

## Current intent inventory

The client is created in `bot.js` with these intents:

| Intent | Privileged? | Current use | End-state decision |
| --- | --- | --- | --- |
| `GUILDS` | No | Guild/channel/role caches, channel creation, interactions, and guild metadata | Keep |
| `GUILD_MEMBERS` | **Yes** | Member add/update/remove events and member caching | Remove after replacing the event-driven features |
| `GUILD_MESSAGES` | No | Prefix/mention messages, passive screenshot uploads, ticket-channel replies | Keep for mention commands; stop depending on unmentioned content |
| `DIRECT_MESSAGES` | No | User modmail and optional DM screenshot scanning | Keep |
| `DIRECT_MESSAGE_REACTIONS` | No | No active listener found; the old reaction trap is now implemented with buttons | Remove after a regression test confirms it is unused |

`GUILD_PRESENCES` is not requested and no presence-update dependency was found. The bot setting its own activity does not require that privileged intent.

The code does not currently declare `MESSAGE_CONTENT`, and `discord.js` 13.6.0 does not expose that flag. However, the README explicitly says the bot requires Message Content, and the implementation depends heavily on fields protected by it. Under the current Discord API, those guild workflows cannot be considered reliable without the intent. The migration must therefore eliminate those dependencies, not merely remove a flag from `bot.js`.

### Where `GUILD_MEMBERS` is used

Direct event dependencies in `bot.js`:

- `guildMemberAdd` sends `welcomeMsg` to every new member.
- `guildMemberRemove` calls `mail.alertMsg(..., "left")` when an open-ticket user leaves.
- `guildMemberUpdate` watches for `verifiedRole`, fetches the latest audit log, and sends `respondVerify`.

Member/cache dependencies elsewhere:

- `handlers/commands.js` fetches the command author and checks `modRole`/Administrator.
- `bot.js`, `commands/approve.js`, and `commands/revert.js` inspect roles and add/remove screenshot roles.
- `handlers/dm.js` fetches known members for ticket creation, ticket replies, role summaries, and membership checks.
- `commands/cache.js` reports and enumerates the member cache.

Most of the second group does **not** require the member Gateway intent. An interaction includes the invoking member and their role IDs, and Discord's `Get Guild Member` endpoint can retrieve one known user without the privileged intent. It is the bulk `List Guild Members` endpoint that explicitly requires `GUILD_MEMBERS`; see the official [Guild resource documentation](https://docs.discord.com/developers/resources/guild#get-guild-member). The implementation must avoid any no-ID/bulk fetch and must stop treating `guild.members.cache` as a complete member list.

### Where Message Content is used

Guild-side protected fields are used in these paths:

- `handlers/commands.js` parses `message.content` for both configured prefixes and arguments.
- `bot.js` checks mentions and special `wassup`/`prefix` messages, reads prefixes, detects attachments, and passively scans uploads.
- `bot.js` forwards any ordinary message in `mailCategory` when `dmAutoReply` is enabled.
- `commands/reply.js` reads reply text and attachments from a ticket-channel message.
- `commands/approve.js` and `commands/revert.js` parse user mentions/IDs from commands and inspect channel history during cleanup/fallbacks.
- `handlers/dm.js` reads ticket reply text and attachments. The user-DM branches remain valid under the DM exception; the staff guild-channel branches do not.

The following reads remain valid without Message Content and should not be mistakenly removed:

- incoming DMs to the bot;
- exact bot-mention command messages;
- bot-authored ticket/control/log messages, including their content during history fetches;
- interaction data from slash commands, buttons, selects, and modals;
- a target message supplied to a message context-menu command.

Calling `message.fetch()` is not a workaround: Message Content restrictions apply across the APIs, not just the initial Gateway event.

## Proposed user experiences

### 1. Mention commands

Use an exact, deterministic grammar and require the bot mention to be the first token:

```text
@Bot help
@Bot ping
@Bot version
@Bot admin help
@Bot admin config show
@Bot admin config set <setting> <value>
@Bot admin config toggle <setting>
@Bot admin stats [statistic]
@Bot admin diagnostics cache [channels|guilds|users|members|roles]
@Bot admin diagnostics memory
@Bot admin scan confirm <user mention-or-ID> [level]
@Bot admin scan revert <user mention-or-ID>
@Bot admin scan clear-blacklist <user-ID|all>
@Bot admin process restart
@Bot admin process quit
```

Parsing rules:

- Accept both `<@bot-id>` and `<@!bot-id>` forms.
- Strip exactly one leading bot mention and whitespace, then tokenize the remaining command.
- Do not run a command merely because the bot is mentioned somewhere in prose.
- Reserve `@Bot help` for the end-user screenshot/help response and `@Bot admin help` for staff command discovery.
- Return a short usage response for a recognized command with invalid arguments; ignore unrelated mentions or give the existing Premier help response only when no command is present.
- Do not advertise the old `prefix`/`prefix2` values after cutover.

This works without Message Content because Discord explicitly exposes messages that mention the app. `GUILD_MESSAGES` is still required to receive the `MESSAGE_CREATE` event, but it is not privileged.

#### Command migration matrix

The existing handler effectively makes only `help`, `ping`, and `version` public. Every command without an explicit `permissions` field is restricted to `modRole`, Administrator, or the hard-coded developer exception, regardless of the command's displayed `type`.

| Current command file | Current aliases/use | Proposed destination |
| --- | --- | --- |
| `help.js` | Public help/command list | `@Bot help` and `@Bot admin help` |
| `ping.js` | Public latency check | `@Bot ping` |
| `ver.js` | Public version | `@Bot version` |
| `set.js` | Change a config value | `@Bot admin config set ...` |
| `toggle.js` | Toggle a config value | `@Bot admin config toggle ...` |
| `show-settings.js` | Show all configuration | `@Bot admin config show` |
| `stats.js` | Show OCR statistics | `@Bot admin stats [statistic]` |
| `cache.js` | Developer cache diagnostics | `@Bot admin diagnostics cache ...`; redefine member output as explicitly partial or remove member enumeration |
| `memoryUsage.js` | Process memory diagnostics | `@Bot admin diagnostics memory` |
| `quit.js` | Stop the process | `@Bot admin process quit`, with explicit confirmation |
| `restart.js` | Git pull and restart | `@Bot admin process restart`, with explicit confirmation and developer-only policy |
| `approve.js` | Manual screenshot confirmation | `@Bot admin scan confirm ...` |
| `revert.js` | Remove screenshot roles | `@Bot admin scan revert ...` |
| `clear-blacklist.js` | Clear automatic blacklist | `@Bot admin scan clear-blacklist ...` |
| `open.js` | Staff-opened modmail ticket | `/ticket open` |
| `reply.js` | Staff ticket reply | `/ticket reply` |
| `close.js` | Close the current ticket | `/ticket close` |
| `closetimed.js` | Schedule/list/cancel close timers | `/ticket close-after`, `/ticket timer-cancel`, `/ticket timers` |
| `sync.js` | Repair a ticket/user mapping | `/ticket sync` |

The scan commands are presently labelled `Screenshots`, not `Admin`, but they carry the same effective staff authorization. Keeping all privileged operational commands behind one mention router avoids creating a large slash-command surface while meeting the no-Message-Content requirement.

#### Authorization requirements

- Centralize the check: `modRole` **or** Administrator for normal staff actions.
- Use a separately configured developer/owner allowlist for process control and sensitive diagnostics. Do not leave user IDs embedded in the handler.
- Re-check authorization for every component interaction. The current off-by-one Approve/Reject/Cancel handler in `bot.js` does not visibly enforce the staff role before executing the action.
- Restrict all commands to `serverID`; reject or ignore DMs and other guilds as appropriate.
- Require a confirmation button with a short expiry for `restart`, `quit`, clearing all blacklist entries, and any other broad action.
- Log actor ID, action, target, channel, result, and failure reason without logging secrets or the bot token.

### 2. Modmail

Keep the user side conversational and make only the guild staff side explicit.

#### Keep without converting to slash commands

- A user's ordinary DM opens or continues a ticket.
- DM content, stickers, and attachments can continue to be forwarded.
- The current DM `Send`/`Cancel` confirmation buttons can remain.
- OCR status notes can continue opening/annotating a ticket when a screenshot is submitted in a DM.
- Staff can type ordinary messages in a ticket channel for internal discussion; the bot must ignore them.
- Existing Approve/Reject review buttons may remain interactions after authorization and durable custom-ID handling are added.

#### Remove or replace

- Remove `dmAutoReply`. An ordinary unmentioned guild message cannot be read reliably without Message Content and must never be forwarded accidentally.
- Remove ticket instructions that advertise `=r`, `=close`, or any other legacy prefix.
- Stop deleting a staff command message after forwarding, because a slash interaction is not a normal source message.

#### Proposed `/ticket` command

Use a single top-level slash command with subcommands. Discord supports grouped subcommands and typed options; see the official [Application Commands documentation](https://docs.discord.com/developers/interactions/application-commands). Start as a guild command in the configured server so changes propagate immediately during testing, then decide whether it ever needs to be global.

```text
/ticket reply message:<optional string> attachment:<optional attachment>
/ticket open user:<required user> message:<optional string> attachment:<optional attachment>
/ticket close reason:<optional string>
/ticket close-after hours:<required number> reason:<optional string>
/ticket timer-cancel
/ticket timers
/ticket sync user:<required user>
/ticket info
```

Behavior details:

- `/ticket reply` must require at least one of `message` or `attachment`, even though both options are individually optional.
- `/ticket reply`, `close`, `close-after`, `timer-cancel`, and `info` must resolve the ticket from the current channel ID and reject use outside `mailCategory` or in `mailLogChannel`.
- `/ticket open` should reject duplicate queue mappings and verify that the selected user is still a member before attempting the initial DM.
- `/ticket sync` should make the repair explicit in the audit log and reject a channel or user already linked elsewhere.
- `close-after` should preserve the current 0.1-to-48-hour validation. Decide whether timers must survive restarts; currently they do not.
- `timers` should be ephemeral and either staff-wide or more tightly restricted because it exposes all active ticket channels.
- Defer interactions immediately when channel creation, DM delivery, attachment forwarding, OCR, or filesystem work could exceed Discord's initial response window.
- Return validation and permission failures ephemerally. Post durable operational results in the ticket/log channel as appropriate.
- Preserve the existing transcript-style embeds, attachment forwarding, mail log, author identity, queue persistence, and timer cancellation after a reply.
- Store ticket metadata directly (`userId`, `channelId`, creation time, state, opener, schema version) rather than relying on parsing the first message in channel history.

An optional persistent control message in every ticket can reduce slash-command use:

- **Reply** opens a modal for a text-only reply.
- **Close** opens a modal for an optional reason.
- **Close later** can offer common duration choices.
- Slash `/ticket reply` remains necessary for attachments, unless a separate upload flow is designed.

Buttons and modals are interactions and do not require Message Content. The user specifically asked not to assume every modmail action must be a slash command, so this hybrid is the recommended product direction.

#### Ticket user leaves the guild

Immediate voluntary-leave detection is lost with `GUILD_MEMBERS`; there is no equivalent unprivileged member-remove event. Replace it with lazy state checks:

- On `/ticket reply`, `/ticket info`, and timed close, fetch the single known member ID.
- If it returns not found, mark the ticket `member-left`, post one bot note, and decide whether replies should still be attempted through an already-open DM channel.
- Treat a 403/unknown-user DM failure as authoritative delivery failure and update the ticket state.
- Optionally run a slow reconciliation job over only IDs in the persisted ticket queue, using individual `Get Guild Member` requests. Do not list the guild member population.

This is less immediate than `guildMemberRemove`, but it removes the privileged dependency and is sufficient for ticket correctness.

### 3. Screenshot submission

Use a guild slash command as the primary path:

```text
/submit-profile screenshot:<required attachment>
```

Discord application commands support a typed `ATTACHMENT` option. See [Application Command Option Types](https://docs.discord.com/developers/interactions/application-commands#application-command-option-type).

Recommended behavior:

1. Restrict it to `serverID` and normally to `screenshotChannel` so existing server instructions still point to one place.
2. Immediately defer an ephemeral response because image conversion/OCR can take longer than the interaction acknowledgement window.
3. Take the user and member/role IDs from the interaction; fetch that one member by ID when a full member object is needed.
4. Validate MIME/type, image dimensions, and size using the resolved attachment before downloading or processing it.
5. Run the existing crop, OCR, blacklist, role assignment, badge, profile-channel, DM, log, and statistics behavior through a shared submission service.
6. Edit the ephemeral response with success, rejection, already-has-roles, blacklist, or manual-review status. Do not depend on reactions to a user message.
7. Post the original screenshot and structured result to `logsChannel` as today. Keep staff review buttons for off-by-one results, with staff authorization checked on click.
8. On OCR failure, give an explicit route to support, such as DMing the bot to open modmail.

The existing scanner accepts a Discord `Message` and relies on custom properties (`message.memb`), `message.attachments.first()`, `reply`, `react`, and `delete`. Do not fake an entire Message object for a slash interaction. Introduce a small transport-neutral submission context, for example:

```text
actorUser
guildId / channelId
member or known memberId
attachment
source: guild-slash | dm-message | manual-review
respondStatus(...)
```

Then keep OCR/role business logic independent of whether the source was a DM message or a slash interaction. This is the key refactor that avoids duplicating the risky role/blacklist logic.

#### What happens to ordinary screenshot uploads

After Message Content is disabled, an unmentioned guild upload has an empty attachment collection from the bot's perspective. The bot cannot reliably scan, warn about, or clean up that post.

Before cutover:

- update the screenshot channel topic, pinned instructions, help text, welcome/onboarding text, and bot startup message to say “use `/submit-profile`”;
- consider a channel layout that makes the command instruction prominent;
- train moderators that a raw upload is not a submission;
- do not promise automatic deletion of accidental uploads.

`deleteScreens` and message-reaction feedback have no direct meaning for slash submissions and should be deprecated or redefined. `msgDeleteTime` can still apply to ordinary bot notices, but ephemeral interaction responses do not need deletion.

Optional fallback: register a message context-menu action named **Submit profile screenshot**. Discord exposes the selected target message content under the context-command exception, so this can process a screenshot that was already uploaded. It is useful for mobile UX or moderator recovery, but `/submit-profile` should be implemented first because it prevents the mistaken raw upload and provides typed validation.

#### DM screenshots

DM attachment content remains available without the intent. The `dmScanning` path can remain, but route it through the same submission service as `/submit-profile`. There is an existing ambiguity between “scan this image” and “send this image to staff.” Before implementation, choose one:

- keep the current rule that DM images are scanned first and failures flow to modmail; or
- ask the user with buttons: **Scan profile** / **Send to staff**.

The second choice is clearer but changes the current UX, so it should be treated as a separate product decision rather than silently included in the intent migration.

## Replacing member-event features

| Current feature | Why it breaks | Recommended replacement |
| --- | --- | --- |
| Welcome DM on `guildMemberAdd` | The event requires `GUILD_MEMBERS` | Move guidance to Discord onboarding/server guide and `@Bot help`; optionally send guidance on the user's first `/submit-profile` interaction |
| Ticket leave alert on `guildMemberRemove` | The event requires `GUILD_MEMBERS` | Lazy ticket membership/delivery checks described above |
| Verified-role DM on `guildMemberUpdate` | The event requires `GUILD_MEMBERS` | Prefer an event from the verification system itself; otherwise use `GUILD_AUDIT_LOG_ENTRY_CREATE` with the non-privileged moderation intent and `VIEW_AUDIT_LOG`, filter `MEMBER_ROLE_UPDATE` for `verifiedRole`, then fetch the single target member |

Discord documents that member add/update/remove are tied to `GUILD_MEMBERS` in the [Gateway intent list](https://docs.discord.com/developers/events/gateway#list-of-intents). It also documents role changes as `MEMBER_ROLE_UPDATE` audit entries in the [Audit Log resource](https://docs.discord.com/developers/resources/audit-log#audit-log-entry-object). The audit-log alternative needs an integration test with the actual verifier/PokeNav action before relying on it. If it is not reliable, disable `respondVerify` rather than polling all members.

## Internal architecture changes needed later

These are future code changes, not changes made in this review.

### Interaction and command layer

- Upgrade to a supported `discord.js` release and a compatible Node LTS version.
- Add declarative command definitions and a repeatable registration/deployment script.
- Add one `interactionCreate` router for chat-input commands, buttons, selects, and modals.
- Split authorization, argument parsing, command execution, and response formatting.
- Use typed interaction options (`USER`, `ATTACHMENT`, `STRING`, `NUMBER`) instead of manually parsing IDs wherever possible.
- Retain a narrow `messageCreate` handler only for DMs and exact bot-mention commands.

### Shared business services

- Extract screenshot processing from `bot.js`/`handlers/images.js`/`commands/approve.js` into input-agnostic services.
- Extract ticket operations from Message-shaped inputs in `handlers/dm.js`: open, append user message, send staff reply, close, schedule close, cancel timer, sync, and lookup.
- Create response adapters for a guild mention, slash interaction, component/modal interaction, and DM message.
- Replace global/custom Message mutations such as `message.memb` with explicit parameters.
- Preserve idempotency: a retried interaction or double-click must not add/remove roles, create two tickets, or send duplicate DMs.

### Persistence

- Version the ticket queue file and persist structured records rather than `[userId, channelId]` pairs.
- Write queue/config files atomically so a crash cannot leave partial JSON.
- Persist scheduled close deadlines if timer survival across restarts is accepted as a requirement.
- Add interaction IDs or action IDs to logs for traceability.

### Configuration and documentation

Plan to retire or redefine:

- `prefix` and `prefix2` after the compatibility window;
- `dmAutoReply` (unsupported without Message Content);
- `welcomeMsg` if onboarding replaces it;
- `respondVerify` if no audit/integration event is reliable;
- `deleteScreens` for slash submissions;
- member-cache diagnostics in `cache.js`.

Add configuration for:

- developer/owner IDs permitted to run process commands;
- application ID and command deployment scope if not derivable from the client;
- optional feature flags for mention commands, `/ticket`, and `/submit-profile` during rollout;
- optional ticket control-message behavior and close presets.

Update README/setup material to remove the claim that Message Content and Server Members are required, document the new commands, and document only the actual bot/channel permissions still needed. Application commands also require the appropriate app-command installation scope.

## Implementation phases

### Phase 0 — Confirm product decisions

- Confirm the exact admin mention grammar.
- Confirm `/ticket` subcommands and whether text-only Reply/Close buttons with modals are desired.
- Confirm whether ordinary DM images are scanned automatically or prompt for Scan/Staff.
- Confirm whether the verified-role DM is required and whether `VIEW_AUDIT_LOG` is acceptable.
- Confirm whether timed closes must survive a process restart.
- Confirm whether screenshot submission must be limited to `screenshotChannel`.

### Phase 1 — Modernize the Discord boundary

- Upgrade Node/`discord.js` in isolation.
- Update renamed intent, partial, channel-type, embed, button, permission, and cache APIs.
- Keep behavior equivalent and run OCR/native dependency smoke tests (`canvas`, GraphicsMagick/ImageMagick, and Tesseract).
- Add a command registration script and register test commands to one development guild.

### Phase 2 — Introduce services and interaction adapters

- Extract ticket and screenshot services without removing the old entry points.
- Add authorization and structured audit logging shared by all adapters.
- Add interaction defer/follow-up/error handling.
- Add idempotency guards and component custom IDs that include or resolve durable ticket/review state.

### Phase 3 — Add new experiences

- Enable mention commands.
- Enable `/ticket` and optional ticket control components.
- Enable `/submit-profile` and optional context-menu fallback.
- Update all in-bot instructions and embeds.
- Run the new and old paths side by side only in a controlled test guild; ensure one submission cannot be processed by both.

### Phase 4 — Remove privileged dependencies

- Disable prefix parsing, passive guild screenshot scanning, and `dmAutoReply`.
- Remove `guildMemberAdd`, `guildMemberRemove`, and `guildMemberUpdate` listeners after their replacements are live.
- Remove `GUILD_MEMBERS` and any temporary `MESSAGE_CONTENT` intent from the client.
- Remove unused `DIRECT_MESSAGE_REACTIONS` after verification.
- Disable all privileged intent toggles in the Discord Developer Portal.
- Search the final tree for `message.content`, `attachments`, member cache/list calls, and member events; classify every remaining use as DM, mention exception, bot-authored content, interaction target, single-member REST fetch, or a bug.

### Phase 5 — Rollout and cleanup

- Deploy guild-scoped commands first and exercise them with real staff permissions.
- Announce a short migration window with screenshots of the new UX.
- Remove old command aliases/help text/config values after telemetry shows the new paths are stable.
- Promote commands to global only if this bot is intended for multiple guilds.
- Retain a rollback feature flag for interaction routing, but do not make privileged intents the long-term rollback strategy.

## Verification checklist

Test with all privileged toggles disabled in the Developer Portal and with no privileged flags in the Identify payload.

### Gateway and startup

- Bot connects without close code `4014`.
- Only intended standard intents are logged at startup.
- Configured guild, screenshot, profile, badge, log, mail-category, and mail-log channels resolve.
- Setting the bot's own presence/activity still works.

### Mention commands

- `@Bot help`, `ping`, and `version` work for a normal member.
- Every `@Bot admin ...` command denies an ordinary member and allows `modRole`/Administrator as designed.
- Process commands require the stronger allowlist and confirmation.
- A casual sentence that mentions the bot does not execute a command.
- A legacy `]command` or `=command` does nothing and no hidden content dependency exists.
- Mention commands work with both normal and nickname mention syntax.

### Screenshots

- Valid PNG/JPEG submission is acknowledged promptly, OCR'd once, logged, and given the right roles.
- Invalid type, missing dimensions, tiny image, oversized file, auto/manual blacklist, left member, and already-has-role cases match current policy.
- Levels below target, exactly target, level 40+, and the configured high-level role boundary are tested.
- Off-by-one review buttons allow only staff and cannot be used twice.
- Role hierarchy/`MANAGE_ROLES`, DMs disabled, profile channel unavailable, badge bot unavailable, and OCR failure produce controlled partial-failure logs.
- A raw unmentioned guild upload is documented as unsupported and is not falsely reported as scanned.
- DM screenshot behavior follows the Phase 0 decision.

### Modmail

- New natural DM opens a single ticket only after Send confirmation.
- Subsequent DM text, stickers, and attachments reach the correct channel and log.
- `/ticket reply` supports text-only, attachment-only, and combined replies; empty replies are rejected.
- Ordinary staff discussion is never forwarded.
- Open, close, close-after, cancel, list, info, and sync enforce guild/category/channel/staff restrictions.
- Replies cancel close timers as today.
- Duplicate ticket, stale channel, stale mapping, member left, DMs disabled, deleted channel, restart, and concurrent-action cases are safe.
- Ticket buttons/modals expire safely and re-check actor authorization.

### Member-intent removal

- No code assumes a complete member cache.
- Every arbitrary member lookup is a single known-ID fetch, not List/Search Guild Members.
- Role checks use the current interaction/message member or a fresh single-member result.
- Welcome guidance is discoverable without a join event.
- Ticket leave state is detected lazily.
- Verified-role notification is either proven through audit events/integration or explicitly disabled.

## Definition of done

The migration is complete only when:

- the bot runs in production with all Discord privileged intents disabled;
- there are no prefix-command or passive guild-message workflows advertised to users;
- every current command has an intentional destination or documented retirement;
- normal screenshot submission, manual review, role changes, blacklist behavior, modmail, logs, and staff controls pass the checklist;
- no security-sensitive component can be invoked by an unauthorized user;
- README, setup templates, config descriptions, and Discord channel instructions match the deployed UX;
- the rollback path does not require permanently re-enabling privileged intents.
