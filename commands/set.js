config = require("../config.json");
const prefix = config.chars.prefix;
const fs = require("fs");
const bot = require("../bot.js");

module.exports = {
	name: "modify-setting",
	description: `Used to change the value of certain settings. Currently toggles settings for all instances of the bot, as there is only one intended instance. Use \`${prefix}show-options\` to see all current settings.`,
  aliases: ["set", "modify"],
  usage: `\`${prefix}set [setting] [value]\``,
  cooldown: 5,
	guildOnly:true,
	permissions: "ADMINISTRATOR",
	execute(message, args) {
		if (args.length != 2){
			message.reply(`You must supply two arguments in the form \`${prefix}set [setting-name] [value]\``);
			return `, but it failed, as there were an incorrect amount of arguments`;
		}
		try{
			fs.readFile("config.json", (err, raw) => {
				configs =JSON.parse(raw);
				numbers = configs.numbers;
				chars = configs.chars;
				ids = configs.ids;
				if (numbers[args[0]] === undefined && chars[args[0]] === undefined && ids[args[0]] === undefined){
					message.reply(`Sorry, but ${args[0]} is not a valid setting. Use \`${prefix}show-settings\` to see a list of all settings.`);
					console.log(`But it failed, as ${args[0]} is not a valid setting.`);
					return;
				}
				if(numbers[args[0]]){
					value = parseInt(args[1]);
					if(isNaN(value)) {
						message.reply(`You must supply a number for ${args[0]}.`);
						console.log(`But it failed, as ${args[0]} requires a number, and ${args[1]} isn't one.`);
						return;
					}
					was = numbers[args[0]];
					numbers[args[0]] = value;
					to = numbers[args[0]];
				} else if(chars[args[0]]){
					if(typeof(args[1]) != "string") {
						message.reply(`You must supply a text string for ${args[0]}.`);
						console.log(`But it failed, as ${args[0]} requires a string, and ${args[1]} isn't one.`);
						return;
					}
					was = chars[args[0]];
					chars[args[0]] = args[1];
					to = chars[args[0]];
				} else if(ids[args[0]]){
					if(args[1].length < 17 || args[1].length > 19) {
						message.reply(`You must supply a valid discord ID for ${args[0]}.`);
						console.log(`But it failed, as ${args[0]} requires a discord ID, and ${args[1]} isn't one.`);
						return;
					}
					was = ids[args[0]];
					ids[args[0]] = args[1];
					to = ids[args[0]];
				}
				const jsonString = JSON.stringify(configs);
				fs.writeFile("./config.json",jsonString, err => {
					if (err) {
						message.reply(`An unexpected error occured when editing the config file.`);
						console.log(`But an unexpected write error occured. Error: ${err}`);
						return;
					} else {
						message.channel.send(`"${args[0]}" was successfully changed from \`${was}\` to \`${to}\`.\n Please verify that this is the correct value, as I have no value checking system (yet).`);
						console.log(`and successfully changed "${args[0]}" from ${was} to ${to}.`);
						bot.loadConfigs();
						return;
					}
				})
			})
		} catch (err){
			message.reply(`An unexpected error occured.`);
			return `, but an unexpected error occured. Error: ${err}`;
		}
	},
};
