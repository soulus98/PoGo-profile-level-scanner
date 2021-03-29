config = require("../config.json");
const prefix = config.chars.prefix;
const fs = require("fs");
const bot = require("../bot.js");

module.exports = {
	name: "modify-setting",
	description: "Used to change ",
  aliases: ["set", "modify"],
  usage: `\`${prefix}set [setting-name] [value]\``,
  cooldown: 5,
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
				if (numbers[args[0]] === undefined && chars[args[0]] === undefined){
					message.reply(`Sorry, but ${args[0]} is not a valid setting. Use \`${prefix}help set\` and \`${prefix}help toggle\` to see a list of all settings.`);
					console.log(`But it failed, as ${args[0]} is not a valid setting.`);
					return;
				}
				if(numbers[args[0]]){
					if(isNaN(args[1])) {
						message.reply(`You must supply a number for ${args[0]}.`);
						console.log(`But it failed, as ${args[0]} requires a number, and ${args[1]} isn't.`);
						return;
					}
					was = numbers[args[0]];
					numbers[args[0]] = args[1];
					to = numbers[args[0]];
				}
				else if(chars[args[0]]){
					if(typeof(args[1]) != "string") {
						message.reply(`You must supply a text string for ${args[0]}.`);
						console.log(`But it failed, as ${args[0]} requires a string, and ${args[1]} isn't.`);
						return;
					}
					was = chars[args[0]];
					chars[args[0]] = args[1];
					to = chars[args[0]];
				}
				const jsonString = JSON.stringify(configs);
				fs.writeFile("./config.json",jsonString, err => {
					if (err) {
						message.reply(`An unexpected error occured when editing the config file.`);
						console.log(`But an unexpected write error occured. Error: ${err}`);
						return;
					} else {
						message.channel.send(`"${args[0]}" was successfully changed from ${was} to ${to}.\n Please verify that this is the correct value, as I have no value checking system (yet).`);
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
