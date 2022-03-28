module.exports = {
	name: "check-memory-usage",
	description: "responds with the current memory usage stats.",
  aliases: ["mem"],
  usage: `\`${ops.prefix}mem\``,
	guildOnly:true,
	type:"Info",
	execute(message) {
		return new Promise(function(resolve) {
			if (ops.processInfoMode) {
				process.emit("logCurrentMemoryUsage", message);
				resolve();
			} else {
				message.reply("I cannot do that if `processInfoMode` is off.");
			}
		});
	},
};
