const config = require("../config.json");
const prefix = config.chars.prefix;

module.exports = {
	name: "force-quit",
	description: "Forcibly quit the bot server. IDK why you'd need to do this but I've included it just in case.",
  aliases: ["quit","end"],
  usage: `${prefix}quit`,
	guildOnly:true,
	permissions: "MANAGE_GUILD",
	execute(message, args) {
		console.log(`${message.author.username}${message.author} force quit the server at ${message.createdAt.toLocaleString()}.`);
		message.channel.send("👋").then( () => {
			process.exit(0);
		});
	},
};
