const config = require("../config.json");
const prefix = config.chars.prefix;
module.exports = {
	name: "check-server-ping",
	aliases: ["check-ping", "server-ping", "ping"],
	usage: `\`${prefix}ping\``,
	description: "Ping! Tells you the server delay for the message.",
	execute(message, args) {
		client = message.client;
		try{
	    msgdelay = message.createdTimestamp - new Date().getTime();
	    message.lineReply(`Pong!
Websocket heartbeat: ${client.ws.ping}ms.`).then(sent => {
sent.edit(`Pong!
Websocket heartbeat: ${client.ws.ping}ms.
Message delay: ${sent.createdTimestamp - message.createdTimestamp}ms.`);
});
			return;
		}catch (err){
			return `, but it failed, due to an unexpected error. Error: ${err}`;
		}
	},
};
