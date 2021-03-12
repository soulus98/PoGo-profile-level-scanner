const { prefix } = require("../config.json");
module.exports = {
	name: "help",
	description: "Displays all commands and information for specific commands.",
  aliases: ["command", "commands"],
  usage: `\`${prefix}help [command name]\``,
	cooldown: 0.1,
	execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
			data.push("Here's a list of all my commands:");
			data.push(commands.map(command => "\`" + prefix + command.name).join("\`\n"));
			data.push(`\`\nYou can use \`${prefix}help [command name]\` for information on a specific command.`);
			return message.reply(data, { split: true });
    }
		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
		if (!command) {
			return message.reply(`${prefix}${command} is not a valid command.`);
		}
		data.push(`\n**Name:** ${command.name}`);
		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${command.name} ${command.usage}`);
		if (command.usage) data.push(`**Cooldown:** ${command.cooldown} second(s)`);
		message.reply(data, { split: true });
	},
};
