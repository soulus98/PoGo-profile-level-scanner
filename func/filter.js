const fs = require("fs"),
			path = require("path"),
			{ errorMessage } = require("../func/misc.js");
let list = [];

function filter(message) {
	if (message.embeds[0] && message.embeds[0].title && message.embeds[0].title.toLowerCase().includes("raid")) return;
	else {
		message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
		return;
	}
}

// function filter(message){
// 	if (message.embeds[0]) {
// 		if (message.embeds[0].title == ":white_check_mark: Complete") {
// 			message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 			return;
// 		}
// 		if (message.embeds[0].title == "Success") {
// 			message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 			return;
// 		}
// 		if (message.embeds[0].title == "Error") {
// 			message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 			return;
// 		}
// 		if (message.embeds[0].title == "Badge Granted!") {
// 			message.react("👀").then(() => {
// 				setTimeout(() => {
// 					message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 				}, 5000);
// 				return;
// 			}).catch(() => {
// 				console.error(`[${new Date()}]: Error: Could not react 👀 (eyes) to message: ${message.url}\nContent of mesage: "${message.content}"`);
// 				setTimeout(() => {
// 					message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 				}, 5000);
// 			});
// 		}
// 		if (message.embeds[0].title == "Badge Revoked!") {
// 			message.react("👀").then(() => {
// 				setTimeout(() => {
// 					message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 				}, 5000);
// 				return;
// 			});
// 		}
// 		// if (message.embeds[0].title == "No Change Made To Trainer's Badge") {
// 		// 	message.react("👀").then(() => {
// 		// 		setTimeout(() => {
// 		// 			message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 		// 		}, 5000);
// 		// 		return;
// 		// 	});
// 		// }
// 		if (new RegExp(/Your .+ has been updated!/).test(message.embeds[0].description)) {
// 			message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 			return;
// 		}
// 	}
// 	if (message.content.startsWith("Error: role_name")) {
// 		message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 		return;
// 	}
// 	if (message.content.startsWith("Use `$help`")) {
// 		message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 		return;
// 	}
// 	if (message.content.startsWith("You do not have permission to use")) {
// 		message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 		return;
// 	}
// 	if (message.content.startsWith("User is on cooldown")) {
// 		message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 		return;
// 	}
// 	// if (new RegExp(/\d{12}/).test(message.content)) {
// 	// 	message.delete().catch(() => console.error(`Can not filter pokenav message:${message.id} from channel: ${message.channel.name}${message.channel}.`));
// 	// 	return;
// 	// }
// }

function addFilterChannel(id) {
	return new Promise((resolve, reject) => {
		if (!list.includes(id)) {
			list.push(id);
			saveFilterList().then(() => {
				resolve();
				return;
			});
		} else {
			reject();
		}
	});
}
function removeFilterChannel(id) {
	return new Promise((resolve, reject) => {
		if (list.includes(id)) {
			list.splice(list.indexOf(id));
			saveFilterList().then(() => {
				resolve();
				return;
			});
		} else {
			reject();
		}
	});
}
function loadFilterList() {
	return new Promise(function(resolve, reject) {
		list = [];
		new Promise((res) => {
			try {
				delete require.cache[require.resolve("../server/filterList.json")];
				res();
			} catch (e){
				if (e.code == "MODULE_NOT_FOUND") {
					// do nothing
					res();
				} else {
					reject(`Error thrown when loading filter list. Error: ${e}`);
					return;
				}
			}
		}).then(() => {
			try {
				list = require("../server/filterList.json");
				console.log(`\nFilter list loaded. It contains ${list.length} channels.`);
				resolve(list);
			} catch (e) {
				if (e.code == "MODULE_NOT_FOUND") {
					fs.writeFile(path.resolve(__dirname, "../server/filterList.json"), "[]", (err) => {
						if (err){
							reject(`Error thrown when writing the filter list file. Error: ${err}`);
							return;
						}
						console.log("Could not find filterList.json. Making a new one...");
						list = require("../server/filterList.json");
						resolve(list);
					});
				}	else {
					reject(`Error thrown when loading the filter list (2). Error: ${e}`);
					return;
				}
			}
		});
	});
}
function saveFilterList() {
	return new Promise((resolve) => {
		fs.writeFile(path.resolve(__dirname, "../server/filterList.json"), JSON.stringify(Array.from(list)), (err) => {
			if (err){
				errorMessage(new Date(), false, `Error: An error occured while saving stats. Error: ${err}`);
				return;
			} else {
				resolve();
				return;
			}
		});
	});
}

module.exports = { filter,
	addFilterChannel,
	removeFilterChannel,
	loadFilterList,
	saveFilterList,
};
