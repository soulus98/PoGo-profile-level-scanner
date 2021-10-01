const { addFilterChannel } = require("../func/filter.js");

module.exports = {
	name: "add-filter-channel",
	description: "Adds a channel to the list that is watched for Pokenav filtering. Run in the intended channel or include a [channel id/tag] if you run it from an admin channel.",
  aliases: ["add"],
  usage: `\`${ops.prefix}add [channel id/tag]\``,
	guildOnly:true,
	execute(message, args) {
		message.react("👀");
		return new Promise(function(resolve) {
			let id = 0;
			if (args[0]) {
				id = args[0];
				if (args[0].startsWith("<#") && args[0].endsWith(">")) {
					id = args[0].slice(2, -1);
				}
			} else {
				id = message.channel.id;
			}
			message.guild.channels.fetch(id).then((ch) => {
				addFilterChannel(id).then(() => {
					if (!message.deleted) {
						setTimeout(() => {
							message.delete();
						}, 1000);
					}
					resolve(`, and added ${ch}#${id} to the Pokenav filter list.`);
					return;
				}).catch(() => {
					message.reply(`${(args[0]) ? "That" : "This"} channel is already included in the filter list.`);
					resolve(", but it failed, since that channel was already included in the list.");
					return;
				});
			}).catch(() => {
				message.reply("There may be a typo, or some other issue, which causes me to not be able to find this channel.");
				resolve(", but it failed, since I couldn't find the channel.");
				return;
			});
		});
	},
};