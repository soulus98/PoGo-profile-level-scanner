const { dateToTime, dev } = require("../func/misc.js");

async function handleCommand(m, postedTime){
  const message = await m.fetch();
  let prefix;
  if (message.content.startsWith(ops.prefix)) {
    prefix = ops.prefix;
  } else if (message.content.startsWith(ops.prefix2)) {
    prefix = ops.prefix2;
  } else return;
  if (prefix.length == 0) return;
  const client = message.client;
  // finangling the command and argument vars
  const member = await m.guild.members.fetch(message.author.id, true);
  const args = message.content.slice(prefix.length).trim().split(" ");
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); // this searches aliases
  // a bunch of checking
  if (!command) return; 																						// is it a command
  let logString = `[${dateToTime(postedTime)}]: ${message.author.username}${message.author} used ${prefix}${commandName}`;
  if (command.guildOnly && message.channel.type === "dm") { 				// dm checking
    logString = logString + `, but it failed, as ${prefix}${commandName} cannot be used in a DM`;
    console.log(logString);
    return message.reply("This command cannot be used in a DM");
  }
  if (command.permissions && message.author.id != dev) {																				// Permission checking
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      logString = logString + `, but it failed, as ${prefix}${commandName} requires ${command.permissions}, and the user does not possess it.`;
      console.log(logString);
      return message.reply(`You must possess the ${command.permissions} permission to execute \`${prefix}${commandName}\``);
    }
  } else if (!(member.roles.cache.has(ops.modRole) || member.permissions.has("ADMINISTRATOR")) && message.author.id != dev) return;
  if (command.args && !args.length) {																// Checking for arguments if an argument is required
    let reply = "You didn't provide any arguments.";
    if (command.usage) {
      reply += `\nThe proper usage would be: ${command.usage}`;
    }
    logString = logString + ", but it failed, as it requires arguments, and none were provided.";
    console.log(logString);
    return message.reply(reply);
  }
  // command execution
  try {
		if (message.channel.type === "dm") {
      logString = logString + " (in a DM)";
    }
    command.execute(message, args).then((addToLogString) => {
      if (addToLogString == undefined) {
        console.log(logString);
      } else {
        console.log(logString + addToLogString);
      }
    });
  } catch (error) {
    console.error(error);
    message.reply("An error occured while trying to run that command.");
  }
}

module.exports = { handleCommand };
