# POGOcr bot
My first attempt at making a Discord bot.
It does three main things:

1. Scans a Pokémon GO profile screenshot and adds a role based on the level
2. Handles staff mail tickets similar to other modmail bots
3. Cleans up certain Pokénav messages in selected raid channels

## Functions
There are multiple functions in this bot, you can disable certain ones by changing certain settings mentioned in the Settings section.  

#### 1. Pogo OCR
The purpose of this is to scan the user's profile screenshot, determine the user's level, and apply a role based on the level. (level 30+, 40+, 50).  
You can then use said role(s) to gate certain channels so that only users that are that level and above have access.  

This functions by listening to a certain channel (`screenshotChannel`) in a certain server (`serverID`) and waiting for an image. (Therefore it requires [MESSAGE CONTENT INTENT](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-for-Verified-Bots)).  
Once it receives an image, using node-gm, it monochromes it based on a certain threshold (`threshold`), then crops it according to its ratio of its height to its width.  
The crop just grabs the left side of the image, near the middle. (The exact crop values and different cases can be found in [func/rect.js](func/rect.js)).  
It passes that image to tesseract.js, which recognizes the text as `XX Level`.
The XX is parsed out, and is checked.  
If it is under 30 (editable by changing `targetLevel`), the user is DMed a message explaining that there is a level limit. They are also added to a blacklist which expires in a certain variable time.  
It then forwards the image and info to `logsChannel`, so staff can keep an eye on things.  
If it is over 30, they are given a role (Which is intended to be the gate to the rest of the server).  
If it is over 40 or 50, they are given respective roles (That are intended to be vanity roles).  

#### 2. Staff Mail
A user can send a DM to the bot to open a new ticket. A staff member can also `]open` one themselves.   
Short messages (<10 characters) will throw an error response to avoid silly messages like "Hi".  
They will also need to click a ✔️ in a response embed before the ticket will be created, so that they know they are sending a message to the staff and not just a lifeless bot.
It also avoids any messages that start with certain bot command prefixes (`$`, `/`, `!`, `?`) and responds with an error. (Lots of people try things like `$verify` inside the staff mail bot)  
New tickets will open a new thread where staff can reply, close the ticket, or close it on a timer. You can also have internal conversations alongside the replies.

#### 3. Pokénav Filtering
You can add a channel to the filter list using `]add`, and the bot will delete any message from Pokénav that is a response to a user from a command that is considered *spam*  
An example is `$sub uxie`. Pokénav will respond with something like `You are now subscribed to Uxie`, but this clogs up the raid channel.  
You get Dyno or something similar to delete the `$sub` message and you use my bot to delete the Pokénav response.  
A full list of cases that it will filter can be found and changed in [func/filter.js](func/filter.js)

#### Other
It also welcomes people that join the server.  
The message that it sends (and all messages) can be customized in [configTemplate/messagetxt.js](configTemplate/messagetxt.js)

