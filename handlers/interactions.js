const { Collection, MessageFlags } = require("discord.js");
const mail = require("./dm.js");
const { isStaff } = require("./commands.js");
const { createInteractionSubmission, handleScreenshotSubmission } = require("./submissions.js");
const { dateToTime } = require("../func/misc.js");

function createTicketInput(interaction, content, attachment) {
	let responseCount = 0;
	const attachments = new Collection();
	if (attachment) attachments.set(attachment.id, attachment);
	return {
		source: "ticket-slash",
		client: interaction.client,
		guild: interaction.guild,
		channel: interaction.channel,
		channelId: interaction.channelId,
		author: interaction.user,
		member: interaction.member,
		content: content || "",
		attachments,
		createdAt: new Date(interaction.createdTimestamp),
		createdTimestamp: interaction.createdTimestamp,
		url: `interaction:${interaction.id}`,
		async reply(payload) {
			const data = typeof payload == "string" ? { content: payload } : { ...payload };
			delete data.allowedMentions;
			if (responseCount++ == 0) return interaction.editReply(data);
			return interaction.followUp({ ...data, flags: MessageFlags.Ephemeral });
		},
		async delete() {
			return null;
		},
		async react(emoji) {
			return interaction.editReply({ content: `${emoji} Done.` });
		},
	};
}

function addMentionedUser(input, user) {
	input.mentions = {
		users: user ? new Collection([[user.id, user]]) : new Collection(),
	};
	return input;
}

async function handleScreenshotAdminCommand(interaction) {
	if (!isStaff(interaction.member)) {
		await interaction.reply({ content: "You are not allowed to moderate screenshots.", flags: MessageFlags.Ephemeral });
		return;
	}
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	if (!ops.screenshotScanning) return interaction.editReply("Screenshot scanning is disabled.");

	const action = interaction.options.getSubcommand();
	const user = interaction.options.getUser("user");
	const input = addMentionedUser(createTicketInput(interaction, ""), user);
	if (action == "confirm") {
		const inTicket = interaction.channel.parentId == ops.mailCategory;
		if (!user && !inTicket) return interaction.editReply("Select a user, or run this command inside their modmail ticket.");
		const level = interaction.options.getInteger("level");
		const args = user
			? [user.id, ...(level == null ? [] : [String(level)])]
			: (level == null ? [] : [String(level)]);
		await interaction.client.commands.get("confirm-screenshot").execute(input, args);
		return;
	}
	if (action == "revert") {
		await interaction.client.commands.get("revert-screenshot-role").execute(input, [user.id]);
		return;
	}
	return interaction.editReply("Unknown screenshot action.");
}

async function handleTicketCommand(interaction) {
	if (!isStaff(interaction.member)) {
		await interaction.reply({ content: "You are not allowed to manage tickets.", flags: MessageFlags.Ephemeral });
		return;
	}
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const action = interaction.options.getSubcommand();
	if (!ops.dmMail) return interaction.editReply("The mail feature is disabled.");
	const ticketBoundActions = ["reply", "close", "close-after", "timer-cancel", "sync", "info"];
	if (ticketBoundActions.includes(action) && (!interaction.channel.parentId || interaction.channel.parentId != ops.mailCategory || interaction.channelId == ops.mailLogChannel)) {
		return interaction.editReply(`Use this ticket action inside a ticket channel under <#${ops.mailCategory}>.`);
	}
	const message = interaction.options.getString("message") || "";
	const attachment = interaction.options.getAttachment("attachment");
	const input = createTicketInput(interaction, message, attachment);

	if (action == "reply") {
		if (!message && !attachment) return input.reply("Provide a message, an attachment, or both.");
		await mail.reply(input, message || "emptyMessageLongStringToAvoidPotentialAccidentLol");
		return input.reply("Reply sent.");
	}
	if (action == "open") {
		const user = interaction.options.getUser("user", true);
		input.content = user.id;
		await mail.hostOpen(input, user.id);
		return input.reply(`Ticket opened with ${user}.`);
	}
	if (action == "close") {
		await input.reply("Closing this ticket...");
		await mail.close(input, interaction.options.getString("reason") || "");
		return;
	}
	if (action == "close-after") {
		const hours = interaction.options.getNumber("hours", true);
		const reason = interaction.options.getString("reason") || "";
		const command = interaction.client.commands.get("timed-close-mail-ticket");
		const timerInput = {
			...input,
			async reply(payload) {
				return interaction.channel.send(typeof payload == "string" ? { content: payload } : payload);
			},
			async react() {
				return null;
			},
		};
		await command.execute(timerInput, [String(hours), ...reason.split(/\s+/).filter(Boolean)]);
		return input.reply(`This ticket will close in ${hours} hour${hours == 1 ? "" : "s"}.`);
	}
	if (action == "timer-cancel") {
		const result = await mail.deleteAndClearTimer(interaction.channelId);
		return input.reply(result == "not found" ? "There is no close timer for this ticket." : "Close timer cancelled.");
	}
	if (action == "timers") return input.reply(mail.printCloseList());
	if (action == "sync") {
		const user = interaction.options.getUser("user", true);
		await mail.sync(input, user.id);
		return input.reply(`This ticket is now linked to ${user}.`);
	}
	if (action == "info") return input.reply(await mail.ticketInfo(input));
	return input.reply("Unknown ticket action.");
}

