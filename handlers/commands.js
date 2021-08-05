const prefix = require("../config.json").chars.prefix;
const {dateToTime} = require("../fun/dateToTime.js");

function handleCommand(message,postedTime){
  let time = dateToTime(postedTime);
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
  if(command.cooldown){																							//per-author cooldown checking
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (currentTime < expirationTime) {
        const timeLeft = (expirationTime - currentTime) / 1000;
        logString = logString + `, but it failed, as ${prefix}${commandName} was on cooldown from this user at the time.`;
        console.log(logString);
        return message.lineReply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${prefix}${command.name}\` command.`);
      }
    }
    timestamps.set(message.author.id, currentTime);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
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
