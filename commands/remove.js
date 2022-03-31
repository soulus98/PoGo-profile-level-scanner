const { removeCleanupChannel } = require("../func/filter.js"),
			{ dateToTime, groupList } = require("../func/misc.js");

module.exports = {
	name: "remove-cleanup-channel",
	description: `Removes a channel from the list that is watched for Pokenav cleanup. \`Group\` must be one of: \`${groupList.join("`, `")}\` or \`all\` to remove it from every group. Run in the intended channel or include a [channel id/tag] if you run it from an admin channel.`,
  aliases: ["remove", "rem"],
  usage: `\`${ops.prefix}remove <group> [channel id/tag]\``,
	guildOnly:true,
	args:true,
	type:"Pokenav Cleanup",
	execute(message, args) {
		message.react("👀");
		return new Promise(function(resolve) {
			const group = args[0].toLowerCase();
			if (!groupList.includes(group) && group != "all") {
				message.reply(`Please specifiy which \`group\` of cleanup you want to remove the channel from out of: \`${groupList.join("`, `")}\`, or \`all\``);
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
				removeCleanupChannel(id, group).then(() => {
					setTimeout(() => {
						message.delete().catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
						});
					}, 1000);
					resolve(`, and removed ${ch.name}#${id} from the Pokenav ${group} cleanup list.`);
				}).catch(() => {
					message.reply(`${(args[1]) ? "That" : "This"} channel was not found in ${(group == "all") ? "any " : `the ${group}`}cleanup list.`);
					resolve(`, but it failed, since ${ch.name}#${id} was not found in the ${group} cleanup list.`);
				});
			}).catch(() => {
				message.reply("There may be a typo, or some other issue, which causes me to not be able to find this channel.");
				resolve(`, but it failed, since I couldn't find a channel with ID: #${id}.`);
				return;
			});
		});
	},
};
