const Discord = require("discord.js"),
	{ crop } = require("../func/crop.js"),
	{ saveFile } = require("../func/saveFile.js"),
	{ recog } = require("../func/recog.js"),
	{ dateToTime, performanceLogger, replyNoMention, errorMessage } = require("../func/misc.js"),
	mail = require("../handlers/dm.js"),
	messagetxt = require("../server/messagetxt.js"),
	{ messagetxtReplace } = require("../func/misc.js");
const { postScreenshotReview } = require("../func/screenshotReview.js");

function handleImage(message, postedTime, wasDelayed) {
	return new Promise((resolve, reject) => {
		const dm = (message.channel.type == Discord.ChannelType.DM) ? true : false;
		const image = message.attachments.first();
		let logString = `[${dateToTime(postedTime)}]: ${(dm) ? "DM: " : ""}${message.author.username}${message.author} sent #${imgStats.imageLogCount + 1}`;
		try {
			const logAdd = new Promise((res) => {
				if (wasDelayed == true) {
					const delayAmount = Math.round((Date.now() - postedTime) / 1000);
					logString = logString + `. Delayed ${delayAmount}s. ${imgStats.currentlyImage - 1} more`;
					res();
				} else res();
			});
			logAdd.then(() => {
				const writeFile = new Promise((res) => {
					if (ops.saveLocalCopy) {
						saveFile(image).then(() => {
							if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Written to disk\t`, postedTime.getTime());
							res();
						}).catch((err) => {
							errorMessage(postedTime, dm, `Error writing to disk: ${err}`);
							res();
						});
					} else res();
				});
				writeFile.then(() => {
					const logs = (ops.logsChannel) ? message.client.channels.cache.get(ops.logsChannel) : undefined;
					if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Crop started\t`, postedTime.getTime());
					crop(message.attachments.first()).then((imgBuff) => {
						if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Crop finished\t`, postedTime.getTime());
						const testSend = new Promise(function(res) {
							if (ops.testMode && !dm) {
								const imgAttach = new Discord.AttachmentBuilder(imgBuff, { name: `ocr-${image.name || "image.png"}` });
								message.reply({ content: "Test mode. This is the image fed to the OCR system:", files: [imgAttach] }).then(() => {
									if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Test msg posted\t`, postedTime.getTime());
									res();
								}).catch(() => {
									errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
									message.channel.send({ content: "Test mode. This is the image fed to the OCR system:", files: [imgAttach] }).then(() => {
										if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Test msg posted\t`, postedTime.getTime());
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
									if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Cropped written\t`, postedTime.getTime());
									res();
								}).catch((err) => {
									errorMessage(postedTime, dm, `${err}`);
								});
							} else {
								res();
							}
						});
						Promise.all([testSend, saveCropped]).then(async () => {
							if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Recog starting\t`, postedTime.getTime());
							if (!dm) await message.react("👀").catch(() => {
								errorMessage(postedTime, dm, `Error: Could not react 👀 (eyes) to message: ${message.url}\nContent of mesage: "${message.content}"`);
							});
							try {
								const [level, failed, text] = await recog(imgBuff, message);
								if (ops.testMode && !dm) {
									replyNoMention(message, `Test mode. This image ${(failed) ? `failed. Scanned text: ${text}` : `was scanned at level: ${level}.`} `).catch(() => {
										errorMessage(postedTime, dm, `Error: Could not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
										message.channel.send(`Test mode. This image ${(failed) ? "failed." : `was scanned at level: ${level}.`} `);
									});
								}
								if (failed || level > 80 || level < 1) {
									console.log(logString + `. I failed to find a number. Scanned text: ${text}.`);
									if (dm && ops.dmMail) {
										mail.mailDM(message);
										reject();
										return;
									} else {
										logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nResult: Failed\nScanned text: \`${text}\``, files: [image] });
										if (!dm) await postScreenshotReview(message, image, text).catch((error) => {
											errorMessage(postedTime, dm, `Could not post screenshot for staff review: ${error.message}`);
										});
										message.react("❌").catch(() => {
											errorMessage(postedTime, dm, `Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
										});
										if (!dm) message.reply(messagetxtReplace(messagetxt.fail, message.author)).catch(() => {
											errorMessage(postedTime, dm, `Error: Could not reply to message: ${message.url}\nContent of mesage: "${message.content}"`);
											message.channel.send(messagetxtReplace(messagetxt.fail, message.author));
										});
										message.author.send(messagetxtReplace(messagetxt.failDm, message.author)).catch(() => {
											errorMessage(postedTime, dm, `Error: Could not send DM to ${message.author.username}${message.author}`);
										});
									}
									reject("Fail");
									return;
								} else { // this is the handler for role adding. It looks messy but is fine
									if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount + 1}: Recog finished\t`, postedTime.getTime());
									message.client.commands.get("confirm-screenshot").execute([message, postedTime], [message.author.id, level]).then(() => {
										if (ops.performanceMode) performanceLogger(`#${imgStats.imageLogCount}: Roles confirmed. Total time:`, postedTime.getTime());
										// (logString + addToLogString + ` Time: ${(Date.now() - currentTime) / 1000}s`);
									});
									resolve();
									if (!dm && ops.deleteScreens) message.delete().catch(() => {
										errorMessage(postedTime, dm, `Error: Could not delete message: ${message.url}\nContent of mesage: "${message.content}"`);
									});
								}
							} catch (error) {
								const errorSummary = (error instanceof Error ? error.message : String(error)).slice(0, 1000);
								errorMessage(postedTime, dm, `OCR engine failure: ${errorSummary}`);
								if (logs) {
									await logs.send({
										content: `${dm ? "Sent in a DM\n" : ""}User: ${message.author}\nOCR engine failure. Check the bot console for the concise error.`,
										files: [image],
									}).catch(() => null);
								}
								await message.reply("The OCR engine could not process that image. Staff have been notified; please try again shortly.").catch(() => null);
								reject("Fail");
							}
						});
					}).catch((err) => {
						if (err == "crash") {
							errorMessage(postedTime, dm, "Error: An error occured while buffering \"imgTwo\".");
							// errorMessage(postedTime, dm, "Some info for soul:");
							// console.error("\nimage: ");
							// console.error(image);
							logs.send({ content: `${(dm) ? "Sent in a DM\n" : ""}User: ${message.author}\nThis image was posted during a crash...`, files: [image] });
						} else {
							errorMessage(postedTime, dm, `Error occured while cropping image: ${err}`);
						}
						reject();
						return;
					});
				});
			});
		} catch (error) { // this catch block rarely fires
			logString = logString + ", but an uncaught error occured.";
			console.log(logString);
			console.error(logString + ` Error: ${error}`);
			message.react("❌").catch(() => {
				errorMessage(postedTime, dm, `Error: Could not react ❌ (red_cross) to message: ${message.url}\nContent of mesage: "${message.content}"`);
			});
			message.reply(`<@&${ops.modRole}> I can not scan this image due to an uncaught error. Err: ${error}`).catch(() => {
				errorMessage(postedTime, dm, `Error: I can not reply to ${message.url}${message.channel}.\nContent of mesage: "${message.content}. Sending a backup message...`);
				message.channel.send(`<@&${ops.modRole}> I can not scan this image due to an uncaught error. Err: ${error}`);
			});
			reject();
			return;
		}
	});
}

module.exports = { handleImage };
