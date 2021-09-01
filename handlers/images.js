const { createWorker, PSM } = require("tesseract.js"),
Discord = require("discord.js"),
			{ crop } = require("../func/crop.js"),
			{ saveFile } = require("../func/saveFile.js"),
			{ performanceLogger } = require("../func/performanceLogger.js"),
			{ dateToTime } = require("../func/dateToTime.js");
let logs = {};

function handleImage(message, postedTime, wasDelayed){
	return new Promise((resolve, reject) => {
		let logMsg = {}; // testo
		const image = message.attachments.first();
		const currentTime = Date.now();
		let logString = `[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} sent image#${imgStats.imageLogCount + 1}`;
		try {
			const logSend = new Promise((res) => {
				logs.send(`User: ${message.author} \n Loading...`).then((l) => {
					if (ops.performanceMode) performanceLogger("Log msg sent\t", postedTime.getTime());
					logMsg = l;
					res();
				}).catch((err) => {
					console.error(`[${dateToTime(postedTime)}]: Error: Could not send a message in the logs channel. Err: ${err}`);
					res();
				});
			});
			const logAdd = new Promise((res) => {
				if (wasDelayed == true){
					const delayAmount = Math.round((Date.now() - postedTime) / 1000);
					logString = logString + `. Delayed for ${delayAmount}s. There ${(imgStats.currentlyImage - 1 == 1) ? "is" : "are"} ${imgStats.currentlyImage - 1} more to process`;
					res();
				} else res();
			});
			Promise.all([logAdd, logSend]).then(() => {
				const writeFile = new Promise((res) => {
					if (ops.saveLocalCopy){
						saveFile(image).then(() => {
							if (ops.performanceMode) performanceLogger("Written to disk\t", postedTime.getTime());
							res();
						}).catch((err) => {
							console.error(`[${dateToTime(postedTime)}]: Error writing to disk: ${err}`);
							res();
						});
					} else res();
				});
				writeFile.then(() => {
				if (ops.performanceMode) performanceLogger("Crop start\t", postedTime.getTime());
				crop(message).then((imgBuff) => {
					if (ops.performanceMode) performanceLogger("Crop finished\t", postedTime.getTime());
					const testSend = new Promise(function(res) {
						if (ops.testMode){
							const imgAttach = new Discord.MessageAttachment(imgBuff, image.url);
							message.lineReply("Test mode. This is the image fed to the OCR system:", imgAttach).then(() => {
								if (ops.performanceMode) performanceLogger("Test msg posted\t", postedTime.getTime());
								res();
							}).catch(() => {
								console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
								message.channel.send("Test mode. This is the image fed to the OCR system:", imgAttach).then(() => {
									if (ops.performanceMode) performanceLogger("Test msg posted\t", postedTime.getTime());
									res();
								});
							});
						} else {
							res();
						}
					});
					const saveCropped = new Promise(function(res) {
						if (ops.saveLocalCopy) {
							saveFile([image, imgBuff]).then(() => {
								if (ops.performanceMode) performanceLogger("Cropped written\t", postedTime.getTime());
								res();
							}).catch((err) => {
								console.error(`[${dateToTime(postedTime)}]: ${err}`);
							});
						} else {
							res();
						}
					});
					Promise.all([testSend, saveCropped]).then(() => {
						if (ops.performanceMode) performanceLogger("Recog starting\t", postedTime.getTime());
						if (!message.deleted) message.react("👀").catch(() => {
							console.error(`[${dateToTime(postedTime)}]: Error: Could not react 👀 (eyes) to message: ${message.url}\nContent of mesage: "${message.content}"`);
						});
						const worker = createWorker({
							// logger: m => console.log(m)
						});
						(async () => {
							await worker.load();
							// console.log(`Recognising: i#${instance}. iLC: ${imageLogCount}.`); //testo??
							await worker.loadLanguage("eng");
							await worker.initialize("eng");
							await worker.setParameters({
								tessedit_pageseg_mode: PSM.AUTO,
							});
							const { data: { text } } = await worker.recognize(imgBuff);
							await worker.terminate();
							// console.log("Image recognised. Result:" + text);
							let failed = false;
							let level = 0;
							try {
								level = text.match(/(\d\d)/)[0];
							} catch (err){
								failed = true;
								level = "Failure";
							}
							if (ops.testMode){
								message.lineReplyNoMention(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `).catch(() => {
									console.error(`[${dateToTime(postedTime)}]: Error: Could not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
									message.channel.send(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `);
								});
							}
							if (failed || level > 50 || level < 1){
								logs.send(`User: ${message.author}\nResult: Failed\nScanned text: \`${text}\``, image);
								logMsg.delete().catch(() => {
									console.error(`[${dateToTime(postedTime)}]: Error: Could not delete log message: ${logMsg.url}\nContent of mesage: "${logMsg.content}"`);
								});
								message.lineReply(`<@&${ops.modRole}> There was an issue scanning this image.`).catch(() => {
									console.error(`[${dateToTime(postedTime)}]: Error: Could not reply to message: ${message.url}\nContent of mesage: "${message.content}"`);
									message.channel.send(`<@&${ops.modRole}> There was an issue scanning this image.`);
								});
								message.react("❌").catch(() => {
									console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
								}); // dave, dm when image fails to scan
								message.author.send(`Sorry, ${message.author}, but there was an issue scanning your profile screenshot.
									Make sure you follow the example at the top of <#${ops.screenshotChannel}>.
									If part of your buddy is close to the level number, try rotating it out of the way.
									If there was a different cause, a moderator will be able to help manually approve you.`).catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not send DM to ${message.author.username}${message.author}`);
									});
									console.log(logString + `. I failed to find a number. Scanned text: ${text}.`);
									reject("Fail");
									return;
								} else { // this is the handler for role adding. It looks messy but is fine
									if (ops.performanceMode) performanceLogger("Recog finished\t", postedTime.getTime());
									message.client.commands.get("confirm").execute([message, postedTime], [message.author.id, level]).then((addToLogString) => {
										if (ops.performanceMode) performanceLogger("Roles confirmed. Total time:", postedTime.getTime());
										console.log(logString + addToLogString + ` Total processing time: ${(Date.now() - currentTime) / 1000}s`);
										logMsg.delete().catch(() => {
											console.error(`[${dateToTime(postedTime)}]: Error: Could not delete log message: ${logMsg.url}\nContent of mesage: "${logMsg.content}"`);
										});
									});
									resolve();
									if (ops.deleteScreens && !message.deleted) message.delete().catch(() => {
										console.error(`[${dateToTime(postedTime)}]: Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
									});
								}
							})();
						});
					}).catch((err) => {
						if (err == "crash"){
							console.error(`[${dateToTime(postedTime)}]: Error: An error occured while buffering "imgTwo".`);
							console.error(`[${dateToTime(postedTime)}]: Some info for soul:`);
							console.error("\nimage: ");
							console.error(image);
							logs.send(`User: ${message.author}\nThis image was posted during a crash...`, image);
						} else {
							console.error(`[${dateToTime(postedTime)}]: Error occured while cropping image: ${err}`);
						}
						reject();
						return;
					});
				});
			});
		} catch (error){ // this catch block rarely fires
			logString = logString + ", but an uncaught error occured.";
			console.log(logString);
			console.error(logString + ` Error: ${error}`);
			message.react("❌").catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			message.lineReply(`<@&${ops.modRole}> I can not scan this image due to an uncaught error. Err: ${error}`).catch(() => {
				console.error(`[${dateToTime(postedTime)}]: Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`<@&${ops.modRole}> I can not scan this image due to an uncaught error. Err: ${error}`);
			});
			reject();
			return;
		}
	});
}

function passImgServ(l) {
	return new Promise((res) => {
		logs = l;
		res();
	});
}

module.exports = { handleImage, passImgServ };
