const { token } = require("./server/keys.json"),
	fs = require("fs"),
	path = require("path"),
	Discord = require("discord.js"),
	messagetxt = require("./server/messagetxt.js"),
	{ messagetxtReplace } = require("./func/misc.js"),
	{ handleCommand } = require("./handlers/commands.js"),
	{ handleImage } = require("./handlers/images.js"),
	{ handleInteraction } = require("./handlers/interactions.js"),
	{ handleScreenshotSubmission } = require("./handlers/submissions.js"),
	{ dateToTime, performanceLogger, replyNoMention, errorMessage } = require("./func/misc.js"),
	{ saveStats, loadStats } = require("./func/stats.js"),
	{ saveBlacklist } = require("./func/saveBlacklist.js"),
	{ cacheOps, sweeperOps } = require("./func/clientOptions.js"),
	{ gatewayIntents, gatewayPartials } = require("./func/discordGateway.js"),
	mail = require("./handlers/dm.js"),
	ver = require("./package.json").version,
	dmMailTog = require("./server/config.json").toggles.dmMail,
	cooldowns = new Discord.Collection(),
	launchDate = new Date(),
	act = (dmMailTog) ? messagetxtReplace(messagetxt.activity) : ver,
	client = new Discord.Client({
		makeCache: (require("./server/config.json").toggles.strictCache) ? Discord.Options.cacheWithLimits(cacheOps) : Discord.Options.cacheEverything(),
		sweepers: sweeperOps,
		intents: gatewayIntents,
		partials: gatewayPartials,
		presence: {
			status: "online",
			activities: [{
				name: act,
				type: Discord.ActivityType.Playing,
			}],
		},
	});
imgStats = {
	imageAttempts: 0,
	imageLogCount: 0,
	currentlyImage: 0,
};
blacklist = new Discord.Collection();
let loaded = false,
	config = {};