## Setup
To add the bot to your own server, you will need to make a bot user and acquire its "Token".
* Go [here](https://discord.com/developers) to do that (use [this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html) if you need help).
* Download or clone the files in this repo.
* [first_setup.bat](first_setup.bat) should be run to create some files that are not included in the Github repo
* The [server/](server/) folder should be created and set up correctly. use serverTemplate as a guide.
* run [Start_bot.bat](Start_bot.bat) to start the bot server

This bot needs certain permissions and privileged intents to run properly.  
It needs MESSAGE CONTENT INTENT to process images, commands, and mail messages.  
It needs SERVER MEMBERS INTENT to be able to welcome people.  
Both of them can be enabled in your bot settings in the [discord developers page](https://discord.com/developers). [Here](https://gist.github.com/advaith1/e69bcc1cdd6d0087322734451f15aa2f) is an explanation and guide.  
Here are the permissions required for the bot:  
* View (only applies to channels you intend to use it in)
* Manage Roles (Order this bot above the level 30, 40,and 50 roles, and under everything else)
* Add reactions (Used as feedback that things either worked or didn't)
* Send Messages
* Embed links (This isn't actually used yet, but it is a very tame perm and might be useful in the future)
* Attach files
* Manage messages
* Read Message History

## Commands
This bot has some commands intended to be used to change settings or to streamline the process of using the bot.  
Please use `]help [command]` for more info including aliases.  
Unless otherwise specified, all commands can only be used if the user using the command can view the `logsChannel` channel. It seemed like the easiest way to gate staff members.

#### OCR
|Usage|Description|
|-----|-----------|
|`]confirm <@mention/ID> [level]`|Use this to manually approve or reject a user.|
|`]revert <@mention/ID>`|Will remove Level 30, 40, 50, and Verified roles from a user, add them to the blacklist and yell at them in DMs|
|`]clear-blacklist <user-id/"all">`|Clears one or all users who are currently in the blacklist|

#### Mail
The following must be used inside of a mail ticket:

|Usage|Description|
|-----|-----------|
|`]reply <message>`|Sends a mail message to a user. Can be circumvented by toggling `dmAutoReply` to true (and using a blank `]`(`prefix` or `prefix2`) for internal messages)|
|`]open <id/tag>`|Opens a new mail ticket with a user. Can also be used in the `mailLogChannel`|
|`]close [reason]`|Closes a mail ticket|
|`]tclose <hours> [reason]`|Closes a mail ticket after a certain time. New replies will cancel the timer.|
|`]sync <id/tag>`|Sometimes, if there is a technical issue, the bot will forget that a certain mail channel is linked to a certain user. Use this command in that channel to resync them.|

#### Filtering
Both of these commands can be used without specifying a channel within the channel you wish to action (ex: `]add`), or in an admin channel with the `[id/tag]` variable.

|Usage|Description|
|-----|-----------|
|`]add [id/tag]`| Adds the channel to the Pokénav filter list|
|`]remove [id/tag]`| Removes the channel from the Pokénav filter list|

#### Other
|Usage|Description|
|-----|-----------|
|`]help [command name]`|Shows a list of all commands or shows a welcome message explaining the system if the member is not staff|
|`]ping`|Shows the latency of the bot. **Usable by everyone**|
|`]quit`|Force closes the bot|
|`]restart`|Force restarts the bot. Note: these two commands can malfunction based on your process manager.|
|`]set <setting> <value>`|Changes a setting|
|`]show-settings`|Shows all current settings|
|`]toggle <setting>`|Toggles a toggleable setting|
|`]stats [statistic]`|Shows the statistics (or a specific statistic) of the bot|
|`]ver`|Tech info: Responds with the current version of the bot|
|`]check-memory-usage`|Tech info: Responds with the current node process memory usage info|
|`]heapdump-snapshot`|Tech info: Takes a heapdump snapshot and saves it in /server|

## Settings
Here are the settings that you can change. There are some different categories based on what type of data must be entered. The bot has no actual value checking so please be careful when changing these.
### Toggles:
Use `]toggle <setting>` to change these.

|Setting|Function|
|-------|--------|
|saveLocalCopy|Causes each image that is scanned in `screenshotChannel` to be saved to the server storage, sorted by date|
|deleteScreens|Deletes the image from `screenshotChannel` after processing it|
|welcomeMsg|Whether or not to automatically send a welcome message via DM to new members explaining the screenshot system|
|blacklistOneOff|Whether to blacklist off-by-one screenshots e.g. level 29. Turning this off allows them to repost immediately|
|tagModOneOff|Whether to tag `modRole` in `logsChannel` when a off-by-one screenshot is posted, e.g. level 29|
|screenshotScanning|Whether to be aware of the `screenshotChannel` and scan images in that channel|
|dmScanning|Whether to scan images in DMs or not|
|dmMail|Whether to forward DMs to `mailCategory` or not|
|attachmentURLs|Whether to add `Attachment #1: <URL>` to the mail embed when sending images|
|testMode|Provides more information about what is scanned and whatnot|
|performanceMode|Provides more information (in the console) about exectution time and whatnot|
|debugMode|Whether to log the discord.js debug information. **INCLUDING TOKEN!** Don't screenshot or share console logs if this is on.|
|processInfoMode|Whether to log the Node JS process information|
|dmAutoReply|Whether mail tickets will circumvent needing a `]r ` or `]reply ` at the start of the message to successfully send|
|respondVerify|Whether to send a message in `profileChannel` every time someone successfully verifies through pokenav|
|dmSymbolDenial|Whether to correct people who try to use `$`, `?`, `!`, or `/` in DMs (mainly to avoid `$verify`))|

### Sets:
Use `]set <setting> <value>` to change these.
#### Numbers:
Must be a number.

|Setting|Function|Recommended value|
|-------|--------|-----------------|
|threshold|This is a technical variable. It is the color level at which all values above will be white and all below with be black when monochroming an image. Normally this would be hardcoded but different machines are different for some reason.|228 or 58000|
|msgDeleteTime|How long (in seconds) error/help messages stick around before self destructing. Set to 0 to disable.|5|
|blacklistTime|How long (in days) to prevent someone from posting a screenshot after being scanned at under 30.|24|
|targetLevel|The level for the gate role.|30|

#### Characters:
Must be a string of characters.

|Setting|Function|
|-------|--------|
|prefix|Bot prefix for server commands|
|prefix2|Another prefix if you want it. There is no difference between the two|

#### Ids:
These must be snowflakes. i.e a string of numbers of a certain length

|Setting|Function|
|-------|--------|
|screenshotChannel|The channel to scan for screenshots|
|logsChannel|The channel where the logs are posted. Leave blank for no logs|
|profileChannel|The channel where the user is tagged afterwards. Leave blank for no tag|
|targetLevelRole|The role for successful scans at targetLevel. e.g. level 30+|
|level40Role|The role for level 40+ screenshots|
|level50Role|The role for level 50+ screenshots|
|modRole|The mod role intended to be notified when an issue occurs|
|serverID|The server that the bot is intended to be used in|
|blacklistRole|The role used to force the bot to ignore certain members. Leave blank to stop the bot from checking|
|verifiedRole|The Verfied role (from Pokénav), if you want `]re` to remove it|
|mailCategory|The category to create mail channels|
|mailLogChannel|The log channel for the mail section of the bot)|

serverID and screenshotChannel should probably be set before launching the bot.  
It probably will freak out otherwise.

## Licence
Copyright (C) Soul Green - All Rights Reserved  
Unauthorized use of this code is prohibited without express permission

## Final words
I am an amateur developer. I am also stupid.  
If I've made any mistakes or if you encounter an error, feel free to correct me, yell at me, or make an issue in the issues tab.
You can find me on discord at soulus98#3935.  
However, there is a known error called "Error: Error: UNKNOWN: unknown error, open ./eng.traineddata". I have no idea what causes this but I am looking into it.
