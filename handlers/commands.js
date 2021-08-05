const prefix = require("../config.json").chars.prefix;
const {dateToTime} = require("../fun/dateToTime.js");

function handleCommand(message,postedTime){
  const client = message.client;
  if (!message.content.startsWith(prefix) || message.author.bot) return; //No prefix? Bot? Cancel
  //finangling the command and argument vars
  const args = message.content.slice(prefix.length).trim().split(" ");
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName)); //this searches aliases
  //a bunch of checking
  if (!command) return; 																						//is it a command
  logString = `[${dateToTime(postedTime)}]: User ${message.author.username}${message.author} used ${prefix}${commandName}`;
  if (command.guildOnly && message.channel.type === "dm") { 				//dm checking
    logString = logString + `, but it failed, as ${prefix}${commandName} cannot be used in a DM`;
    console.log(logString);
    return message.lineReply("This command cannot be used in a DM");
  }
  if (command.permissions) {																				//Permission checking
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      logString = logString + `, but it failed, as ${prefix}${commandName} requires ${command.permissions}, and the user does not possess it.`;
      console.log(logString);
      return message.lineReply(`You must possess the ${command.permissions} permission to execute \`${prefix}${commandName}\``);
    }
  }
  if (command.args && !args.length) {																//Checking for arguments if an argument is required
    let reply = `You didn't provide any arguments.`;
    if (command.usage) {
      reply += `\nThe proper usage would be: ${command.usage}`;
    }
    logString = logString + `, but it failed, as it requires arguments, and none were provided.`;
    console.log(logString);
    return message.lineReply(reply);
  }
  //command execution
  try {
    addToLogString = command.execute(message, args);
    if (addToLogString == undefined) {
      console.log(logString);
    } else {
      console.log(logString + addToLogString);
    }
  } catch (error) {
    console.error(error);
    message.lineReply("An error occured while trying to run that command.");
  }
};

module.exports = {handleCommand}