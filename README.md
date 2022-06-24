# POGOcr bot
My first attempt at making a Discord bot.
It does two main things:

1. Scans a Pokémon GO profile screenshot and adds a role based on the level
2. Handles staff mail tickets similar to other modmail bots

## Functions
There are multiple functions in this bot, you can disable certain ones by changing certain settings in your *config.json* file (more on that in setup).

#### 1. Pogo OCR
The purpose of this is to scan the user's profile screenshot, determine the user's level, and apply a role based on the level. (level 30+, 40+,and/or 50).  
You can then use said role(s) to gate certain channels so that only users that are that level and above have access.  

This functions by listening to a certain channel (`screenshotChannel`) in a certain server (`serverID`) and waiting for an image. (Therefore it requires [MESSAGE CONTENT INTENT](https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Privileged-Intent-for-Verified-Bots)).  
Once it receives an image, it uses node-gm to turn it monochrome based on a certain threshold (`threshold`), then crops it according to its ratio of its height to its width.  
The crop simply grabs the left side of the image, near the middle. (The exact crop values and different cases can be found in [func/rect.js](func/rect.js)).  
It passes that image to tesseract.js, which recognizes the text as `xx Level`.
The xx is parsed out, and is checked.  
If it is under `targetLevel` (default 30), the user is DMed a message explaining that there is a level limit. They are also added to a blacklist which expires in `blacklistTime`.  
It then forwards the image and info to `logsChannel`, so staff can keep an eye on things.  
If it is over 30, they are given a role (Which is intended to be the gate to the rest of the server).  
If it is over 40 or 50, they are given respective roles (That are intended to be vanity roles).  

#### 2. Staff Mail
A user can send a DM to the bot to open a new ticket. A staff member can also `]open` one themselves.   
Short messages (<10 characters) will throw an error response to avoid silly messages like "Hi".  
They will also need to click a ✔️ in a response embed before the ticket will be created, so that they know they are sending a message to the staff and not just a lifeless bot.
It also avoids any messages that start with certain bot command prefixes (`$`, `/`, `!`, `?`) and responds with an error. (Lots of people try things like `$verify` inside the staff mail bot)  
New tickets will open a new thread where staff can reply, close the ticket, or close it on a timer. You can also have internal conversations alongside the replies.
This system is integrated with the OCR section, allowing failed screenshots to be forwarded to staff and a couple other useful functions.

#### Other
It also welcomes people that join the server.  
The message that it sends (and all messages) can be customized in [configTemplate/messagetxt.js](configTemplate/messagetxt.js)

## Setup
First you will need [node 16 and npm 7](https://nodejs.org/en/download/current/) installed.
To add the bot to your own server, you will need to make a bot user and acquire its "Token".
* Go [here](https://discord.com/developers) to do that (use [this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html) if you need help).
* Download or clone the files in this repo.
* [first_setup.bat](first_setup.bat) should be run to create some files that are not included in the Github repo
* You must create a *server* folder and set it up correctly. Use [server_template](server_template) as a guide. Especially important is *config.json*
* run [Start_bot.bat](Start_bot.bat) to start the bot server

## Permissions and Intents
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
Only those with `modRole` are able to use commands.

## Settings
There are a number of settings that you can change with the bot using `]toggle` or `]set`. Some will need to be set before the bot starts (such as `serverID`), so you can set them manually in *config.json*.
Detailed information can be found by using `]show` or by looking at the [configDescriptions.json](configDescriptions.json) file

## Licence
Copyright (C) Soul Green - All Rights Reserved  
Unauthorized use of this code is prohibited without express permission

## Final words
I am an amateur developer. I am also stupid.  
If I've made any mistakes or if you encounter an error, feel free to correct me, yell at me, or make an issue in the issues tab.
You can find me on discord at soulus98#3935.  
However, there is a known error called "Error: Error: UNKNOWN: unknown error, open ./eng.traineddata". I have no idea what causes this but I am looking into it.
