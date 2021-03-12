const { prefix } = require("../config.json");
module.exports = {
	name: "check-server-ping",
	aliases: ["check-ping", "server-ping", "ping"],
	description: "Ping! Tells you the server delay for the message.",
	cooldown: 0.1,
	execute(message, args) {
    msgdelay = message.createdTimestamp - new Date().getTime();
    message.channel.send("Pong. Message delay of: " + msgdelay + " ms");
	},
};
