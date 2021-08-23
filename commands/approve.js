const {saveStats} = require("../func/saveStats.js");
const {dateToTime} = require("../func/dateToTime.js")
const {saveBlacklist} = require("../func/saveBlacklist.js");

module.exports = {
	name: "confirm",
	description: "Manually approve/reject a user by telling the bot the user's level. \`level\` can be omitted, the bot will still approve.",
  aliases: ["c","con"],
  usage: `\`${prefix}c <@mention/ID> [level]\``,
	guildOnly:true,
  args: true,
	permissions: "MANAGE_ROLES",
	execute(input, args) {
		return new Promise(function(bigResolve) {
			execTime = dateToTime(new Date());
			let prom = new Promise(function(resolve, reject) {
				if (input[1] == undefined) {
					inCommand = true;
					message = input;
					mentions = message.mentions.users;
					if (mentions.size > 1) {
						message.lineReply("Sorry, but I cannot confirm more than one user at a time.");
						bigResolve(`, but it failed, since they tagged two people in the command.`);
						return;
					}
					image = message.attachments.first();
					logimg = false;
					level = args[1] || "missing";
					if (args[0].startsWith("<@") && args[0].endsWith(">")) {
						id = args[0].slice(2,-1);
						if (id.startsWith("!")){
							id = id.slice(1);
						}
					} else {
						id = args[0];
					}
					server.members.fetch(id).then((memb)=>{
						resolve(memb);
					}).catch((err)=>{
						if (err.name == "DiscordAPIError"){
							if (mentions.size == 1) {
								memb = mentions.first();
								if (memb === undefined){
									message.lineReply("I could not find this member, they may have left the server.");
									bigResolve(`, but it failed, since I couldn't fetch member ${id}`);
									return;
								} else {
									server.members.fetch(memb.id).then((mem)=>{
										resolve(mem);
										return;
									}).catch((err)=>{
										message.lineReply("I could not find this member for an exceptionally unexpected reason. Tell the developer please.");
										console.error(`[${execTime}]: Error: An (exceptionally!) unexpected error occured when trying to fetch ${id}. Err:${err}`);
										bigResolve(`, but it failed, due to an unexpected error when trying to fetch ${id}.`);
										return;
									});
								}
							} else {
								message.lineReply("There may be a typo, or some other issue, which causes me to not be able to find this member.");
								bigResolve(`, but it failed, due to a typo or some other issue. Id: ${id}.`);
								return;
							}
						} else {
							message.lineReply("I could not find this member for an unexpected reason. Tell the developer please.");
							console.error(`[${execTime}]: Error: An unexpected error occured when trying to fetch ${id}.  Err:${err}`);
							bigResolve(`, but it failed, due to an unexpected error when trying to fetch ${id}.`);
							return;
						}
					});

					//id, level
				} else {
					inCommand = false;
					message = input[0];
					image = message.attachments.first();
					logimg = input[1];
					id = args[0];
					level = args[1];
					server = message.guild;
					resolve(message.member);
				}
			});

			//member leaves midway === null
			//role id === undefined
			//any other mistype === undefined
			return prom.then(function(member) {
				const msgDeleteTime = config.numbers.msgDeleteTime*1000;
				if (member === null){
					console.error(`[${execTime}]: Error: #${id} left the server before they could be processed.`);
					if (inCommand) {
						message.lineReply("That member has just left the server, and can not be processed.");
						bigResolve(`, but it failed, since the member, #${id}, left the server before they could be processed.`);
					} else {
						logimg.edit(`User: ${message.author}\nLeft the server. No roles added.`,image);
					}
					return;
				} else if (member === undefined) { //this should not be accessable unless using a command
					if (!inCommand) console.error(`[${execTime}]: Error: member is undefined without being in a command. Impossible error? Tell Soul pls`);
					message.lineReply("This member may have left the server. If not, then there is a typo, or some other issue, which causes me to not be able to find them.");
					bigResolve(`, but it failed, due to a typo or some other issue. (This might be an impossible error...? not sure) Id: ${id}`);
					return;
				}
				if (inCommand) var logggString = ` and tagged ${member.user.username}${member.user}`;
				if (!(level == "missing") && (isNaN(level) || level >50 || level <1)){
					console.error(`[${execTime}]: Error: Level - ${level} - is NaN, >50, or <1 despite being checked already... Impossible error? Tell Soul pls`);
					bigResolve((logggString||"") + `, but it failed, due to an impossible error regarding level checking.`);
					return;
				}
				const msgtxt = [];
				const give30 = (level>29||level=="missing")?true:false; //dave, change this to "level>39" to work on elite raids.
																																//This, ]set level40 0, and any message changes are all you should need to do
				const give40 = (level>39)?true:false;
				const give50 = (level==50)?true:false;
				let given30 = given40 = given50 = false;
				if (!give30) {
					if(member.roles.cache.has(level30Role)){
						if (!inCommand) {
							member.send(`I'll be honest, this is weird.
Why would you send a screenshot of an account under level when you already have the role that means you are above the gate level...???
I am honestly curious as to why, so please shoot me a dm at <@146186496448135168>. It is soulus#3935 if that tag doesn't work.`);
						}	else {
							message.lineReply(`Ya silly, they already have Remote Raids. You probably want \`${prefix}revert\`. That or you did a typo.`);
						}
						bigResolve((logggString||"") + ", but it failed, since that member already has RR, so they could not be rejected.");
						return;
					}
					if (!inCommand && !deleteScreens && !message.deleted) message.react("👎").catch(()=>{
						console.error(`[${execTime}]: Error: Could not react 👎 (thumbsdown) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					if (inCommand && !message.deleted) message.react("👍").catch(()=>{
						console.error(`[${execTime}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
					});
					// dave, under 30 message in dm
					member.send(`Hey ${member}!
Thank you so much for your interest in joining our raid server.
Unfortunately we have a level requirement of 30 to gain full access, and your screenshot was scanned at ${level}.
Gaining xp is very easy to do now with friendships, events, lucky eggs and so much more! Please stay and hang out with us here.
You can use <#733418314222534826> to connect with other trainers and get the xp you need to hit level 30!
Once you've reached that point, please repost your screenshot, or message <@575252669443211264> if you have to be let in manually.

In the meantime please join our sister server with this link.
Hope to raid with you soon! :slight_smile:
https://discord.gg/bTJxQNKJH2`).catch(() => {
					 console.error(`[${execTime}]: Error: Could not send DM to ${member.user.username}${member}`);
					});
					blacklist.set(id,Date.now());
					saveBlacklist();
					bigResolve((logggString||"") + `. They were added to the blacklist for ${config.numbers.blacklistTime} day${(config.numbers.blacklistTime==1)?"":"s"} for an image scanned at ${level}`);
					if (!inCommand) {
						logimg.edit(`User: ${member}\nResult: \`${level}\`\nBlacklisted for ${config.numbers.blacklistTime} day${(config.numbers.blacklistTime==1)?"":"s"}`,image);
					}
					if (inCommand) deleteStuff(message);
					saveStats(level);
					return;
				} else {
					g30 = new Promise(function(resolve) {
						if(member.roles.cache.has(level30Role)){ //dave, over 30 msg in dm
							if(inCommand){
								resolve(false);
							} else {
								msgtxt.push("You already have the Remote Raids role");
								resolve(false);
							}
						} else { //dave, over 30 msg in PYS
							channel.send(`Hey, ${member}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in <#740262255584739391>. The bot will then ask for your Trainer Code, so have it ready.`).then(msg => {
								setTimeout(()=>{
									msg.delete().catch(()=>{
										console.error(`[${execTime}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
									});
								},msgDeleteTime);
							});
							setTimeout(()=>{
								member.roles.add(server.roles.cache.get(level30Role)).catch(console.error);
							},250);
							resolve(true);
							setTimeout(()=>{ //dave, over 30 msg in profile-setup
								profile.send(`Hey, ${member}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in this channel. The bot will then ask for your Trainer Code, so have it ready.

 • Extra commands such as \`$team <team-name>\` and \`$level 35\` are pinned and posted in this channel. Just ask if you can't find them.

 • Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>.

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
							}, 3000);
							//dave, over 30 msg in dms
							msgtxt.push(`Hey, ${member}. Welcome to the server. :partying_face:

 • Start by typing \`$verify\` in <#740262255584739391>. The bot will then ask for your Trainer Code, so have it ready.

 • Extra commands such as \`$team <team-name>\` and \`$level <no>\` are pinned in that channel. Just ask if you can't find them.

 • Instructions for joining and hosting raids are over at <#733418554283655250>. Please also be familiar with the rules in <#747656566559473715>

Feel free to ask any questions you have over in <#733706705560666275>.
Have fun raiding. :wave:`);
						}
					}).then((given30)=>{
						g40 = new Promise((resolve) => {
							if (give40) {
								if (!(level40Role == "0")) {
									if (!member.roles.cache.has(level40Role)) {
										member.roles.add(server.roles.cache.get(level40Role)).catch(console.error);
										resolve(true);
									} else {
										resolve(false);
									}
								} else {
									resolve(false);
								}
							} else {
								resolve(false);
							}
						});
						g50 = new Promise((resolve) => {
							if (give50) {
								if (!(level50Role == "0")) {
									if (!member.roles.cache.has(level50Role)) {
										member.roles.add(server.roles.cache.get(level50Role)).catch(console.error);
										resolve(true);
									} else {
										resolve(false);
									}
								} else {
									resolve(false);
								}
							} else {
								resolve(false);
							}
						});
						Promise.all([g40, g50]).then((vals) => {
							given40 = vals[0];
							given50 = vals[1];
							if ((given30 || given40 || given50)){
								member.send(msgtxt.join(""), {split:true}).catch((err) => {
									console.error(err);
									console.error(`[${execTime}]: Error: Could not send DM to ${member.user.username}${member.user}`);
								});
								if ((!deleteScreens || inCommand) && !message.deleted) message.react("👍").catch(()=>{
									console.error(`[${execTime}]: Error: Could not react 👍 (thumbsup) to message: ${message.url}\nContent of mesage: "${message.content}"`);
								});
							}
							if (!(given30 || given40 || given50) && !message.deleted && inCommand) {
								message.react("🤷").catch(()=>{
									console.error(`[${execTime}]: Error: Could not react 🤷 (person_shrugging) to message: ${message.url}\nContent of mesage: "${message.content}"`);
								});
								message.lineReply("That person already had the roles you asked me to give them. Check the command or the user and try again.").then((msg) =>{
									setTimeout(()=>{
										if (msgDeleteTime){
											msg.delete().catch(()=>{
												console.error(`[${execTime}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
											});
										}
									}, msgDeleteTime);
								});
							}
							if (given40 || given50) msgtxt.push(`${!(given30)?", however,":"\nAlso,"} we congratulate you on achieving such a high level.\nFor this you have been given the ${(given40)?"\"Level 40\" ":""}${(given50)?(given40)?"and the \"Level 50\" ":"\"Level 50\" ":""}vanity role${(given40 && given50)?"s":""}`);
							if (!inCommand){
								if (!given30 && !given40 && !given50){
									logimg.edit(`User: ${message.author}\nResult: \`${level}\`\nRoles: RR possessed. None added.`, image);
								}
								else {
									if (logimg) logimg.edit(`User: ${member}\nResult: \`${level}\`\nRoles given: ${(given30?"RR":"")}${(given40?`${given30?", ":""}Level 40`:"")}${(given50?`${given30||given40?", ":""}Level 50`:"")}`, image);
								}
							}
							saveStats(level);
							bigResolve((logggString||"") + `. They were given ${(!given30 && !given40 && !given50)?"no roles":""}${(given30?"RR":"")}${(given40?`${given30?", ":""}Level 40`:"")}${(given50?`${given30||given40?", ":""}Level 50`:"")} ${(!inCommand)?`for an image scanned at ${level}`:""}`);
							if (inCommand) deleteStuff(message);
						});
					});
				}
			});
		});
	},
};

function deleteStuff(message){
	const msgDeleteTime = config.numbers.msgDeleteTime*1000;
	if (!message.deleted && msgDeleteTime){
		setTimeout(function () {
			message.delete().catch(()=>{
				console.error(`[${execTime}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
		}, msgDeleteTime);
	}
	channel.messages.fetch({limit:10}).then(msgs => {
		selfMsgs = msgs.filter(msg =>
			((msg.author == message.client.user) && (msg.mentions.members.has(id)) && !msg.pinned && msg.content.slice(0,4) != "Hey,") //bot messages
			 || ((msg.author.id == id) && !msg.pinned)); //member messages
		channel.bulkDelete(selfMsgs).catch((err)=>{
			console.error(`[${execTime}]: Error: Could not bulk delete messages: ${selfMsgs}. Error message: ${err}`);
		});
	});
}
