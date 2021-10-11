# v2.0 (2021-Sep-30)
* Added a mail ticket handler for DM messages
* Added a DM scanning system for profile screenshots
* Integrated the two, so that failed screenshots are passed on to the mail section
* Added dmMail and dmScanning toggles to enable these features
* Added a Pokenav message deletion filter
* Added `]add` and `]remove` to add channels to the filter list
* Added "DM" to some error messages
* Made level 29 screenshots redirect to mail
* Added YPOBEI to the rescan word list

# v2.0.1 (2021-Oct-02)
* Removed a catastrophic filter issue where it would delete raid embeds!
* Added "User is on cooldown" to the Pokenav filter
* Fixed a problem with impossible deletions
* Added await to embedStart so we get them in order

# v2.0.2 (2021-Oct-03)
* Added a "Sticker #1:" section to embeds
* Fixed a double-message bug
* Added attachmentURLs toggle for seeing the "attachment #1: thingy"

# v2.0.3 (2021-Oct-04)
* Added a DM new ticket reaction trap
* Added user ID to the start of a ticket for ease of use on Android
* Failed images in DMs aren't SS logged
* Under level images in DMs aren't SS logged
* DM image scanning no longer adds reactions
* Fixed a typo to *actually* fix the double-message bug

# v2.0.4 (2021-Oct-07)
* Added `]presence` so we can check if the activity is working or not
* Added websocket listeners for the same reason
* Changed how presence is loaded to help troubleshoot the disappearance of it
* Made messagetxtReplace check first if a string contains "<"

# v2.0.5 (2021-Oct-09)
* Mail start embed now shows join time, account create time, and nitro time
* Added the user mention in the start of the mail ticket to make it even slightly easier on mobile users
* Fixed the banned/no DMs message that appears in the channel
* Added a ignored words filter that includes things such as "thanks" and "ok" which won't ask to start a new channel
* Mail now ignores `?` and `$`, to allow dyno and pokenav commands (it already ignored bots)
* Added Badge messages to the filter
* Fixed a dumbass mistake I introduced in `]add` and `]rem`
* Added time and date to websocket disconnect error logs
* Fixed time and date in logs from being off by one!

# v2.0.6 (2021-Oct-11)
* Added "Bot note" messages regarding the status of why the image was not scanned for mail purposes
* Also, whether the user was just scanned elsewhere, or if they have left/were banned from the server
* Allowed images posted after being blacklisted to be forwarded, with an aforementioned "Bot note"
* Changed embeds to Nickname instead of tag

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
