const configDesc = require("../configDescriptions.json");
const Discord = require("discord.js");

module.exports = {
	name: "show-settings",
	description: "Shows all settings for the current (and only) instance of the bot",
  aliases: ["settings", "options", "opts", "show"],
  usage: `${ops.prefix}settings`,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message) {
		let config = {};
		delete require.cache[require.resolve("../server/config.json")];
		config = require("../server/config.json");
		const embArr = [
			new Discord.MessageEmbed()
			.setTitle("Settings")
			.setDescription("These are the settings that apply to (every/the only) instance of the bot.")];
		return new Promise(function(resolve) {
			for (const cat in config){
				const embed = new Discord.MessageEmbed()
				.setTitle(`${cat.charAt(0).toUpperCase() + cat.slice(1)}:`)
				.setDescription(`*${configDesc[cat]["self"].replace("{ops.prefix}", ops.prefix)}*`)
				;
				for (const key in config[cat]){
					embed.addField(`${key}: *${configDesc[cat][key]}*`, `\`${config[cat][key].toString().replace("true", "ON").replace("false", "OFF")}\``);
					// data.push(`${key}: \`${config[cat][key]}\`   ${configDesc[cat][key]}`);
				}
				embArr.push(embed);
				console.log(Object.keys(config).length);
			}
			message.channel.send({ embeds: embArr }).then(() => {
				resolve();
			}).catch((err) => {
				console.error(`An error occured when sending setting. Error: ${err}`);
			});
		});
	},
};
