const config = require("../config.json");
const prefix = config.chars.prefix;
module.exports = {
	name: "check-server-ping",
	aliases: ["check-ping", "server-ping", "ping"],
	usage: `\`${prefix}ping\``,
	description: "Ping! Tells you the server delay for the message.",
	execute(message, args) {
		try{
	    msgdelay = message.createdTimestamp - new Date().getTime();
	    message.channel.send("Pong. Message delay of: " + msgdelay + " ms");
			return `, and it was successful.`;
		}catch (err){
			return `, but it failed, due to an unexpected error. Error: ${err}`;
		}
	},
};
