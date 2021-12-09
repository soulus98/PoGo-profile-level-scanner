module.exports = {
	name: "check-memory-usage",
	description: "responds with the current memory usage stats.",
  aliases: ["mem"],
  usage: `\`${ops.prefix}mem\``,
	guildOnly:true,
	execute(message) {
		return new Promise(function(resolve) {
			process.emit("logCurrentMemoryUsage", message);
			resolve();
		});
	},
};
