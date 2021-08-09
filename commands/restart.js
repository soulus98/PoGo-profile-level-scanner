const config = require("../server/config.json");
const prefix = config.chars.prefix;

module.exports = {
	name: "restart",
	description: "Restarts the bot. I haven't (can't) thoroughly tested this, so sorry if t doesn't work",
  aliases: ["rs"],
  usage: `\`${prefix}rs\``,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message, args) {
		console.log(`${message.author.username}${message.author} force quit the server at ${message.createdAt.toLocaleString()}.`);
		message.lineReplyNoMention("Restarting...").then( () => {
			process.exit(0);
		});
	},
};
