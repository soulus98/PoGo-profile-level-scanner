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
			message.reply(`\`${prefix}${name}\` is not a valid command.`);
			return `, but it failed, as ${prefix}${name} not a valid command.`;
		}
		if (command.name == "modify-setting"){
			dataPush(data);
			data.push("\n**Settings:**");
			numbers = config.numbers;
			chars = config.chars;
			numberKeys = Object.keys(numbers);
			charsKeys = Object.keys(chars);
			numberDescriptions = configDescriptions.numbers;
			charsDescriptions = configDescriptions.chars;
			var y = 0;
			for(var x in numbers){
				data.push(`\`${numberKeys[y]}\` : \`${numbers[x]}\` ${numberDescriptions[x]}`);
				y++;
			}
			y = 0;
			for(var x in chars){
				data.push(`\`${charsKeys[y]}\` : \`${chars[x]}\` ${charsDescriptions[x]}`);
				y++;
			}
			data.push("All channels and roles must be **only** the id in numbers, no other characters");
			message.reply(data, { split: true });
			return `, and it was successful.`;
		}
		if (command.name == "toggle-setting"){
			dataPush(data);
			data.push("\n**Settings:**");
			toggles = config.toggles;
			togglesKeys = Object.keys(toggles);
			togglesDescriptions = configDescriptions.toggles;
			var y = 0;
			for(var x in toggles){
				data.push(`\`${togglesKeys[y]}\` : \`${toggles[x]}\` ${togglesDescriptions[x]}`);
				y++;
			}
			message.reply(data, { split: true });
			return `, and it was successful.`;
		}
		try {
			dataPush(data);
			message.reply(data, { split: true });
			return `, and it was successful.`;
		} catch(err){
			return `, but it failed, due to an unexpected error. Error: ${err}`;
		}
		function dataPush(data){
			data.push(`\n**Name:** ${command.name}`);
			if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
			if (command.description) data.push(`**Description:** ${command.description}`);
			if (command.usage) data.push(`**Usage:** ${command.usage}`);
			if (command.usage) data.push(`**Cooldown:** ${command.cooldown} second(s)`);
			return data;
		}
	},
};
