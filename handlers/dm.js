const config = require('../server/config.json')
const mailCategory = config.ids.mailCategory;
const serverID = config.ids.serverID;
const Discord = require("discord.js");
const fs = require('fs');
var queue = new Discord.Collection();

loadMailQueue();

function loadMailQueue() {
	try {
		delete require.cache[require.resolve("./server/mailQueue.json")];
	} catch (e){
		if (e.code == "MODULE_NOT_FOUND") {
			//do nothing
		} else {
			console.error(`[${dateToTime(new Date())}]: Error thrown when loading the mail queue. Error: ${e}`);
		}
	} finally {
		var queueJson = "";
		try {
			queueJson = require("./server/mailQueue.json");
		} catch (e) {
			if (e.code == "MODULE_NOT_FOUND") {
				fs.writeFile("./server/mailQueue.json","[]",()=>{
					console.log("Could not find mailQueue.json. Making a new one...");
					queueJson = require("./server/mailQueue.json");
				});
			}	else {
				console.error(`[${dateToTime(new Date())}]: Error thrown when loading the mail queue (2). Error: ${e}`);
			}
		} finally {
			setTimeout(()=>{
				for (item of queueJson){
					queue.set(item[0],item[1]);
				}
				console.log("Mail queue loaded");
			},750);
		}
	}
}

function saveQueue() {
	fs.writeFile("./server/mailQueue.json",JSON.stringify(Array.from(queue)),(err)=>{
		if (err){
			console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the the mail queue. Err:${err}`);
			return;
		}
	});
}

function channelDM() {

}

function mailDM(message) {
  const server = message.client.guilds.cache.get(serverID);
  user = message.author;
  if (queue.has(user.id)){
    return;
  } else {
    newChannel(message);
  }
}

function newChannel(message) {
  const ticketName = `${user.username}-${user.discriminator}`;
  server.channels.create(ticketName,{
    parent:mailCategory
  }).then((newChannel)=>{
    queue.set(user.id,newChannel.id);
    saveQueue();
    newChannel.send(`From user ${user}: ${message.content}`);
  });
}
module.exports = {mailDM,channelDM}
