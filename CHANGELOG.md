# v2.6 (2021-Jun-08)
* Split out the PokeNav filtering bot to https://github.com/soulus98/Pokenav-mini-helper. This allows both bots to work better for specific purposes
* Added a `strictCache` option for memory saving
* Added logs for `]c` and `]r` usage
* Added buttons to the level 29ers
* Added buttons to the DM trap

#### v2.6.1
* Fixed a bug involving double mail channels.
* A couple more small bugs

# v2.5 (2021-Jun-14)
* Added a PokeNav badge granting system. The bot will post `$gb` and `$rb` with specified badge IDs in a specified channel when granting roles.
* Added `badgeChannel`, `targetLevelBadge`, `level40Badge`, and `level50Badge` settings. Set them to 0 for no action

#### v2.5.1 (2022-Jun-15)
* Fixed a couple bugs in the cleanup section

# v2.4 (2021-Mar-31)
* Renamed the PokeNav filter to "cleanup", as that makes more sense and helps be with organisation
* Updated cleanup to work with slash commands, and made 3 groups: `raid`, `badge`, and `pvpiv`.
* Added a mandatory `group` argument to the `]add` and `]rem` commands. `]rem` can have `all` as the group to easily remove it from all 3 groups

The filter is now very greedy, so, for example, the raid group will delete *anything* that isn't a remote raid. Error messages and all. If something seems wrong, temporarily `]remove` the channel from the group and try again. I am personally a little bit weary of `pvpiv`... it might be a bit broken

#### v2.4.1 (2022-Jun-14)
* Changed command usage access to **modRole** rather than access to see **logsChannel**.

# v2.3 (2021-Jan-12)
* Added `]tclose` (timed-close). Use it to set an amount of hours (0.1-48) to close the ticket after. It will cancel itself on a new reply being sent or received. Use `]tclose cancel` to cancel a timer and `]tclose list` to list all active timers. The list is only informational, the actual work is done using a simple setTimeout so it is very unstable. i.e. will disappear on a bot restart
* Removed some always active variables (the guild and 4 channels) to save memory. Hopefully DJS cleaners work well to fix the rest

#### v2.3.1 (2021-Jan-??)
* Added a check for images over 8MB/50MB
* Some small backend changes

#### v2.3.2 (2021-Feb-16)
* Updated README and cleaned up some setup stuff
* Should now be a normal setup for first-timers
* Hotfixes:  and a bug in ]cbl

#### v2.3.3 (2021-Feb-19)
* `]tc` alias for `]tclose`
* Changed :eyes: to 👍 in `]tclose`
* Fixed a bug that broke `]cbl`


# v2.2 (2021-Dec-13)
* Reworked the bot so that it can run without **screenshotChannel**, **logsChannel**, and **profileChannel** being set. **serverID** is still important, obviously.
* Made certain commands not load on bot start if **screenshotScanning** or **dmMail** is set to false
* Added a **screenshotScanning** toggle
* Added **prefix2** and consolidated the commands. Now any command will work with either prefix. Leave it unset or the same as **prefix** to have everything the same
* Added **dmSymbolDenial** toggle for the `$`, `?` etc messages in DMs
* Added **processInfoMode** for monitoring the process memory usage
* Added `]sync` so we can fix the dead channels if ever they happen again
* Secured the bot so that we can emoji hoard
* Changed the order in which things are handled, now it first checks prefix, then goes to scan images. i.e. it won't scan an image if the message starts with the prefix. This is necessary to send images in `]reply`
* Added more to the *first setup.bat* files

#### v2.2.1 (2021-Dec-16)
* Added `]heapdump-snapshot` aka `]hs` so we can further monitor the memory usage. This requires `npm install heapdump` which in turn may require a newer version of Visual Studio (with some dev c++ thingy)...? 🤷
* Changed `]c` to screenshot-logs perms, so we can remove manage roles from mods

#### v2.2.2 (2021-Dec-16)
hotfix:
* Fixed a mail issue caused by **dmSymbolDenial**
* Fixed an issue in **prefix2** caused by a typo

