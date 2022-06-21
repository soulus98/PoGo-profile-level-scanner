module.exports = {
	name: "cache-amounts",
	description: "Dev command for checking some stuff",
  aliases: ["cache"],
  usage: `\`${ops.prefix}cache\``,
	type:"Info",
	execute(message) {
		return new Promise(function(resolve) {
			const client = message.client;
			const server = message.guild;
			const data = [];
			data.push(`Channels: ${client.channels.cache.size}`);
			data.push(`Guilds: ${client.guilds.cache.size}`);
			data.push(`Users: ${client.users.cache.size}`);
			data.push(`Server channels: ${server.channels.cache.size}`);
			data.push(`Server bans: ${server.bans.cache.size}`);
			data.push(`Server emoji: ${server.emojis.cache.size}`);
			data.push(`Server bans: ${server.bans.cache.size}`);
			data.push(`Server members: ${server.members.cache.size}`);
			data.push(`Server roles: ${server.roles.cache.size}`);
			data.push(`Server stickers: ${server.stickers.cache.size}`);
			data.push(`Server commands: ${server.commands.cache.size}`);
			message.reply(data.join("\n")).then(() => resolve());
		});
	},
};
