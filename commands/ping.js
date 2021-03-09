module.exports = {
	name: "ping",
	description: "Ping! Tells you the server delay for the message.",
	cooldown: 5,
	execute(message, args) {
    msgdelay = message.createdTimestamp - new Date().getTime();
    message.channel.send("Pong. Message delay of: " + msgdelay + " ms");
	},
};