async function handleReviewButton(interaction) {
	if (!isStaff(interaction.member)) {
		await interaction.reply({ content: "Only staff can use screenshot review buttons.", flags: MessageFlags.Ephemeral });
		return;
	}
	let id;
	try {
		id = interaction.message.mentions.members.first().id;
	} catch {
		await interaction.update({ components: [], content: `${interaction.message.content}\nEdit: Member Left Server` });
		return;
	}
	await interaction.deferUpdate();
	if (interaction.customId == "canc") {
		const originalContent = interaction.message.content.split("\n");
		originalContent.pop();
		await interaction.message.edit({ components: [], content: originalContent.join("\n") + `\nEdit: buttons cancelled <t:${Math.round(Date.now() / 1000)}:R>` });
		return;
	}
	const level = interaction.customId == "app" ? undefined : ops.targetLevel - 1;
	const logString = await interaction.client.commands.get("confirm-screenshot").execute(interaction, [id, level], "button");
	const originalContent = interaction.message.content.split("\n");
	originalContent.pop();
	await interaction.message.edit({ components: [], content: originalContent.join("\n") + `\nEdit: Action Completed <t:${Math.round(Date.now() / 1000)}:R>` });
	console.log(`[${dateToTime(new Date())}]: ${interaction.user.username}${interaction.user} used a review button${logString} for user ${id}`);
}

async function handleInteraction(interaction, services) {
	try {
		if (interaction.isChatInputCommand()) {
			if (!interaction.guild || interaction.guild.id != ops.serverID) {
				await interaction.reply({ content: "This command is not enabled in this server.", flags: MessageFlags.Ephemeral });
				return;
			}
			if (interaction.commandName == "ticket") return handleTicketCommand(interaction);
			if (interaction.commandName == "screenshot") return handleScreenshotAdminCommand(interaction);
			if (interaction.commandName == "submit-profile") {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				const attachment = interaction.options.getAttachment("screenshot", true);
				const submission = createInteractionSubmission(interaction, attachment);
				return handleScreenshotSubmission(submission, new Date(), services.enqueueImage, services.ensureDateFolder);
			}
		}
		if (interaction.isButton()) {
			if (["mailSend", "mailCancel"].includes(interaction.customId)) return;
			if (interaction.customId.startsWith("admin-confirm:") || interaction.customId.startsWith("admin-cancel:")) return;
			if (["app", "rej", "canc"].includes(interaction.customId)) return handleReviewButton(interaction);
		}
	} catch (error) {
		console.error("Interaction failed:", error);
		const payload = { content: "That action failed unexpectedly. The error has been logged.", flags: MessageFlags.Ephemeral };
		if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => null);
		else await interaction.reply(payload).catch(() => null);
	}
}

module.exports = { handleInteraction };
