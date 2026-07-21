const { ChannelType, Collection, MessageFlags } = require("discord.js");
const mail = require("./dm.js");
const { saveStats } = require("../func/stats.js");
const { dateToTime, errorMessage, performanceLogger } = require("../func/misc.js");

function extensionFor(attachment) {
	const source = attachment.name || attachment.url.split("?")[0];
	return source.includes(".") ? source.split(".").pop().toLowerCase() : "";
}

function createInteractionSubmission(interaction, attachment) {
	let responded = false;
	return {
		source: "guild-slash",
		interaction,
		client: interaction.client,
		guild: interaction.guild,
		channel: interaction.channel,
		author: interaction.user,
		member: interaction.member,
		memb: interaction.member,
		content: "",
		attachments: new Collection([[attachment.id, attachment]]),
		createdAt: new Date(interaction.createdTimestamp),
		createdTimestamp: interaction.createdTimestamp,
		url: `interaction:${interaction.id}`,
		async reply(payload) {
			const data = typeof payload == "string" ? { content: payload } : { ...payload };
			delete data.allowedMentions;
			if (!responded) {
				responded = true;
				return interaction.editReply(data);
			}
			return interaction.followUp({ ...data, flags: MessageFlags.Ephemeral });
		},
		async react() {
			return null;
		},
		async delete() {
			return null;
		},
	};
}

async function handleScreenshotSubmission(message, postedTime, enqueueImage, ensureDateFolder) {
	const dm = message.channel.type == ChannelType.DM;
	const server = message.client.guilds.cache.get(ops.serverID);
	const logs = ops.logsChannel ? message.client.channels.cache.get(ops.logsChannel) : undefined;
	const image = message.attachments.first();
	if (!image) return false;

	if (ops.performanceMode) performanceLogger(`\n\n\n#${imgStats.imageLogCount + 1}: Image received\t`, postedTime.getTime());
	if (dm) {
		message.memb = await server.members.fetch(message.author.id).catch(() => null);
		saveStats("dm");
	} else if (!message.memb) {
		message.memb = message.member || await server.members.fetch(message.author.id).catch(() => null);
	}

	const screenshotChannel = ops.screenshotScanning && ops.screenshotChannel
		? message.client.channels.cache.get(ops.screenshotChannel)
		: undefined;
	if (!dm && !screenshotChannel) {
		await message.reply("The screenshot channel is not configured correctly. Please tell a moderator.");
		return true;
	}
	if (!dm && message.channel.id != screenshotChannel.id) {
		await message.reply(`Please use this command in ${screenshotChannel}.`);
		return true;
	}

	if (ops.saveLocalCopy) await ensureDateFolder(postedTime);
	const fileType = extensionFor(image);
	const acceptedFileTypes = ["png", "jpg", "jpeg", "jfif", "tiff", "bmp"];
	if (!image.contentType || !image.contentType.startsWith("image/") || !acceptedFileTypes.includes(fileType)) {
		if (ops.dmMail && dm) {
			await mail.mailDM(message, "wrong");
			return true;
		}
		errorMessage(postedTime, dm, `${message.author.username}${message.author} sent an invalid image type: ${fileType || "unknown"}`);
		if (logs) await logs.send({ content: `${dm ? "Sent in a DM\n" : ""}User: ${message.author}\nInvalid image type: ${fileType || "unknown"}`, files: [image] });
		await message.reply(`I cannot scan this file type${fileType ? `: \`.${fileType}\`` : ""}. Please upload a supported image.`);
		saveStats("wrong");
		return true;
	}
	if (!image.height || !image.width || image.height < 50 || image.width < 50) {
		if (ops.dmMail && dm) {
			await mail.mailDM(message, "tiny");
			return true;
		}
		if (logs) await logs.send({ content: `${dm ? "Sent in a DM\n" : ""}User: ${message.author}\nEmpty/tiny image. Not scanned.`, files: [image] });
		await message.reply("I cannot scan tiny images or images with no size information.");
		saveStats("wrong");
		return true;
	}
	if (image.size / 1048576 > 15) {
		if (logs) await logs.send({ content: `${dm ? "Sent in a DM\n" : ""}User: ${message.author}\nImage over 15 MB. Not scanned.` });
		await message.reply("I cannot handle an image larger than 15 MB.");
		saveStats("wrong");
		return true;
	}
	if (!message.memb) {
		if (ops.dmMail && dm) {
			await mail.mailDM(message, "left");
			return true;
		}
		if (logs) await logs.send({ content: `${dm ? "Sent in a DM\n" : ""}User: ${message.author}\nMember not found. Not scanned.`, files: [image] });
		await message.reply("I could not find you in the configured server.");
		saveStats("left");
		return true;
	}
	if (ops.blacklistRole && ops.blacklistRole != "0" && message.memb.roles.cache.has(ops.blacklistRole)) {
		if (ops.dmMail && dm) {
			await mail.mailDM(message, "man-black");
			return true;
		}
		if (logs) await logs.send({ content: `User: ${message.author}\nNot scanned due to manual blacklist <@&${ops.blacklistRole}>.`, files: [image] });
		await message.reply("This screenshot was not scanned because your account is manually restricted. Please contact staff.");
		saveStats("black");
		return true;
	}

	const configuredRoleIds = [ops.targetLevelRole, ops.level40Role, ops.level50Role].filter(id => id && id != "0");
	if (configuredRoleIds.length && configuredRoleIds.every(id => message.memb.roles.cache.has(id))) {
		if (ops.dmMail && dm) {
			await mail.mailDM(message, "all");
			return true;
		}
		if (logs) await logs.send({ content: `User: ${message.author}\nAll configured screenshot roles already possessed.`, files: [image] });
		await message.reply("You already have all available profile roles.");
		saveStats("all");
		return true;
	}
	if (ops.blacklistTime > 0 && blacklist.has(message.author.id)) {
		const timeLeft = ops.blacklistTime - (postedTime.getTime() - blacklist.get(message.author.id));
		if (timeLeft > 0) {
			if (ops.dmMail && dm) {
				await mail.mailDM(message, "black");
				return true;
			}
			if (logs) await logs.send({ content: `User: ${message.author}\nAutomatic blacklist. Time left: ${(timeLeft / 3600000).toFixed(1)} hours.`, files: [image] });
			await message.reply(`You must wait ${(timeLeft / 3600000).toFixed(1)} hours before submitting another screenshot.`);
			saveStats("black");
			return true;
		}
		blacklist.delete(message.author.id);
		console.log(`[${dateToTime(postedTime)}]: Removed ${message.author.username}${message.author} from the expired blacklist.`);
	}

	if (message.source == "guild-slash") await message.reply("Screenshot accepted and queued for scanning. I will send another private update if it needs attention.");
	enqueueImage(message, postedTime);
	return true;
}

module.exports = { createInteractionSubmission, handleScreenshotSubmission };
