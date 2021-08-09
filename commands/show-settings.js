config = require("../server/config.json");
const configDesc = require("../configDescriptions.json");
prefix = config.chars.prefix;
const Discord = require("discord.js");


module.exports = {
	name: "show-settings",
	description: "Shows all settings for the current (and only) instance of the bot",
  aliases: ["settings","options","opts","show"],
  usage: `${prefix}settings`,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message, args) {
		//config = {};
	  //delete require.cache[require.resolve("./server/config.json")];
		//config = require("./server/config.json");
		prefix = config.chars.prefix;
		const embed = new Discord.MessageEmbed()
		.setTitle("Settings")
		.setDescription("These are the settings that apply to (every/the only) instance of the bot.");
		for (const cat in config){
			embed.addFields(
				{ name: "\u200B", value: "----------------------------------------------"},
				{ name: `**${cat.charAt(0).toUpperCase() + cat.slice(1)}:**`, value: `*${configDesc[cat]["self"].replace("{prefix}",prefix)}*`},
				);
			for (const key in config[cat]){
				embed.addField(`${key}: *${configDesc[cat][key]}*`,`\`${config[cat][key].toString().replace("true","ON").replace("false","OFF")}\``);
				//data.push(`${key}: \`${config[cat][key]}\`   ${configDesc[cat][key]}`);
			}
		}
		message.channel.send(embed);
	},
};
