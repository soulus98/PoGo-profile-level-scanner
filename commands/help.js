const config = require("../config.json");
const configDescriptions = require("../configDescriptions.json");
const prefix = config.chars.prefix;
module.exports = {
	name: "help",
	description: "Displays all commands and information for specific commands.",
  aliases: ["command", "commands"],
  usage: `\`${prefix}help [command name]\``,
	execute(message, args) {
    const data = [];
    const { commands } = message.client;
		if (message.channel.type === "dm"){
			message.lineReplyNoMention("There is no reason to request help in a dm. Please do so in the relevant server");
			return;
		}
		if (!message.channel.permissionsFor(message.author).has("MANAGE_GUILD")){
			message.lineReplyNoMention(`Hey trainer,

Welcome to the server!
To confirm that you are at least level 30, we need you to send a screenshot of your Pokémon GO profile.
Please do so in this channel.

Thank you. `);
			return;
		} else {
			if (!args.length) {
				data.push("Here's a list of all my commands:");
				data.push(commands.map(command => "\`" + prefix + command.name).join("\`\n"));
				data.push(`\`\nYou can use \`${prefix}help [command name]\` for information on a specific command.`);
				message.lineReplyNoMention(data, { split: true });
				return `, and it was successful.`;
			}
			const name = args[0].toLowerCase();
			const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
			if (!command) {
				message.lineReply(`\`${prefix}${name}\` is not a valid command.`);
				return `, but it failed, as ${prefix}${name} not a valid command.`;
			}
			try {
				dataPush(data);
				message.lineReplyNoMention(data, { split: true });
				return `, and it was successful.`;
			} catch(err){
				return `, but it failed, due to an unexpected error. Error: ${err}
Stack: ${err.stack}`;
			}
			function dataPush(data){
				data.push(`\n**Name:** ${command.name}`);
				if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
				if (command.description) data.push(`**Description:** ${command.description}`);
				if (command.usage) data.push(`**Usage:** ${command.usage}`);
				if (command.cooldown) data.push(`**Cooldown:** ${command.cooldown} second(s)`);
				return data;
			}
		}

	},
};
