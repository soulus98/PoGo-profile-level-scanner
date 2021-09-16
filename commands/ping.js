module.exports = {
	name: "check-server-ping",
	aliases: ["check-ping", "server-ping", "ping"],
	usage: `\`${ops.prefix}ping\``,
	description: "Ping! Tells you the server delay for the message.",
	execute(message) {
		return new Promise(function(resolve) {
			const client = message.client;
			try {
				message.reply(`Pong!
Websocket heartbeat: ${client.ws.ping}ms.`).then(sent => {
					sent.edit(`Pong!
Websocket heartbeat: ${client.ws.ping}ms.
Message delay: ${sent.createdTimestamp - message.createdTimestamp}ms.`);
				});
				resolve();
				return;
			}	catch (err){
				resolve(`, but it failed, due to an unexpected error. Error: ${err}.`);
				return;
			}
		});
	},
};
