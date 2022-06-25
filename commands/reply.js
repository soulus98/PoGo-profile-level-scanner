const mail = require("../handlers/dm.js");
module.exports = {
	name: "reply-to-mail",
	description: "Used to reply to a mail ticket if dmAutoReply is turned off.",
  aliases: ["r", "reply"],
  usage: `\`${ops.prefix}r <message>\``,
	guildOnly:true,
	mailOnly:true,
	type:"Mail",
	execute(message, args) {
		return new Promise(function(resolve, reject) {
      if (!ops.dmMail){
				message.reply(`The mail feature is not current active. Use \`${ops.prefix}toggle dmMail\` to turn it on.`);
        reject(", but it failed, as dmMail was not toggled on.");
				return;
      }
			if (!message.channel.parent || message.channel.parentId != ops.mailCategory) {
				message.reply(`That command can only be used in the mail category: <#${ops.mailCategory}>. \nUse \`${ops.prefix}set mailCategory <id>\` if the category is incorrect.\nYou might be looking for \`]revert\` aka \`]re\``);
				reject(`, but it failed, as ${message.channel.name}${message.channel} is not in the mail category: ${ops.mailCategory}.`);
				return;
			}
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
			if (message.attachments.first() && message.attachments.first().size / 1048576 > 8){ // size checking
				message.reply("I cannot handle such a large file.\nThe limit is 8MB.\nPlease reduce the file size using paint or something similar.");
				return;
			}
			mail.reply(message, content).then(() => {
				resolve();
			}).catch((log) => {
				resolve(log);
			});
		});
	},
};
