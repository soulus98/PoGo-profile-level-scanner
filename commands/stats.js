const config = require("../config.json");
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
    stats = new Discord.Collection();
    statsJson = require("../stats.json");
    for (item of statsJson){
      stats.set(item[0],item[1]);
    }
    fails = stats.get("Fails");
    trueAttempts = stats.get("Attempts")-stats.get("Declined-Blacklist")-stats.get("Declined-Left-Server")+stats.get("Declined-All-Roles");
    successes = trueAttempts-fails;
    data.push(`Here are the running total stats:`);
    for (item of stats){
      data.push(`${item[0]}: ${item[1]}`);
    }
    data.push(`Successes: ${successes}`);
    data.push(`Failure rate: ${(fails/trueAttempts*100).toFixed(2)}%`);
    message.lineReplyNoMention(data, { split: true });
    return;
	},
};
