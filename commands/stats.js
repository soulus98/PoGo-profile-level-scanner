let stats = {};
const launchDate = Date.now(),
			{ replyNoMention } = require("../func/misc.js");

module.exports = {
	name: "statistics",
	description: "Show the current stats for the bot. Add a `statistic` to find that specific stat.",
  aliases: ["stats", "stat", "analytics", "analytic", "anals"],
  usage: `\`${ops.prefix}stats [statistic]\``,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message, args) {
		return new Promise((resolve) => {
			if (args[0]){
				if (stats.get(args[0])){
					replyNoMention(message, `The value of \`${args[0]}\` is \`${stats.get(args[0])}\``);
				} else if (args[0] == "Successes") {
					const fails = stats.get("Fails");
					const trueAttempts = stats.get("Attempts") - stats.get("Declined-Blacklist") - stats.get("Declined-Left-Server") - stats.get("Declined-All-Roles") - stats.get("Declined-Wrong-Type");
					const successes = trueAttempts - fails;
					replyNoMention(message, `The value of \`Successes\` is ${successes}`);
				} else if (args[0] == "Failure-Rate") {
					const fails = stats.get("Fails");
					const trueAttempts = stats.get("Attempts") - stats.get("Declined-Blacklist") - stats.get("Declined-Left-Server") - stats.get("Declined-All-Roles") - stats.get("Declined-Wrong-Type");
					replyNoMention(message, `The value of \`Failure-Rate\` is ${(fails / trueAttempts * 100).toFixed(2)}%`);
				} else if (args[0] == "Days") {
					replyNoMention(message, `Bot has been running for ${((Date.now() - launchDate) / 86400000).toFixed(1)} days straight.`);
				} else {
					message.reply(`Sorry, but ${args[0]} is not a valid stat. Use \`${ops.prefix}stats\` to see a list of all stats. (case-sensitive)`);
					resolve(`, but it failed, as ${args[0]} is not a valid stat.`);
					return;
				}
				resolve();
				return;
			}

			const data = [];
			for (const item of stats){
				stats.set(item[0], item[1]);
			}
			const fails = stats.get("Fails");
			const trueAttempts = stats.get("Attempts") - stats.get("Declined-Blacklist") - stats.get("Declined-Left-Server") - stats.get("Declined-All-Roles") - stats.get("Declined-Wrong-Type");
			const successes = trueAttempts - fails;
			data.push("Here are the running total stats:");
			for (const item of stats){
				data.push(`${item[0]}: ${item[1]}`);
			}
			data.push(`Successes: ${successes}`);
			data.push(`Failure-Rate: ${(fails / trueAttempts * 100).toFixed(2)}%`);
			data.push(`Days: Bot has been running for ${((Date.now() - launchDate) / 86400000).toFixed(1)} days straight.`);
			replyNoMention(message, data.join("\n"));
			resolve();
			return;
		});
	},
	passStats(s){
		return new Promise((res) => {
			stats = s;
			res();
		});
	},
};
