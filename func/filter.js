const fs = require("fs"),
			path = require("path"),
			{ errorMessage } = require("../func/misc.js");
let list = [];

function filter(message){
	if (message.embeds[0]) {
		if (message.embeds[0].title == ":white_check_mark: Complete") {
			message.delete();
			return;
		}
		if (message.embeds[0].title == "Success") {
			message.delete();
			return;
		}
		if (message.embeds[0].title == "Error") {
			message.delete();
			return;
		}
		if (new RegExp(/Your .+ has been updated!/).test(message.embeds[0].description)) {
			message.delete();
			return;
		}
	}
	if (message.content.startsWith("Error: role_name")) {
		message.delete();
		return;
	}
	if (message.content.startsWith("Use `$help`")) {
		message.delete();
		return;
	}
	if (message.content.startsWith("You do not have permission to use")) {
		message.delete();
		return;
	}
	if (new RegExp(/\d{12}/).test(message.content)) {
		message.delete();
		return;
	}
}

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
