# v1.8-pre (2021-Sep-30)
* WIP: Potentially huge optimization regarding processing multiple images at once
* Desynced and reworked logImg for a potential 100% speed increase
* Added performanceMode and removed timeDelay configs. Config files have to be updated to match. See configTemplate for an example
* Added performanceMode to tell you (in logs) exactly how long each task takes when processing
* Added a "Total processing time" section to the logs for all images
* ]r now reacts and self-deletes
* ]c and ]r now check arguments before parsing
* ]stats now accepts an argument for viewing a specific stat
* ]stats now tells you how long the bot has been continuously running via "]stats days"
##### Under-the-hood
* Optimized by only requesting https once, using inbuilt image.width and image.height
* Mod: saveStats and loadStats into stats.js, crop.js, and saveBuff.js
* Cleaned up a ton of global variables
* Installed a linter and cleaned up some code based on the rules in ".eslintrc.json"
* A few silly bug fixes
This pre-release is likely not suitable for a live release


# v1.7 (2021-Aug-16)
* Added ]confirm (aka ]c). Use ]c <id> [level-under-30] to reject someone
* Added ]revert (aka ]r).
* Moved all the approval code to commands/approve.js, so ]a actually functions exactly the same as when an image has been scanned
* Fixed up most command's console logs so they are one-liners by promisifying all commands

There are likely bugs in this release.

#### v1.7.1 (2021-Aug-16)
* Fetch member instead of getting from cache
* A typo in the delete logic

#### v1.7.2 (2021-Aug-19)
* Reactions and deletions for ]c under30
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
* Readded the welcomeMsg as a dm
* Removed the welcomeMsg console message, as it was very annoying
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
* Start of modularization updates (aka "Mod:"). I moved the command handler to "handlers/commands.js" and dateToTime() to "fun/dateToTime.js"

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
* Added ]stats and analytics
* Added date to the logs
* Added ]ver for checking the version number
* Added a "message.author" tag in the dm messages
* Added emoji (and names) in the "React failed" error messages  
* Bot no longer yells at you for images in the wrong channel

Stats.json will be: created automatically by the bot, saved every image, and loaded on launch.
So far tracked are: Attempts; Declined from scanning due to •Blacklist, •Left the server before processing, •Has all 3 roles already; Fails, and Under 30s.  
The declined images aren't scanned, so they shouldn't be included when calculating a success rate.  
The rest of the successes are sorted by level, so you can see a distribution.  
Maybe one day I can make ]stats show a graph 😂

#### v1.4.1 (2021-Aug-3)
* Removed an accidental testing console log

#### v1.4.2 (2021-Aug-3)
* Changed up how ]stats works so that it is more accurate.

I honestly don't understand how stats.js references the stats collection, but it works, so oh well.



# v1.3
Fixed a few bugs:
* Fixed the blacklist and ]cbl  
* Made the blacklist clear old accounts every 50 images  
* Made it post in logsChannel if an image was declined due to blacklist
* Renamed ]quit to ]restart and reworked ]quit
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
* Added manage_guild to ]set, ]tog, ]show, ]quit
* Fixed the config.json ]set issue (I think)
* Reworded bot messages for joining, leaving, and quitting
* Added time to the logs
* Made a logs channel (requires a new setting, logsChannel)
* Added/fixed "And it was delayed for x seconds" in logs
* Fixed a tiny oversight in ]prune
* Made the joining, leaving, and quitting messages sometimes get auto-deleted (based on msg time or if they are within the last 20 msg when joining)

#### v1.1.1
* Fixed #37
* Added a profile channel for tags afterwards
* Reworded a few things

#### v1.1.2
* Added a 2 second delay to the profileChannel message
* Added a check for a member having no roles
* Added a check for members having dms turned off
