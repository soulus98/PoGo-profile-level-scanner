const heapdump = require("heapdump"),
			path = require("path");
module.exports = {
	name: "heapdump-snapshot",
	description: "Does a heapdump snapshot using `args` as the filename",
  aliases: ["heapdump", "hs"],
  usage: `\`${ops.prefix}hs 1\``,
	guildOnly:true,
	args:true,
	execute(message, args) {
		return new Promise(function(resolve) {
			const filePath = path.resolve(__dirname, `../server/${args}.heapsnapshot`);
			console.log(filePath);
			heapdump.writeSnapshot(filePath, (err, filename) => {
				if (err) return console.log(err);
				message.react("👍");
				console.log(`Wrote ${filename}`);
				resolve();
			});
		});
	},
};