ops = {};
module.exports = { loadConfigs, clearBlacklist, cooldowns };
// Loads all the variables at program launch
async function load() {
	console.log("======================================================================================\n");
	console.log("Server starting...");
	await loadConfigs();
	await checkDateFolder(launchDate).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err); });
	await loadCommands();
	await loadBlacklist().catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err); });
	await mail.loadMailQueue().catch((err) => {
		console.error(`[${dateToTime(new Date())}]: `, err);
	});
	await loadStats().then((s) => {
		const { passStats } = require("./commands/stats.js");
		passStats(s);
	}).catch((err) => { console.error(`[${dateToTime(new Date())}]: `, err); });
	client.login(token);
}
// Loads (or re-loads) the bot settings
function loadConfigs() {
	return new Promise((resolve) => {
		config = {};
		delete require.cache[require.resolve("./server/config.json")];
		config = require("./server/config.json");
		for (const cat in config) for (const item in config[cat]) ops[item] = config[cat][item]; // This makes all the options
		ops.blacklistTime = config.numbers.blacklistTime * 86400000;
		ops.msgDeleteTime = config.numbers.msgDeleteTime * 1000;
		if (!loaded) {
			console.log("\nLoading configs...");
			console.log("\nConfigs:", config);
			resolve();
		} else {
			(async () => {
				// if (ops.serverID) server = await client.guilds.fetch(ops.serverID);
				// if (ops.profileChannel) profile = await client.channels.fetch(ops.profileChannel);
				// if (ops.screenshotScanning) {
				// 	if (ops.screenshotChannel)  channel = await client.channels.fetch(ops.screenshotChannel);
				// 	if (ops.logsChannel) logs = await client.channels.fetch(ops.logsChannel);
				// 	const { passAppServ } = require("./commands/approve.js");
				// 	const { passRevServ } = require("./commands/revert.js");
				// 	const { passImgServ } = require("./handlers/images.js");
				// 	passAppServ([channel, profile, server, logs]);
				// 	passRevServ([channel, server]);
				// 	passImgServ(logs);
				// }
				if (ops.dmMail) {
					const server = (ops.serverID) ? await client.guilds.fetch(ops.serverID) : undefined;
					await mail.passServ(server.name, server.iconURL());
				}
				console.log("\nReloaded configs\n");
				resolve();
			})();
		}
	});
}
// Checks whether the date folder exists for the images to be saved to and creates it if not.
function checkDateFolder(checkDate) {
	return new Promise((resolve, reject) => {
		if (ops.saveLocalCopy) {
			const folder = path.resolve(__dirname, `./screens/Auto/${checkDate.toDateString()}`),
				folderParent = path.dirname(folder),
				folderParentParent = path.dirname(folderParent);
			console.log(`\nChecking for ${folder}...`);
			fs.access(folder, (err) => {
				if (err) {
					fs.mkdir(folderParentParent, { recursive: true }, (err) => {
						if (err) reject(`Error occured when making/checking ${folderParentParent}. Error: ${err}`);
						else {
							console.log(`Created/checked Folder: ${folderParentParent}`);
							fs.mkdir(folderParent, { recursive: true }, (err) => {
								if (err) reject(`Error occured when making/checking ${folderParent}. Error: ${err}`);
								else {
									console.log(`Created/checked Folder: ${folderParent}`);
									fs.mkdir(folder, { recursive: true }, (err) => {
										if (err) reject(`Error occured when making/checking "${folder}". Error: ${err}`);
										else {
											console.log(`Created/checked Folder: ${folder}.`);
											resolve();
										}
									});
								}
							});
						}
					});
				} else {
					console.log(`Folder: ${folder} already existed.`);
					resolve();
				}
			});
			return;
		} else resolve();
	});
}
// Loads the command files. This was standard in the discord.js guide
function loadCommands() {
	return new Promise((resolve) => {
		client.commands = new Discord.Collection();
		const commandFiles = fs.readdirSync(path.resolve(__dirname, "./commands")).filter(file => file.endsWith(".js"));
		let commandFilesNames = "\nThe currently loaded commands and cooldowns are:\n";
		for (const file of commandFiles) {		// Loads commands
			const command = require(`./commands/${file}`);
			if (!(command.scanningOnly && !ops.screenshotScanning || command.mailOnly && !ops.dmMail)) {
				commandFilesNames = commandFilesNames + command.name;
				if (command.cooldown) {
					commandFilesNames = commandFilesNames + ":\t" + command.cooldown + " seconds \n";
				} else {
					commandFilesNames = commandFilesNames + "\n";
				}
				client.commands.set(command.name, command);
			}
		}
		console.log(commandFilesNames);
		resolve();
	});
}
// Loads the blacklist from file
function loadBlacklist() {
	return new Promise((resolve, reject) => {
		blacklist = new Discord.Collection();
		new Promise((res) => {
			try {
				delete require.cache[require.resolve("./server/blacklist.json")];
				res();
			} catch (e) {
				if (e.code == "MODULE_NOT_FOUND") {
					// do nothing
					res();
				} else {
					reject(`Error thrown when loading blacklist. Error: ${e}`);
					return;
				}
			}
		}).then(() => {
			let blackJson = "";
			new Promise((res) => {
				try {
					blackJson = require("./server/blacklist.json");
					res();
				} catch (e) {
					if (e.code == "MODULE_NOT_FOUND") {
						fs.writeFile(path.resolve(__dirname, "./server/blacklist.json"), "[]", (err) => {
							if (err) {
								reject(`Error thrown when writing new blacklist file. Error: ${err}`);
								return;
							}
							console.log("Could not find blacklist.json. Making a new one...");
							blackJson = require("./server/blacklist.json");
							res();
						});
					} else {
						reject(`Error thrown when loading blacklist (2). Error: ${e}`);
						return;
					}
				}
			}).then(() => {
				if (!blackJson[0]) {
					console.log("Blacklist loaded (empty).");
					resolve(blacklist);
					return;
				}
				let x = 0;
				for (const item of blackJson) {
					if (Date.now() - item[1] > ops.blacklistTime) {
						x = x + 1;
					} else {
						blacklist.set(item[0], item[1]);
					}
				}
				resolve(blacklist);
				if (x) {
					console.log(`Blacklist loaded, and removed ${x} users from it due to time expiration.`);
					saveBlacklist(blacklist);
				} else {
					const y = blacklist.size;
					console.log(`Blacklist loaded from file. It contains ${y} user${(y == 1) ? "" : "s"}`);
				}
			});
		});
	});
}

