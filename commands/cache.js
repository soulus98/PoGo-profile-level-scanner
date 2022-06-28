module.exports = {
	name: "cache-amounts",
	description: "Dev command for checking some stuff",
  aliases: ["cache"],
  usage: `\`${ops.prefix}cache\``,
	type:"Info",
	guildOnly:true,
	execute(message, args) {
		return new Promise(function(resolve) {
			const client = message.client;
			const server = message.guild;
			const data = [];
			if (args[1]) return message.reply("Too many args");
			if (args[0]) {
				if (args[0] == "channels") {
					data.push("Channels loaded bot wide:");
					message.client.channels.cache.each((channel, k) => {
						if (channel.type == "DM") data.push(`DM: ${k}: ${channel.recipient.username}`);
						else data.push(`<#${k}>: ${channel.name}`);
					});
				} else if (args[0] == "guilds") {
					data.push("Guilds loaded:");
					message.client.guilds.cache.each((guild, k) => {
						data.push(`<#${k}>: ${guild.name}`);
					});
				} else if (args[0] == "users") {
					data.push("Users loaded bot wide:");
					message.client.users.cache.each((user, k) => {
						data.push(`${k}: ${user.username}`);
					});
				} else if (args[0] == "gChannels") {
					data.push(`Channels loaded in ${message.guild.name}:`);
					message.guild.channels.cache.each((channel, k) => {
						data.push(`<#${k}>: ${channel.name}`);
					});
				} else if (args[0] == "gMembers") {
					data.push(`Members loaded in ${message.guild.name}:`);
					message.guild.members.cache.each((member, k) => {
						data.push(`${k}: ${member.user.username}`);
					});
				} else if (args[0] == "gRoles") {
					data.push(`Roles loaded in ${message.guild.name}:`);
					message.guild.roles.cache.each((role, k) => {
						data.push(`${k}: ${role.name}`);
					});
				} else return message.reply("Not a valid arg");
			} else {
				data.push(`Channels: ${client.channels.cache.size}`);
				data.push(`Guilds: ${client.guilds.cache.size}`);
				data.push(`Users: ${client.users.cache.size}`);
				data.push(`Server channels: ${server.channels.cache.size}`);
				data.push(`Server emoji: ${server.emojis.cache.size}`);
				data.push(`Server bans: ${server.bans.cache.size}`);
				data.push(`Server members: ${server.members.cache.size}`);
				data.push(`Server roles: ${server.roles.cache.size}`);
				data.push(`Server stickers: ${server.stickers.cache.size}`);
				data.push(`Server commands: ${server.commands.cache.size}`);
			}
			message.reply(data.join("\n")).then(() => resolve());
		});
	},
};