# v2.1 (2021-Oct-21)
* Added a `$verify` responder that works in any channel that the bot can see that *isn't* being filtered.
* Added **respondVerify** as a toggle and a messagetxt.js entry
* Updated the description in the embedStart
* Removed the quarter second delay and make it a `.then()` promise from the embedStart message
* Added await to checkDateFolder so it doesn't error when making a new date folder
* Removed some silly files that weren't neccesary: `pogo.traineddata`, `pogo_old.traineddata`, `./misc_and_unused`

#### v2.1 (2021-Oct-??)
* Changed the wording in successDM so that it can deal with ]c with missing level

#### v2.1.1 (2021-Nov-??)
* I literally forgot... will fix later

#### v2.1.2 (2021-Nov-28)
* Fixed a bug where `=open` could overwrite an existing channel

# v2.0 (2021-Sep-30)
* Added a mail ticket handler for DM messages
* Added a DM scanning system for profile screenshots
* Integrated the two, so that failed screenshots are passed on to the mail section
* Added **dmMail** and **dmScanning** toggles to enable these features
* Added a PokeNav message deletion filter
* Added `]add` and `]remove` to add channels to the filter list
* Added "DM" to some error messages
* Made level 29 screenshots redirect to mail
* Added YPOBEI to the rescan word list

#### v2.0.1 (2021-Oct-02)
* Removed a catastrophic filter issue where it would delete raid embeds!
* Added "User is on cooldown" to the PokeNav filter
* Fixed a problem with impossible deletions
* Added await to embedStart so we get them in order

#### v2.0.2 (2021-Oct-03)
* Added a "Sticker #1:" section to embeds
* Fixed a double-message bug
* Added attachmentURLs toggle for seeing the "attachment #1: thingy"

#### v2.0.3 (2021-Oct-04)
* Added a DM new ticket reaction trap
* Added user ID to the start of a ticket for ease of use on Android
* Failed images in DMs aren't SS logged
* Under level images in DMs aren't SS logged
* DM image scanning no longer adds reactions
* Fixed a typo to *actually* fix the double-message bug

#### v2.0.4 (2021-Oct-07)
* Added `]presence` so we can check if the activity is working or not
* Added websocket listeners for the same reason
* Changed how presence is loaded to help troubleshoot the disappearance of it
* Made messagetxtReplace check first if a string contains "<"

#### v2.0.5 (2021-Oct-09)
* Mail start embed now shows join time, account create time, and nitro time
* Added the user mention in the start of the mail ticket to make it even slightly easier on mobile users
* Fixed the banned/no DMs message that appears in the channel
* Added a ignored words filter that includes things such as "thanks" and "ok" which won't ask to start a new channel
* Mail now ignores `?` and `$`, to allow dyno and PokeNav commands (it already ignored bots)
* Added Badge messages to the filter
* Fixed a dumbass mistake I introduced in `]add` and `]rem`
* Added time and date to websocket disconnect error logs
* Fixed time and date in logs from being off by one!

#### v2.0.6 (2021-Oct-11)
* Added "Bot note" messages regarding the status of why the image was not scanned for mail purposes
* Also, whether the user was just scanned elsewhere, or if they have left/were banned from the server
* Allowed images posted after being blacklisted to be forwarded, with an aforementioned "Bot note"
* Added a 10 character minimum for dm mail tickets. Should stop silly messages and stickers
* Changed embeds to Nickname instead of tag
* Changed 👍 👎 to ✅ ❌ in the dm trap
* Made `]cbl` safer by making `]cbl all` the all case rather than no argument

#### v2.0.7 (2021-Oct-13)
* `]c` and `]r` now don't auto-delete in mailCategory
* Fixed `=close` not working when someone leaves
* Fixed a weird "status switch" error

