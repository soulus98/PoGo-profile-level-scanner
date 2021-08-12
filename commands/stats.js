const config = require("../server/config.json");
const prefix = config.chars.prefix;
const Discord = require("discord.js");

module.exports = {
	name: "statistics",
	description: "Show the current stats for the bot",
  aliases: ["stats","stat","analytics","analytic","anals"],
  usage: `\`${prefix}stats\``,
	permissions: "MANAGE_GUILD",
	execute(message, args) {
    const data = [];
    for (item of stats){
      stats.set(item[0],item[1]);
    }
    const fails = stats.get("Fails");
    const trueAttempts = stats.get("Attempts")-stats.get("Declined-Blacklist")-stats.get("Declined-Left-Server")-stats.get("Declined-All-Roles")-stats.get("Declined-Wrong-Type");
    const successes = trueAttempts-fails;
    data.push(`Here are the running total stats:`);
    for (const item of stats){
      data.push(`${item[0]}: ${item[1]}`);
    }
    data.push(`Successes: ${successes}`);
    data.push(`Failure rate: ${(fails/trueAttempts*100).toFixed(2)}%`);
    message.lineReplyNoMention(data, { split: true });
    return;
	},
};
