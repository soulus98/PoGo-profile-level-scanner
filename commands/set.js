const fs = require("fs"),
			bot = require("../bot.js"),
			{ replyNoMention } = require("../func/misc.js"),
			path = require("path");

module.exports = {
	name: "modify-setting",
	description: `Used to change the value of certain settings. Currently toggles settings for all instances of the bot, as there is only one intended instance. Use \`${ops.prefix}show-options\` to see all current settings.`,
  aliases: ["set", "modify"],
  usage: `\`${ops.prefix}set <setting> <value>\``,
	guildOnly:true,
	args:true,
	type:"Admin",
	execute(message, args) {
		let config = {};
		delete require.cache[require.resolve("../server/config.json")];
		config = require("../server/config.json");
		return new Promise(function(resolve) {
			if (args.length != 2){
				message.reply(`You must supply two arguments in the form \`${ops.prefix}set [setting-name] [value]\``);
				resolve(`, but it failed, as there were an incorrect amount of arguments: ${args}.`);
				return;
			}
			try {
				const numbers = config.numbers;
				const chars = config.chars;
				const ids = config.ids;
				if (numbers[args[0]] === undefined && chars[args[0]] === undefined && ids[args[0]] === undefined){
					message.reply(`Sorry, but ${args[0]} is not a valid setting. Use \`${ops.prefix}show\` to see a list of all settings. (case-sensitive)`);
					resolve(`, but it failed, as ${args[0]} is not a valid setting.`);
					return;
				}
				let was,
						to;
				if (numbers[args[0]] != undefined){
					const value = parseInt(args[1]);
					if (isNaN(value)) {
						message.reply(`You must supply a number for ${args[0]}.`);
						resolve(`, but it failed, as ${args[0]} requires a number, and ${args[1]} isn't one.`);
						return;
					}
					was = numbers[args[0]];
					numbers[args[0]] = value;
					to = numbers[args[0]];
				} else if (chars[args[0]] != undefined){
					if (typeof (args[1]) != "string") {
						message.reply(`You must supply a text string for ${args[0]}.`);
						resolve(`, but it failed, as ${args[0]} requires a string, and ${args[1]} isn't one.`);
						return;
					}
					was = chars[args[0]];
					chars[args[0]] = args[1];
					to = chars[args[0]];
				} else if (ids[args[0]] != undefined){
					if ((args[1].length < 17 || args[1].length > 19) && (!(args[1] == 0))) {
						message.reply(`You must supply a valid discord ID for ${args[0]}.`);
						resolve(`, but it failed, as ${args[0]} requires a discord ID, and ${args[1]} isn't one.`);
						return;
					}
					was = ids[args[0]];
					ids[args[0]] = args[1];
					to = ids[args[0]];
				} else {
					console.error("Impossible error in set command. One group wasn't undefined but then they all were...?");
					console.error("numbers[args[0]]:", numbers[args[0]]);
					console.error("chars[args[0]]:", chars[args[0]]);
					console.error("ids[args[0]]:", ids[args[0]]);
					message.reply("I similtaneously could & couldn't find that setting. Yes I know that makes no sense. Please tell Soul");
					return;
				}
				const jsonString = JSON.stringify(config);
				fs.writeFile(path.resolve(__dirname, "../server/config.json"), jsonString, err => {
					if (err) {
						message.reply("An unexpected error occured when editing the config file.");
						resolve(`, but an unexpected write error occured. Error: ${err}.`);
						return;
					} else {
						replyNoMention(message, `"${args[0]}" was successfully changed from \`${was}\` to \`${to}\`.\n Please verify that this is the correct value, as I have no value checking system (yet).`);
						bot.loadConfigs();
						resolve(`, and successfully changed "${args[0]}" from ${was} to ${to}.`);
						return;
					}
				});
			} catch (err){
				message.reply("An unexpected error occured.");
				resolve(`, but an unexpected error occured. Error: ${err}.`);
				return;
			}
		});
	},
};
