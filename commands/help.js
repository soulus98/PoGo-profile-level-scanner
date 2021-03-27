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
			message.reply(data, { split: true });
			return `, and it was successful.`;
    }
		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
		if (!command) {
			message.reply(`${prefix}${name} is not a valid command.`);
			return `, but it failed, as ${prefix}${name} not a valid command.`;
		}
		if (command.name == "modify-setting" || "toggle-setting"){
			console.log("in toggle spot");
			return `, and it was successful.`;
		}
		try {
			data.push(`\n**Name:** ${command.name}`);
			if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
			if (command.description) data.push(`**Description:** ${command.description}`);
			if (command.usage) data.push(`**Usage:** ${command.usage}`);
			if (command.usage) data.push(`**Cooldown:** ${command.cooldown} second(s)`);
			message.reply(data, { split: true });
			return `, and it was successful.`;
		} catch(err){
			return `, but it failed, due to an unexpected error. Error: ${err}`;
		}
	},
};
