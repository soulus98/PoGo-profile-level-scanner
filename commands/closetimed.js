const mail = require("../handlers/dm.js");
module.exports = {
	name: "timed-close-mail-ticket",
	description: `closes a mail ticket after a certain amount of hours. Use \`${ops.prefix}tclose list\` to see all current timers or use \`${ops.prefix}tclose cancel\` to cancel the timer for this channel. The timer will automatically cancel if a reply is sent or received.`,
  aliases: ["tc", "tclose", "tclose-ticket", "close-timed", "close-timer", "timed-close", "timer-close"],
  usage: `\`${ops.prefix}tclose <hours> [reason]\``,
	guildOnly:true,
	args: true,
	mailOnly:true,
	type:"Mail",
	execute(message, args) {
		return new Promise(function(resolve) {
			if (args[0] == "list") {
				const list = mail.printCloseList();
				message.reply(list);
				return;
			}
			if (args[0] == "cancel") {
				mail.deleteAndClearTimer(message.channel.id).then((msg) => {
					if (msg == "not found") {
						message.reply("I could not find a timer for this channel");
						resolve(", but it failed, as no timer was found in the closeList.");
					} else {
						message.react("👍");
						resolve(` and cancelled ${message.channel.name}#${message.channel.id}`);
					}
				});
				return;
			}
      if (!ops.dmMail){
				message.reply(`The mail feature is not current active. Use \`${ops.prefix}toggle dmMail\` to turn it on.`);
				resolve(", but it failed, as dmMail was not toggled on.");
				return;
			}
      if (!message.channel.parent || message.channel.parentId != ops.mailCategory) {
				message.reply(`That command can only be used in the mail category: <#${ops.mailCategory}>. Use \`${ops.prefix}set mailCategory <id>\` to set it if it is incorrect.`);
        resolve(`, but it failed, as ${message.channel.name}${message.channel} is not in the mail category: ${ops.mailCategory}.`);
				return;
			}
			const timehr = (isNaN(args[0])) ? undefined : args[0];
			if (!timehr) {
				message.reply("I cannot discern an amount of hours from:`" + args[0] + "`");
				resolve(`, but it failed, as ${timehr} is not a number.`);
				return;
			}
			if (timehr > 48 || timehr < 0.1) {
				message.reply("I cannot set a timer greater than 48 hours or less than 0.1 (6 minutes)");
				resolve(`, but it failed, as ${timehr} is over 48 or under 0.1`);
				return;
			}
			const timems = args[0] * 3600000;
			args.splice(0, 1);
			message.react("👍");
			const t = setTimeout(() => {
				mail.close(message, args.join(" ")).then(() => {
					mail.deleteAndClearTimer(message.channel.id);
					resolve(` and successfully closed ${message.channel.name}#${message.channel.id} after ${timehr} hours.`);
				}).catch((log) => {
					message.reply(`I can not close <#${message.channel.id}> as it is not linked to a user. Tell <@146186496448135168> if this is in error.`);
					mail.deleteAndClearTimer(message.channel.id);
					resolve(log);
				});
			}, timems);
			mail.addToCloseList(t, message.channel.id, Date.now() + timems);
			return;
		});
	},
};
