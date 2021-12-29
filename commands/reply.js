const mail = require("../handlers/dm.js");
module.exports = {
	name: "reply-to-mail",
	description: "Used to reply to a mail ticket if dmAutoReply is turned off.",
  aliases: ["r", "reply"],
  usage: `\`${ops.prefix}r <message>\``,
	guildOnly:true,
	mailOnly:true,
	execute(message, args) {
		return new Promise(function(resolve, reject) {
      if (ops.dmMail){
				let content;
				if (args.length < 1) {
					if (message.attachments.first()) {
						content = "emptyMessageLongStringToAvoidPotentialAccidentLol";
					} else {
						message.reply("I can not send an empty message without a file attached");
						resolve(", but the message was empty.");
						return;
					}
				} else content = args.join(" ");
        if (message.channel.parent && message.channel.parent.id == ops.mailCategory) {
					mail.reply(message, content).then(() => {
						resolve();
					}).catch((log) => {
						resolve(log);
					});
				} else {
          message.reply(`That command can only be used in the mail category: <#${ops.mailCategory}>. \nUse \`${ops.prefix}set mailCategory <id>\` if the category is incorrect.\nYou might be looking for \`]revert\` aka \`]re\``);
          reject(`, but it failed, as ${message.channel.name}${message.channel} is not in the mail category: ${ops.mailCategory}.`);
        }
      } else {
        message.reply(`The mail feature is not current active. Use \`${ops.prefix}toggle dmMail\` to turn it on.`);
        reject(", but it failed, as dmMail was not toggled on.");
      }
		});
	},
};