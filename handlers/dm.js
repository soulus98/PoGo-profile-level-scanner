const Discord = require("discord.js"),
			{ dateToTime } = require("../func/dateToTime.js"),
			fs = require("fs");
let queue = new Discord.Collection(),
		server = {};

loadMailQueue().catch((err) => {
	console.error(`[${dateToTime(new Date())}]: `, err);
});

function loadMailQueue() {
	return new Promise(function(resolve, reject) {
		queue = new Discord.Collection();
		new Promise((res) => {
			try {
				delete require.cache[require.resolve("../server/mailQueue.json")];
				res();
			} catch (e){
				if (e.code == "MODULE_NOT_FOUND") {
					// do nothing
					res();
				} else {
					reject("Error thrown when loading mail queue. Error:", e);
					return;
				}
			}
		}).then(() => {
			let queueJson = "";
			new Promise((res) => {
				try {
					queueJson = require("../server/mailQueue.json");
					res();
				} catch (e) {
					if (e.code == "MODULE_NOT_FOUND") {
						fs.writeFile("./server/mailQueue.json", "[]", (err) => {
							if (err){
								reject("Error thrown when writing mail queue. Error: ", err);
								return;
							}
							console.log("Could not find mailQueue.json. Making a new one...");
							queueJson = require("../server/mailQueue.json");
							res();
						});
					}	else {
						reject("Error thrown when loading mail queue (2). Error: ", e);
						return;
					}
				}
			}).then(() => {
				for (const item of queueJson){
					queue.set(item[0], item[1]);
				}
				console.log("\nMail queue loaded");
				resolve(queue);
			});
		});
	});
}

function saveQueue() {
	fs.writeFile("./server/mailQueue.json", JSON.stringify(Array.from(queue)), (err) => {
		if (err){
			console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the the mail queue. Err:${err}`);
			return;
		}
	});
}

function channelMsg(message) {
	const channelId = message.channel.id;
	getUser(channelId).then((userId) => {
		if (!userId) return;
		else {
			message.client.users.fetch(userId).then(async (user) => {
				if (message.content.startsWith("=")) {
					if (message.content.startsWith("=close")) {
						message.react("👍");
						const args = message.content.slice(7);
						if (args == "") user.send("Ticket closed\nNo reason provided.");
						else user.send(`Ticket closed\n${args}`);
						message.channel.delete();
						queue.delete(userId);
						saveQueue();
					} else return;
				} else {
					let embedIn = await newEmbed(message, "hostReply");
					let embedOut = new Discord.MessageEmbed(embedIn);
					user.send(message).then(() => {
						message.channel.send(embedIn);
						message.channel.send(embedOut);
						message.delete();
					});
				}
			});
		}
	});
}

function mailDM(message) {
  const user = message.author;
  if (queue.has(user.id)){
    const channel = server.channels.cache.get(queue.get(user.id));
		channel.send(`From user ${user}: ${message.content}`);
  } else {
    newChannel(message, user);
  }
}

function newChannel(message, user) {
  const ticketName = `${user.username}-${user.discriminator}`;
  server.channels.create(ticketName, {
    parent:ops.mailCategory,
  }).then((channel) => {
    queue.set(user.id, channel.id);
    saveQueue();
    channel.send(`From user ${user}: ${message.content}`);
  });
}
																		// green, orange, orange, 		green, 			red
function newEmbed(message, status){ // open, hostOpen, hostReply, userReply, close
	return new Promise((resolve, reject) => {
		const embed = new Discord.MessageEmbed();
		if (status == "close") {
			embedIn.setColor("#FF0000");
		} else {
			embed.setDescription(message.content);
			if (status == "open"){
				embed.setColor("#00FF00");
			} else if (status == "hostOpen") {
				embed.setColor("#FF8888");
			} else if (status == "hostReply") {
				embed.setColor("#FF8888");
			} else if (status == "userReply") {
				embed.setColor("#00FF00");
			}
		}
		embed.setFooter("Pokémon GO Raids", server.iconURL())
		.setTimestamp();
		return embed;
	});
}


function getUser(channelId){
	return new Promise((resolve) => {
	for (const [k, v] of queue){
		if (v == channelId) resolve(k);
	}
	resolve(false);
});
}

function passServ(s) {
	return new Promise((res) => {
		server = s;
		res();
	});
}

module.exports = { mailDM, channelMsg, passServ };