load();

// Called from clear-blacklist.js to clear the blacklist when requested
function clearBlacklist(message, idToDelete) {
	if (idToDelete) {
		if (blacklist.has(idToDelete)) {
			blacklist.delete(idToDelete);
			replyNoMention(message, `Removed <@${idToDelete}>${idToDelete} from the blacklist.`).catch(() => {
				console.error(`[${dateToTime(new Date())}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`Removed <@${idToDelete}>${idToDelete} from the blacklist.`);
			});
			console.log(`[${dateToTime(new Date())}]: Deleted ${idToDelete} from the blacklist.`);
			saveBlacklist(blacklist);
		} else {
			message.reply("I can not find that user's ID in the blacklist. Please try again");
		}
	} else {
		fs.writeFile(path.resolve(__dirname, "./server/blacklist.json"), "[]", (err) => {
			if (err) {
				console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving the blacklist. Err:${err}`);
				return;
			}
			loadBlacklist();
			replyNoMention(message, "Blacklist cleared.").catch(() => {
				console.error(`[${dateToTime(new Date())}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send("Blacklist cleared.");
			});
		});
	}
	return;
}

// TODO: figure out the fucking launch queue checker
function processImage(message, postedTime, wasDelayed) {
	handleImage(message, postedTime, wasDelayed).then(() => { // This runs after the recognition is finished
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
		if (imgStats.imageLogCount > 0 && imgStats.imageLogCount % 30 === 0) loadBlacklist();
		if (ops.processInfoMode) process.emit("logCurrentMemoryUsage", 1);
		// Potential future queue optimisation here. Currently not neccesary
		// todo: check queue
		// todo: fetch message from queue id
		// processImage(newMessage, newMessage.createdTimestamp, true);
	}).catch((err) => {
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
		if (err == "Fail") saveStats("Failure");
		if (ops.processInfoMode) process.emit("logCurrentMemoryUsage", 1);
	});
}

function enqueueImage(message, postedTime) {
	imgStats.imageAttempts++;
	imgStats.currentlyImage++;
	const instance = imgStats.imageAttempts;
	let wasDelayed = false;
	const waitForTurn = new Promise((resolve) => {
		if (imgStats.imageLogCount + 1 == instance) return resolve();
		wasDelayed = true;
		const intervalID = setInterval(() => {
			if (imgStats.imageLogCount + 1 == instance) {
				clearInterval(intervalID);
				resolve();
			}
		}, 250);
	});
	waitForTurn.then(() => {
		if (ops.processInfoMode) process.emit("logCurrentMemoryUsage", 0);
		if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Queue passed\t`, postedTime.getTime());
		processImage(message, postedTime, wasDelayed);
	});
}

client.once(Discord.Events.ClientReady, async () => {
	const server = (ops.serverID) ? await client.guilds.fetch(ops.serverID) : undefined;
	const logs = (ops.logsChannel) ? await client.channels.fetch(ops.logsChannel) : undefined;
	const channel = (ops.screenshotScanning && ops.screenshotChannel) ? await client.channels.fetch(ops.screenshotChannel) : undefined;
	if (ops.badgeChannel > 0) await client.channels.fetch(ops.badgeChannel);
	// if (ops.profileChannel) profile = await client.channels.fetch(ops.profileChannel);
	// if (ops.screenshotScanning) {
	// 	if (ops.screenshotChannel) channel = await client.channels.fetch(ops.screenshotChannel);
	// 	const { passAppServ } = require("./commands/approve.js");
	// 	const { passRevServ } = require("./commands/revert.js");
	// 	const { passImgServ } = require("./handlers/images.js");
	// 	passAppServ([channel, profile, server, logs]);
	// 	passRevServ([channel, server]);
	// 	passImgServ(logs);
	// }
	if (ops.dmMail) {
		await mail.passServ(server.name, server.iconURL());
	}

	if (ops.screenshotScanning && (ops.screenshotChannel == "0" || channel == undefined)) {
		console.log("\nOops the screenshot channel is broken. Set \"screenshotChannel\" in the config.json");
		return;
	}
	if (ops.logsChannel == "0" || logs == undefined) {
		console.log("\nOops the logs channel is broken. Set \"logsChannel\" in the config.json. It is neccesary for permission reasons.");
		return;
	}
	if (ops.screenshotScanning) {
		channel.send(messagetxtReplace(messagetxt.load)).then(msg => {
			if (ops.msgDeleteTime) {
				setTimeout(() => {
					msg.delete().catch(() => {
						console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${msg.url}\nContent of mesage: "${msg.content}"`);
					});
				}, ops.msgDeleteTime);
			}
		});
		channel.messages.fetch({ limit: 20 }).then(msgs => {
			const closeMsg = msgs.filter(msg => (msg.author == client.user) && (msg.content.startsWith("The bot") || msg.content == "Restarting..."));
			closeMsg.each((msg) => {
				msg.delete().catch(() => {
					console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${closeMsg.url}\nContent of mesage: "${closeMsg.content}"`);
				});
			});
		});
	}
	logs.send(messagetxtReplace(messagetxt.load));
	loaded = true;
	const activeServers = client.guilds.cache;
	const activeServerList = [];
	activeServers.each(serv => activeServerList.push(`"${serv.name}" aka #${serv.id}`));
	console.log(`\nActive in:\n${activeServerList.join("\n")}`);
	console.log(`\nServer started at: ${launchDate.toLocaleString()}. Loaded in guild: "${server.name}"#${server.id} ${(ops.screenshotScanning) ? `in channel: "${channel.name}"#${channel.id}` : ""}`);
	console.log("\n======================================================================================\n");
	});

client.on("guildAuditLogEntryCreate", async (entry, guild) => {
	if (!ops.respondVerify || !ops.verifiedRole || guild.id != ops.serverID) return;
	if (entry.action != Discord.AuditLogEvent.MemberRoleUpdate || !entry.targetId) return;
	const addedRoles = entry.changes.find(change => change.key == "$add")?.new || [];
	if (!addedRoles.some(role => role.id == ops.verifiedRole)) return;
	const member = await guild.members.fetch(entry.targetId).catch(() => null);
	if (!member) return;
	member.send(messagetxtReplace(messagetxt.respondVerify, member.user)).catch(() => {
		errorMessage(new Date(), false, `Error: I can not send a Verify DM message to ${member.user.username}#${member.user.id}`);
	});
});

client.on("interactionCreate", interaction => {
	handleInteraction(interaction, { enqueueImage, ensureDateFolder: checkDateFolder });
});

client.on("messageCreate", async message => {
	if (message.author.bot) return;
	const postedTime = new Date();
	const dm = message.channel.type == Discord.ChannelType.DM;
	if (!dm && (!message.guild || message.guild.id != ops.serverID)) return;

	if (!dm) {
		await handleCommand(message, postedTime);
		return;
	}

	if (ops.screenshotScanning && ops.dmScanning && message.attachments.size > 0) {
		await handleScreenshotSubmission(message, postedTime, enqueueImage, checkDateFolder);
		return;
	}
	if (ops.dmSymbolDenial && message.content.startsWith("$")) {
		await message.reply(`Commands starting with \`$\` belong to another bot. Use them in <#${ops.profileChannel}> after verification.`);
		return;
	}
	if (ops.dmSymbolDenial && ["/", "!", "?"].some(symbol => message.content.startsWith(symbol))) {
		await message.reply(`That command likely belongs to another bot.${ops.dmMail ? " Reply normally if you need staff help." : ""}`);
		return;
	}
	if (ops.dmMail) await mail.mailDM(message);
	else await message.reply(`This bot does not currently handle general DMs. Use \`/submit-profile\` in <#${ops.screenshotChannel}>.`);
});

if (ops.debugMode) {
	client.on("debug", (info) => {
		const d = new Date();
		const dateTime = `${d.getFullYear()}-${(d.getMonth() + 1 < 10) ? `0${d.getMonth() + 1}` : d.getMonth() + 1}-${(d.getDate() < 10) ? `0${d.getDate()}` : d.getDate()} ${(d.getHours() < 10) ? `0${d.getHours()}` : d.getHours()}:${(d.getMinutes() < 10) ? `0${d.getMinutes()}` : d.getMinutes()}:${(d.getSeconds() < 10) ? `0${d.getSeconds()}` : d.getSeconds()}.${(d.getMilliseconds() < 10) ? `00${d.getMilliseconds()}` : `${(d.getMilliseconds() < 100) ? `0${d.getMilliseconds()}` : `${d.getMilliseconds()}`}`}`;
		console.error(`[${dateTime}]: Debug info:.`, info);
	}).on("rateLimit", (data) => {
		console.error(`[${dateToTime(new Date())}]: Ratelimit hit:`, data);
	});
}

if (ops.processInfoMode) {
	process.on("beforeExit", (code) => {
		console.log(`[${dateToTime(new Date())}]: Process beforeExit event with code:`, code);
	})
		.on("disconnect", () => {
			console.log(`[${dateToTime(new Date())}]: Process disconnect`);
		})
		.on("exit", (code) => {
			console.log(`[${dateToTime(new Date())}]: Process exited with code:`, code);
		})
		.on("message", (message, sendHandle) => {
			console.log(`[${dateToTime(new Date())}]: Process emitted a message:`, message, "\nsendHandle:", sendHandle);
		})
		.on("multipleResolves", (type, promise, value) => {
			console.log(`[${dateToTime(new Date())}]: Process had a multipleResolves event with type:`, type, "\nPromise:", promise, "\nValue:", value);
		})
		.on("rejectionHandled", (promise) => {
			console.log(`[${dateToTime(new Date())}]: Process handled a rejection. Promise:`, promise);
		})
		.on("warning", (warning) => {
			console.log(`[${dateToTime(new Date())}]: Process warning: `, warning);
		})
		.on("worker", (worker) => {
			console.log(`[${dateToTime(new Date())}]: Process made a new worker: `, worker);
		});
	let memBeforeScan = process.memoryUsage();
	let memAfterScan = memBeforeScan;
	let memNow = memBeforeScan;
	logMemory("Start", memNow);
	process.on("logCurrentMemoryUsage", (state) => {
		if (state == 1) {
			memAfterScan = process.memoryUsage();
			logMemory("After", memAfterScan);
		} else if (state.id > 0) {
			memNow = process.memoryUsage();
			const memArr = [];
			for (const v in memNow) {
				memArr.push(`\n ${v}: ${Math.round(memNow[v] / 1024 / 1024 * 100) / 100} MB`);
			}
			const memDiff = [];
			for (const v in memBeforeScan) {
				memDiff.push(`\n ${v}: ${Math.round((memNow[v] - memBeforeScan[v]) / 1024 / 1024 * 100) / 100} MB`);
			}
			state.reply(`Current memory usage:${memArr} \n\nDifferences from last scan:${memDiff}`);
		} else {
			memBeforeScan = process.memoryUsage();
			logMemory("Before", memBeforeScan);
		}
	});
}

async function logMemory(state, mem) {
	const rss = Math.round(mem.rss / 1024 / 1024);
	const heapTot = Math.round(mem.heapTotal / 1024 / 1024);
	const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
	const external = Math.round(mem.external / 1024 / 1024 * 100) / 100;
	const arrayBuffers = Math.round(mem.arrayBuffers / 1024 / 1024 * 100) / 100;
	const memPath = path.resolve(__dirname, "./server/memory.txt");
	try {
		await fs.promises.access(memPath, fs.constants.W_OK);
		const d = new Date();
		const memString = `\n${d.toLocaleDateString()} ${d.toLocaleTimeString()}, ${state}, ${(state == "Before") ? imgStats.imageLogCount + 1 : imgStats.imageLogCount}, ${rss}, ${heapUsed}, ${heapTot}, ${external}, ${arrayBuffers}`;
		await fs.promises.appendFile(memPath, memString);
	} catch (e) {
		if (e.code == "ENOENT") {
			const memString = "timestamp, state, count, rss, heapUsed, heapTot, external, arrayBuffers";
			await fs.promises.appendFile(memPath, memString);
		} else console.error(e);
	}
}

client.on("error", (error) => {
	console.error(`[${dateToTime(new Date())}]: Client Error: ${error}`);
})
	.on("warn", (info) => {
		console.error(`[${dateToTime(new Date())}]: Client Waring: ${info}`);
	})
	.on("shardError", (error, id) => {
		console.error(`[${dateToTime(new Date())}]: Websocket disconnect: ${error}. ID: ${id}`);
	})
	.on("shardResume", () => {
		if (imgStats.currentlyImage > 0) {
			imgStats.imageLogCount++;
			imgStats.currentlyImage--;
			console.error(`[${dateToTime(new Date())}]: Balancing imageLogCount`);
		}
		if (loaded) {
			// console.error(`[${dateToTime(new Date())}]: Resumed! Refreshing Activity...`);
		client.user.setActivity(act, { type: Discord.ActivityType.Playing });
		}
	})
	.on("shardDisconnect", (evt, id) => {
		// console.error(`[${dateToTime(new Date())}]: Disconnected!`);
		console.log(evt, id);
	})
	.on("shardReady", (id, una) => {
		if (imgStats.currentlyImage > 0) {
			imgStats.imageLogCount++;
			imgStats.currentlyImage--;
			console.error(`[${dateToTime(new Date())}]: Balancing imageLogCount`);
		}
		if (loaded) {
			// console.error(`[${dateToTime(new Date())}]: Reconnected! Refreshing Activity...`);
			console.error(id, una);
				client.user.setActivity(act, { type: Discord.ActivityType.Playing });
		}
	})
	.on("shardReconnecting", () => {
		if (loaded) {
			// console.error(`[${dateToTime(new Date())}]: Reconnecting... [${id}]`);
		}
	});

process.on("uncaughtException", (err) => {
	if (imgStats.currentlyImage > 0) {
		imgStats.imageLogCount++;
		imgStats.currentlyImage--;
	}
	if (err != null) {
		const channel = (ops.screenshotScanning && ops.screenshotChannel) ? client.channels.cache.get(ops.screenshotChannel) : undefined;
		if (err.message.substr(0, 35) == "Error: UNKNOWN: unknown error, open") {
			console.error(`[${dateToTime(new Date())}]: Error: Known imageWrite crash. Consider turning off saveLocalCopy. This error should be handled correctly.`);
			if (ops.screenshotChannel) channel.send("An internal error occured. Please retry sending the screenshot(s) that failed.").then((errorMsg) => {
				setTimeout(() => {
					if (ops.msgDeleteTime > 0) {
						errorMsg.delete().catch(() => {
							console.error(`[${dateToTime(new Date())}]: Error: Could not delete message: ${errorMsg.url}\nContent of mesage: "${errorMsg.content}"`);
						});
					}
				}, ops.msgDeleteTime);
			});
		} else {
			console.error(`Uncaught Exception: ${err}${err.stack}`);
			if (ops.screenshotChannel) channel.send(`<@&${ops.modRole}> An unexpected internal error occured. Please give the developer this information:\n${err}${err.stack}`);
		}
	} else {
		console.error(err);
	}
})
	.on("unhandledRejection", (err, promise) => {
		try {
			if (err.substr(0, 35) == "Error: UNKNOWN: unknown error, open") {
				// do nothing
			} else {
				console.error(`[${dateToTime(new Date())}]: Unhandled rejection at `, promise, `reason: ${err}`);
			}
		} catch (e) {
			console.error(`[${dateToTime(new Date())}]: Unhandled rejection at `, promise, `reason: ${err}`);
		}
	})
	.on("SIGINT", () => {
		console.log(`Process ${process.pid} has been interrupted`);
		const channel = (ops.screenshotScanning && ops.screenshotChannel) ? client.channels.cache.get(ops.screenshotChannel) : undefined;
		if (ops.screenshotChannel) channel.send("The bot is sleeping now. Goodbye :wave:").then(() => {
			process.exit(1);
		});
		else process.exit(1);
	});

const originalConsoleLog = console.log;

console.log = function(...args) {
	if (args.includes("Empty page")) {
		console.trace("Trace for 'Empty page' log:");
	}
	originalConsoleLog.apply(console, args);
};
