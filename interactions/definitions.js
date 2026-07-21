const { SlashCommandBuilder } = require("discord.js");

const commands = [
	new SlashCommandBuilder()
		.setName("submit-profile")
		.setDescription("Submit a Pokémon GO profile screenshot for level verification")
		.setDMPermission(false)
		.addAttachmentOption(option => option
			.setName("screenshot")
			.setDescription("Your full Pokémon GO trainer profile screenshot")
			.setRequired(true)),
	new SlashCommandBuilder()
		.setName("screenshot")
		.setDescription("Staff screenshot moderation actions")
		.setDMPermission(false)
		.addSubcommand(subcommand => subcommand
			.setName("confirm")
			.setDescription("Confirm a member's screenshot level")
			.addUserOption(option => option
				.setName("user")
				.setDescription("Member to confirm; optional inside a modmail ticket"))
			.addIntegerOption(option => option
				.setName("level")
				.setDescription("Detected trainer level; omit to approve without a level")
				.setMinValue(1)
				.setMaxValue(80)))
		.addSubcommand(subcommand => subcommand
			.setName("revert")
			.setDescription("Remove screenshot roles and blacklist a member")
			.addUserOption(option => option
				.setName("user")
				.setDescription("Member whose screenshot roles should be reverted")
				.setRequired(true))),
	new SlashCommandBuilder()
		.setName("ticket")
		.setDescription("Manage staff mail tickets")
		.setDMPermission(false)
		.addSubcommand(subcommand => subcommand
			.setName("reply")
			.setDescription("Reply to the user linked to this ticket")
			.addStringOption(option => option
				.setName("message")
				.setDescription("Message to send to the user")
				.setMaxLength(4000))
			.addAttachmentOption(option => option
				.setName("attachment")
				.setDescription("Optional file to send with the reply")))
		.addSubcommand(subcommand => subcommand
			.setName("open")
			.setDescription("Open a ticket with a server member")
			.addUserOption(option => option
				.setName("user")
				.setDescription("Member to open the ticket with")
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName("close")
			.setDescription("Close the current ticket")
			.addStringOption(option => option
				.setName("reason")
				.setDescription("Reason shown to the user")
				.setMaxLength(1000)))
		.addSubcommand(subcommand => subcommand
			.setName("close-after")
			.setDescription("Close the current ticket after a delay")
			.addNumberOption(option => option
				.setName("hours")
				.setDescription("Delay in hours (0.1 to 48)")
				.setMinValue(0.1)
				.setMaxValue(48)
				.setRequired(true))
			.addStringOption(option => option
				.setName("reason")
				.setDescription("Reason shown when the ticket closes")
				.setMaxLength(1000)))
		.addSubcommand(subcommand => subcommand
			.setName("timer-cancel")
			.setDescription("Cancel the close timer for the current ticket"))
		.addSubcommand(subcommand => subcommand
			.setName("timers")
			.setDescription("List active ticket close timers"))
		.addSubcommand(subcommand => subcommand
			.setName("sync")
			.setDescription("Repair the current ticket's user mapping")
			.addUserOption(option => option
				.setName("user")
				.setDescription("Member linked to this ticket")
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName("info")
			.setDescription("Show the user and state linked to this ticket")),
];

module.exports = { commandData: commands.map(command => command.toJSON()) };
