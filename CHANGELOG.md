### v1.3.3
* Fixed the blacklist (again) and added a check for an empty blacklist.json file
* Changed the check to every 30 messages, since it will now not fire for failed or blacklisted images.
The blacklist.json file should now be created (at launch and every 30) if it doesn't already exist, so feel free to delete it if it breaks again (?!) and gets too big.



### v1.3.2
* Emergency fix to a new bug in the logs channel process



### v1.3.1
* Added an infodump for if the empty buffer issue reoccurs



## v1.3  
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




### v1.1.2
* Added a 2 second delay to the profileChannel message
* Added a check for a member having no roles
* Added a check for members having dms turned off




### v1.1.1
* Fixed #37
* Added a profile channel for tags afterwards
* Reworded a few things




## v1.1
* Added manage_guild to ]set, ]tog, ]show, ]quit
* Fixed the config.json ]set issue (I think)
* Reworded bot messages for joining, leaving, and quitting
* Added time to the logs
* Made a logs channel (requires a new setting, logsChannel)
* Added/fixed "And it was delayed for x seconds" in logs
* Fixed a tiny oversight in ]prune
* Made the joining, leaving, and quitting messages sometimes get auto-deleted (based on msg time or if they are within the last 20 msg when joining)