#### v2.0.8 (2021-Oct-14)
* Fixed a bug in the dm trap that caused some messages to appear to send but not actually create a channel. Hopefully there aren't too many people waiting for a response... lol.
* Added debugMode toggle to make the console log all the discord.js debug info (INCLUDING YOUR TOKEN, so please don't post logs if you have debugMode on... lol)

#### v2.0.9 (2021-Oct-16)
* Added a `=r` command for replying in a mail ticket
* Added a dmAutoReply toggle to return to the old functionality
* Added a quarter second delay to the first message of a ticket. Even though I await it, sometimes they still aren't in order


# v1.8 (2021-Sep-10)
* Desynced and reworked **logImg** for a potential 100% speed increase
* Added configurable message text in ./server/messagetxt.js
* Added **targetLevel** setting, which allows for easy gate level modification
* Added **blacklistOneOff** toggle, which, if set to false/off, will stop the level 29 images from being blacklisted. This allows them to quickly level up and repost
* Added **tagModOneOff** toggle, which, if set to true/on, will tag moderator in the logs channel every time a level 29
* Added **performanceMode** toggle to tell you (in logs) exactly how long each task takes when processing
* Renamed **level30Role** to **targetLevelRole**
* In regards to the above, config files have to be updated to match. See configTemplate for an example
* Added a "Total processing time" section to the logs for all images
* `]r` now reacts and self-deletes
* `]r` now removes verifiedRole, if it is set
* `]c` and `]r` now check arguments before parsing
* `]stats` now accepts an argument for viewing a specific stat
* `]stats` now tells you how long the bot has been continuously running via `]stats days`
##### Under-the-hood
* Optimized by only requesting https once, using inbuilt image.width and image.height
* Mod: saveStats and loadStats into stats.js, crop.js, and saveBuff.js
* Cleaned up a ton of global variables
* Installed a linter and cleaned up some code based on the rules in ".eslintrc.json"
* Fixed a few silly bug fixes

I had originally intended to make an optimization regarding multiple screenshot processing, but it seems to be unnecessary  
This release probably needs either some testing or monitoring for a bit, a lot of stuff moved around.

#### v1.8.1 (2021-Sep-19)
* Updated to discord.js v13, use `npm update` to make your local copy match
* This also deprecated "discord-reply". Run `npm uninstall discord-reply` if you want to save space I guess
* Split `]show` into multiple embeds
* Shortened the log message
* Made the bot disconnect and join messages get deleted more often
* Made blacklist a global variable
* Formatted changelog.md a little

#### v1.8.2 (2021-Sep-17)
* Added a recrop-retry functionality for certain failed images. Should make a slight increase in success rate
* Fell back to eng.traineddata instead of pogo.traineddata temporarily
* Added a "wrong-file" case for huge files over 15MB, to save bandwidth
* Fixed an ubuntu path resolve issue
* Mod: recog.js

#### v1.8.3 (2021-Sep-18)
* Fixed more ubuntu path stuff. I use node-path now so should work on any OS

#### v1.8.4 (2021-Sep-18)
* Added failed message to messagetxt
* Fixed blacklist logs issue
* Removed some big unnecessary traineddata files

#### v1.8.5 (2021-Sep-20)
* Changed command checking to be based on access to logsChannel if the command does not have permissions specified.
* Added more cases for recrop-retry




# v1.7 (2021-Aug-16)
* Added `]confirm` (aka `]c`). Use `]c <id> [level-under-30]` to reject someone
* Added `]revert` (aka `]r`).
* Moved all the approval code to commands/approve.js, so `]c` actually functions exactly the same as when an image has been scanned
* Fixed up most command's console logs so they are one-liners by promisifying all commands

There are likely bugs in this release.

#### v1.7.1 (2021-Aug-16)
* Fetch member instead of getting from cache
* A typo in the delete logic

#### v1.7.2 (2021-Aug-19)
* Reactions and deletions for `]c` under 30
* Made mentions work better and cleaned up id code
* Added an autoresponder for dm messages
* Better wording for undefined message
* Response message for if someone already had roles

#### v1.7.3 (2021-Aug-20)
* Fixed a typo in approve and revert. I blame discord.js for resolving "@!146247095815372800>" as an id.
* Fixed a case issue in "saveBlacklist.js". Should now always use camelCase.

#### v1.7.4 (2021-Aug-20)
* Added a message reply for uncaught "Entity too large" error. Perhaps 9mB?
* Removed an unnecessary tag in the failed image message



# v1.6 (2021-Aug-6)
* Readded the **welcomeMsg** as a dm
* Removed the **welcomeMsg** console message, as it was very annoying
* Added a filetype filter. Now only jpeg, png, jfif, tiff, and bmp are supported.
* Removed the infinite folder glitch (no.38)
* Added how many images are currently being processed to the delay log
* Caught a few more error messages

#### v1.6.1 (2021-Aug-8)
* Added a check for tiny and non-existent images. They are classed as "Wrong Filetype" for the purposes of stats.

#### v1.6.2 (2021-Aug-9)
* Now references package.json for ver number
* Added new server link to dm message



# v1.5 (2021-Aug-5)
* Changed the logs posting to a url rather than a whole image, to stop the bot from triple-handling the image. Should increase performance significantly.
* Changed the amount of info that is dumped during the "Stream equals empty buffer" error. I suspect this error just means the server failed to retain the image information due to overloading.

#### v1.5.1 (2021-Aug-5)
* Start of modularization updates (aka "Mod:"). I moved the command handler to "handlers/commands.js" and **dateToTime()** to "fun/dateToTime.js"

#### v1.5.1.1 (2021-Aug-5)
* Updated a vulnerable package

#### v1.5.1.2 (2021-Aug-5)
* Removed a test message I left in

#### v1.5.2 (2021-Aug-5)
* Fixed an issue in the command handler
* I had to remove the per-author cooldowns on commands. Shouldn't be a problem.

#### v1.5.3 (2021-Aug-5)
* Reverted 1.5... urls don't work... That optimisation is basically impossible



# v1.4 (2021-Aug-2)
* Added `]stats` and analytics
* Added date to the logs
* Added `]ver` for checking the version number
* Added a "message.author" tag in the dm messages
* Added emoji (and names) in the "React failed" error messages  
* Bot no longer yells at you for images in the wrong channel

Stats.json will be: created automatically by the bot, saved every image, and loaded on launch.
So far tracked are:
- Attempts;
- Declined from scanning due to:
  - Blacklist
  - Left the server before processing
  - Has all 3 roles already
- Fails
- Under 30s.

The declined images aren't scanned, so they shouldn't be included when calculating a success rate.  
The rest of the successes are sorted by level, so you can see a distribution.  
Maybe one day I can make `]stats` show a graph 😂

#### v1.4.1 (2021-Aug-3)
* Removed an accidental testing console log

#### v1.4.2 (2021-Aug-3)
* Changed up how `]stats` works so that it is more accurate.

I honestly don't understand how stats.js references the stats collection, but it works, so oh well.



# v1.3
Fixed a few bugs:
* Fixed the blacklist and `]cbl`
* Made the blacklist clear old accounts every 50 images  
* Made it post in **logsChannel** if an image was declined due to blacklist
* Renamed `]quit` to `]restart` and reworked `]quit`
* Added a check for a result of 00, treating it as an error
* Removed "New Member added" message and welcome message
* Added a modmail tag to fail dm and blacklist dm
* All round better error checking
* Properly delayed the profile Channel tag by 3 seconds

#### v1.3.1
* Added an infodump for if the empty buffer issue reoccurs

#### v1.3.2
* Emergency fix to a new bug in the logs channel process

#### v1.3.3 (2021-Aug-2)
* Fixed the blacklist (again) and added a check for an empty blacklist.json file
* Changed the check to every 30 messages, since it will now not fire for failed or blacklisted images.

The blacklist.json file should now be created (at launch and every 30) if it doesn't already exist, so feel free to delete it if it breaks again (?!) and gets too big.



# v1.1
* Added manage_guild to `]set`, `]tog`, `]show`, `]quit`
* Fixed the config.json ]set issue (I think)
* Reworded bot messages for joining, leaving, and quitting
* Added time to the logs
* Made a logs channel (requires a new setting, **logsChannel**)
* Added/fixed "And it was delayed for x seconds" in logs
* Fixed a tiny oversight in `]prune`
* Made the joining, leaving, and quitting messages sometimes get auto-deleted (based on msg time or if they are within the last 20 msg when joining)

#### v1.1.1
* Fixed #37
* Added a profile channel for tags afterwards
* Reworded a few things

#### v1.1.2
* Added a 2 second delay to the **profileChannel** message
* Added a check for a member having no roles
* Added a check for members having dms turned off
