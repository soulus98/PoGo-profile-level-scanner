const fs = require("fs");
const Discord = require("discord.js");
let stats = new Discord.Collection();

// Updates the stats and saves the stats to file
function saveStats(level) {
	return new Promise(function(resolve, reject) {
		if (isNaN(level) || level > 50 || level < 1){
			if (level == "Failure"){
				stats.set("Attempts", stats.get("Attempts") + 1);
				stats.set("Fails", stats.get("Fails") + 1);
			} else if (level == "black") {
				stats.set("Attempts", stats.get("Attempts") + 1);
				stats.set("Declined-Blacklist", stats.get("Declined-Blacklist") + 1);
			} else if (level == "all") {
				stats.set("Attempts", stats.get("Attempts") + 1);
				stats.set("Declined-All-Roles", stats.get("Declined-All-Roles") + 1);
			} else if (level == "left") {
				stats.set("Attempts", stats.get("Attempts") + 1);
				stats.set("Declined-Left-Server", stats.get("Declined-Left-Server") + 1);
			} else if (level == "wrong") {
				stats.set("Attempts", stats.get("Attempts") + 1);
				stats.set("Declined-Wrong-Type", stats.get("Declined-Wrong-Type") + 1 || 1);
			} else if (level == "missing") {
				stats.set("Manual-Unknown", stats.get("Manual-Unknown") + 1 || 1);
			} else if (level == "revert") {
				stats.set("Manual-Reversions", stats.get("Manual-Reversions") + 1 || 1);
			} else {
				console.error(`[${dateToTime(new Date())}]: Error while saving the stats. Literally impossible to get to this, so if we have, something weird has happened.`);
			}
		} else if (level < 30) {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Under-30",stats.get("Under-30")+1);
		} else {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set(parseFloat(level),stats.get(parseFloat(level))+1);
		}
		fs.writeFile("./server/stats.json", JSON.stringify(Array.from(stats)), (err) => {
			if (err){
				console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving stats. Err:${err}`);
				return;
			} else {
				resolve();
				return;
			}
		});
	});
}

// Loads the stats from file
function loadStats() {
	return new Promise(function(resolve, reject) {
		stats = new Discord.Collection();
		new Promise((res) => {
			try {
				delete require.cache[require.resolve("../server/stats.json")];
				res();
			} catch (e){
				if (e.code == "MODULE_NOT_FOUND") {
					// do nothing
					res();
				} else {
					reject(`Error thrown when loading stats. Error: ${e}`);
					return;
				}
			}
		}).then(() => {
			let statsJson = "";
			new Promise((res) => {
				try {
					statsJson = require("../server/stats.json");
					res();
				} catch (e) {
					if (e.code == "MODULE_NOT_FOUND") {
						fs.writeFile("./server/stats.json", "[[\"Attempts\",0],[\"Declined-Blacklist\",0],[\"Declined-Left-Server\",0],[\"Declined-All-Roles\",0],[\"Declined-Wrong-Type\",0],[\"Manual-Unknown\",0],[\"Manual-Reversions\",0],[\"Fails\",0],[\"Under-30\",0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0]]", (err) => {
							if (err){
								reject(`Error thrown when writing stats file. Error: ${err}`);
								return;
							}
							console.log("Could not find stats.json. Making a new one...");
							statsJson = require("../server/stats.json");
							res();
						});
					}	else {
						reject(`Error thrown when loading stats (2). Error: ${e}`);
						return;
					}
				}
			}).then(() => {
				for (const item of statsJson){
					stats.set(item[0], item[1]);
				}
				console.log("\nStats loaded");
				resolve(stats);
			});
		});
	});
}

module.exports = { saveStats, loadStats, stats };
