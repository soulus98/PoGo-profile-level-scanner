const { PermissionsBitField } = require("discord.js");
const { replyNoMention, dev } = require("../func/misc.js");

function isStaff(message) {
	return message.member && (
		message.member.roles.cache.has(ops.modRole)
		|| message.member.permissions.has(PermissionsBitField.Flags.Administrator)
		|| message.author.id == dev
	);
}

module.exports = {
	name: "help",
	description: "Displays profile submission help and staff mention commands.",
	aliases: ["command", "commands"],
	type: "Info",
	execute(message, args) {
		return new Promise((resolve) => {
			if (args[0] == "admin") {
				if (!isStaff(message)) {
					replyNoMention(message, "You are not allowed to view admin commands.");
					resolve();
					return;
				}
				replyNoMention(message, [
					"Staff mention commands:",
					"`@Bot c [user mention/ID] [level]` (`confirm` also works; user is optional in a modmail ticket)",
					"`@Bot revert <user mention/ID>`",
					"`@Bot admin config show`",
					"`@Bot admin config set <setting> <value>`",
					"`@Bot admin config toggle <setting>`",
					"`@Bot admin stats [statistic]`",
					"`@Bot admin diagnostics cache [scope]`",
					"`@Bot admin diagnostics memory`",
					"`@Bot admin scan confirm <user> [level]`",
					"`@Bot admin scan revert <user>`",
					"`@Bot admin scan clear-blacklist <user-id|all>`",
					"Owner only: `@Bot admin process restart|quit`",
					"Ticket actions: use `/ticket`.",
				].join("\n"));
				resolve();
				return;
			}
			replyNoMention(message, [
				"Hey trainer,",
				`Use \`/submit-profile\` in <#${ops.screenshotChannel}> and attach your full Pokémon GO trainer profile screenshot.`,
				`The bot will scan your level and apply the appropriate role when you meet level ${ops.targetLevel}.`,
				"If the scan fails or you need staff help, send me a normal DM to open a ticket.",
			].join("\n\n"));
			resolve();
		});
	},
};
