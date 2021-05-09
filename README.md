# ocrbot
My first attempt at making a Discord bot. It scans a Pokemon GO profile screenshot and adds a role based on the level.  
It functions by listening to a certain channel in a certain server and waiting for an image.  
Once it receives an image, using node-gm, it monochromes it based on a certain threshold, then crops it according to its ratio of its height to its width.  
The crop just grabs the left side of the image, near the middle. (The exact crop values and different cases can be found in [rect.js](rect.js))  
It passes that image to tesseract.js, which recognises the text as "XX Level.
The XX is parsed out, and is checked.  
If it is under 30, the user is dmed a message explaining that there is a level limit. They are also added to a blacklist which expires in a certain variable time.  
If it is over 30, they are given a role (Which is inteded to be the gate to the rest of the server).  
If it is over 40 or 50, they are given respective roles (That are intended to be vanity roles).  

## Setup
To add the bot to your own server, you will need to make a bot user and aquire its "Token".
* Go [here](https://discord.com/developers) to do that (use [this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html) if you need help).
* Download or clone the files in this repo.
* setup.bat should be run to create some files that are not included in the Github repo
* config.json should be created and formatted correctly (you can use configTemplate.json to see how it should be formatted. Change the server, channel, and role ids to match those on your server.)
* your bot Token (from earlier) should be added to keys/keys.json. 
* run start_bot.bat to start the bot server

This bot needs certain permissions to run properly, and something called "SERVER MEMBERS INTENT" to be able to welcome people.  
Here are the permissions required for the bot:  
* View (only applies to channels you intend to use it in)
* Manage Roles (Keep it above the level 30,40,50 roles, and under everything else, for security reasons)
* Add reactions (Used as feedback that things either worked or didn't)
* Send Messages
* Embed links (This isn't actually used yet, but it is a very tame perm and might be useful in the future)
* Attach files (Only necessary for testMode)
* Manage messages (For ]prune)
* Read Message History

## Commands
This bot has some commands intended to be used to change settings or to streamline the process of using the bot.
Command|Usage|Permitions
-------|-----|----------
]clear-blacklist [user-id]|Clears one or all users who are currently in the blacklist|Administrator
]help [command name]|Shows a list of all commands/Shows a welcome message explaining the system|Administrator/Other
]ping|Shows the latency of the bot server|Everyone
]prune <number>|Deletes a number of messages up to 99|Manage_Messages
]quit|Force closes the server|Administrator
]set <setting> <value>|Changes a setting|Administrator
]show-settings|Shows all current settings|Administrator
]toggle <setting>|Toggles a toggleable setting|Administrator

## Settings
Here are the settings that you can change. There are some different categories based on what type of data must be entered. The bot has no actual value checking so please be careful when changing these.
### Toggles:
Use `]toggle <setting>` to change these.
Setting|Function
-------|--------
saveLocalCopy|Saves a copy of the image & the cropped image to the server's personal computer. Probably good to turn this off or manually purge these images regularly to save space.
deleteScreens|Deletes user messages from the screenshot channel automatically. If you enable this, you can no longer hunt for spoofers, copyers and photoshoppers
welcomeMsg|Sends a "@mention welcome to the server. Please post your screenshot" message in the screenshot channel every time someone joins the server
testMode|Causes the bot to respond to each image with the cropped image and the final level result
### Sets:
Use `]set <setting> <value>` to change these.
#### Numbers:
Must be a number.
Setting|Function|Recommended value
-------|--------|-----------------
timeDelay|How long (in seconds) to wait before processing an image. This prevents frequent crashes (?!)|5 or more
threshold|This is a image-preprocessing technical number. It is the colour value at which gm converts a pixel to either black or white. The only reason it is included as a setting is because it is different on two different computers of mine. 228 on one and 58000 on another. If the image is preprocessed as fully black or fully white, try changing this value.|228 or 58000
msgDeleteTime|The time (in seconds) until certain messages self-destruct. ATM it only applies to the crash-error message. Leave as 0 to disable this|30 or 0 i guess
blacklistTime|the time (in hours) to blacklist someone who has posted a screenshot under level 30. This should hopefully prevent people from immediately bypassing the bot|24 or more

#### Characters:
Must be a string of characters. I had intended to have more of these. Perhaps in the future I could add the ability to change the wording of DM messages.
Setting|Function
-------|--------
prefix|The bot command prefix for your server

#### Roles:
These must be snowflakes. i.e a number of a certain length
Setting|Function
-------|--------
level30Role|The "Success" role. Intended to be the gate to the rest of the server
level40Role|The level 40 role. Intended to be a vanity role
level50Role|The level 50 role. Intended to be a vanity role
modRole|The moderator role that gets tagged when a screenshot fails
serverID|The ID for your server, I have already pre-set this to 423803939582902277 (pokemon go raids) so that it doesn't immediately leave when you add it. lol
screenshotChannel|The ID for the channel to be scanned for screenshots 

serverID and screenshotChannel should probably be set before launching the bot. It might freak out otherwise.

## Licence
Copyleft all wrongs reserved
You can copy, host, modify and redistribute this freely, but you can not use the result for commercial purposes, and must also distribute all derivatives with the same licence.  
You might recognise this as similar to Creative Commons CC-SA-NC.  
Attribution is not required.

## Final words
I am an amateur developer. I am also stupid.  
If I've made any mistakes or if you encounter an error, feel free to correct me, yell at me, or make an issue in the issues tab. 
You can find me on discord at soulus98#3935.  
However, there is a known error called "Error: Error: UNKNOWN: unknown error, open ./eng.traineddata". I have no idea what causes this but I am looking into it.

