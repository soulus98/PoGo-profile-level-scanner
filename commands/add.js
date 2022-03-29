const { addCleanupChannel } = require("../func/filter.js"),
			{ dateToTime } = require("../func/misc.js"),
			groupList = ["raid", "badge", "pvpiv"];

module.exports = {
	name: "add-cleanup-channel",
	description: `Adds a channel to the list that is watched for Pokenav cleanup. \`Group\` must be one of: \`${groupList.join("`, `")}\` for specific filtering. Run in the intended channel or include a [channel id/tag] if you run it from an admin channel.`,
  aliases: ["add"],
  usage: `\`${ops.prefix}add <group> [channel id/tag]\``,
	guildOnly:true,
	args: true,
	type:"Pokenav Cleanup",
	execute(message, args) {
		message.react("👀");
		return new Promise(function(resolve) {
			const group = args[0].toLowerCase();
			if (!groupList.includes(group)) {
				message.reply(`Please specifiy which \`group\` of cleanup you want to add the channel from: \`${groupList.join("`, `")}\``);
				return;
			}
			let id = 0;
			if (args[1]) {
				id = args[1];
				if (args[1].startsWith("<#") && args[1].endsWith(">")) {
					id = args[1].slice(2, -1);
				}
			} else {
				id = message.channel.id;
			}
			message.guild.channels.fetch(id).then((ch) => {
				addCleanupChannel(id, group).then(() => {
					setTimeout(() => {
						message.delete().catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
							message.react("👍");
						});
					}, 1000);
					resolve(`, and added ${ch.name}#${id} to the Pokenav ${group} cleanup list.`);
					return;
				}).catch(() => {
					message.reply(`${(args[1]) ? "That" : "This"} channel is already included in the ${group} cleanup list.`);
					resolve(`, but it failed, since ${ch.name}#${id} was already included in the ${group} cleanup list.`);
					return;
				});
			}).catch(() => {
				message.reply("There may be a typo, or some other issue, which causes me to not be able to find this channel.");
				resolve(`, but it failed, since I couldn't find a channel with ID: #${id}.`);
				return;
			});
		});
	},
};
