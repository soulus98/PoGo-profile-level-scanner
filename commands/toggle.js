const fs = require("fs"),
			{ loadConfigs } = require("../bot.js"),
			{ replyNoMention } = require("../func/misc.js"),
			path = require("path");

module.exports = {
	name: "toggle-setting",
	description: `Used to toggle bot settings. Currently toggles settings for all instances of the bot, as there is only one intended instance. Use \`${ops.prefix}show-options\` to see all current settings.`,
  aliases: ["toggle", "tog"],
  usage: `\`${ops.prefix}toggle <setting>\``,
  args: true,
	guildOnly:true,
	type:"Admin",
	execute(message, args) {
		let config = {};
		delete require.cache[require.resolve("../server/config.json")];
		config = require("../server/config.json");
		return new Promise(function(resolve) {
			if (args.length != 1){
				message.reply(`You must supply only one argument in the form \`${ops.prefix}toggle [setting-name]\``);
				resolve(", but it failed, as there were no arguments provided.");
				return;
			}
			try {
				const toggles = config.toggles;
				if (toggles[args[0]] === undefined){
					message.reply(`Sorry, but ${args[0]} is not a valid setting. Use \`${ops.prefix}show\` to see a list of all settings. (case-sensitive)`);
					resolve(` but it failed, as ${args} is not a valid setting.`);
					return;
				}
				const was = toggles[args[0]];
				toggles[args[0]] = !toggles[args[0]];
				config.toggles = toggles;
				const jsonString = JSON.stringify(config);
				fs.writeFile(path.resolve(__dirname, "../server/config.json"), jsonString, err => {
					if (err) {
						message.reply("An unexpected error occured when editing the config file.");
						resolve(`, but an unexpected write error occured. Error: ${err}.`);
						return;
					} else {
						replyNoMention(message, `"${args}" was successfully toggled from \`${was.toString().replace("true", "ON").replace("false", "OFF")}\` to \`${toggles[args[0]].toString().replace("true", "ON").replace("false", "OFF")}\`.`);
						resolve(` and successfully toggled "${args}" from ${was} to ${toggles[args[0]]}.`);
						loadConfigs();
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
