const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionsBitField,
} = require("discord.js");
const { dateToTime, dev } = require("../func/misc.js");

const publicRoutes = new Map([
	["help", ["help", []]],
	["ping", ["check-server-ping", []]],
	["version", ["version", []]],
	["ver", ["version", []]],
]);

function parseAdminRoute(tokens) {
	const [area, action, ...rest] = tokens;
	if (area == "help") return ["help", ["admin"]];
	if (area == "config" && action == "show") return ["show-settings", rest];
	if (area == "config" && action == "set") return ["modify-setting", rest];
	if (area == "config" && action == "toggle") return ["toggle-setting", rest];
	if (area == "stats") return ["statistics", tokens.slice(1)];
	if (area == "diagnostics" && action == "cache") return ["cache-amounts", rest];
	if (area == "diagnostics" && action == "memory") return ["check-memory-usage", rest];
	if (area == "scan" && action == "confirm") return ["confirm-screenshot", rest];
	if (area == "scan" && action == "revert") return ["revert-screenshot-role", rest];
	if (area == "scan" && action == "clear-blacklist") return ["clear-blacklist", rest];
	if (area == "process" && action == "restart") return ["restart-bot-server", rest];
	if (area == "process" && action == "quit") return ["force-quit", rest];
	return null;
}

function isStaff(member) {
	return Boolean(member && (
		member.roles.cache.has(ops.modRole)
		|| member.permissions.has(PermissionsBitField.Flags.Administrator)
	));
}

function isOwner(userId) {
	let configured = [];
	try {
		const keys = require("../server/keys.json");
		configured = Array.isArray(keys.ownerIds) ? keys.ownerIds.map(String) : [];
	} catch {
		// The original developer ID remains the safe fallback.
	}
	return userId == dev || configured.includes(userId);
}

async function confirmDangerousAction(message, label) {
	const confirmId = `admin-confirm:${message.author.id}:${Date.now()}`;
	const cancelId = `admin-cancel:${message.author.id}:${Date.now()}`;
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId(confirmId).setLabel(`Confirm ${label}`).setStyle(ButtonStyle.Danger),
		new ButtonBuilder().setCustomId(cancelId).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
	);
	const prompt = await message.reply({
		content: `Confirm **${label}** within 30 seconds.`,
		components: [row],
		allowedMentions: { repliedUser: false },
	});
	const interaction = await prompt.awaitMessageComponent({
		filter: button => button.user.id == message.author.id && [confirmId, cancelId].includes(button.customId),
		time: 30000,
	}).catch(() => null);
	if (!interaction) {
		await prompt.edit({ content: `${label} timed out.`, components: [] });
		return false;
	}
	if (interaction.customId == cancelId) {
		await interaction.update({ content: `${label} cancelled.`, components: [] });
		return false;
	}
	await interaction.update({ content: `${label} confirmed.`, components: [] });
	return true;
}

async function handleCommand(message, postedTime) {
	if (!message.guild || message.guild.id != ops.serverID) return false;
	const mentionPattern = new RegExp(`^<@!?${message.client.user.id}>\\s*`);
	if (!mentionPattern.test(message.content)) return false;

	const body = message.content.replace(mentionPattern, "").trim();
	const tokens = body ? body.split(/\s+/) : [];
	let route;
	let admin = false;
	let staffShortcut = false;
	if (tokens[0] == "admin") {
		admin = true;
		route = parseAdminRoute(tokens.slice(1));
	} else if (["c", "confirm"].includes(tokens[0]?.toLowerCase())) {
		staffShortcut = true;
		route = ["confirm-screenshot", tokens.slice(1)];
	} else if (tokens[0]?.toLowerCase() == "revert") {
		staffShortcut = true;
		route = ["revert-screenshot-role", tokens.slice(1)];
	} else {
		route = publicRoutes.get((tokens[0] || "help").toLowerCase());
	}

	if (!route) {
		await message.reply({
			content: admin
				? "Unknown admin command. Use `@Bot admin help`."
				: "Use `@Bot help` for profile help or `@Bot admin help` for staff commands.",
			allowedMentions: { repliedUser: false },
		});
		return true;
	}

	if ((admin || staffShortcut) && !isStaff(message.member) && !isOwner(message.author.id)) {
		await message.reply({ content: "You are not allowed to use admin commands.", allowedMentions: { repliedUser: false } });
		return true;
	}

	const [commandName, args] = route;
	const processCommand = commandName == "restart-bot-server" || commandName == "force-quit";
	if (processCommand && !isOwner(message.author.id)) {
		await message.reply({ content: "Only a configured bot owner can control the process.", allowedMentions: { repliedUser: false } });
		return true;
	}
	if (processCommand && !(await confirmDangerousAction(message, commandName == "force-quit" ? "bot shutdown" : "bot restart"))) return true;
	if (commandName == "clear-blacklist" && args[0] == "all" && !(await confirmDangerousAction(message, "clear the entire blacklist"))) return true;

	const command = message.client.commands.get(commandName);
	if (!command) {
		await message.reply("That command is not currently enabled by the bot configuration.");
		return true;
	}
	const canInferTicketUser = commandName == "confirm-screenshot"
		&& message.channel.parentId == ops.mailCategory;
	if (command.args && !args.length && !canInferTicketUser) {
		await message.reply(`Missing arguments. Use \`@Bot ${admin ? "admin " : ""}help\` for usage.`);
		return true;
	}

	const logPrefix = `[${dateToTime(postedTime)}]: ${message.author.username}${message.author} used mention command ${commandName}`;
	try {
		const addToLogString = await command.execute(message, args);
		console.log(logPrefix + (addToLogString || ""));
	} catch (error) {
		console.error(error);
		await message.reply("An error occurred while trying to run that command.");
	}
	return true;
}

module.exports = { handleCommand, isStaff };
