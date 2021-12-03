const mail = require("../handlers/dm.js");
module.exports = {
	name: "open-mail-ticket",
	description: "Opens a new mail ticket with a member based on a tag or an ID. (Must be used in `mailCategory`)",
  aliases: [""],
  usage: `\`${ops.prefix}open <id/tag>\``,
	args: true,
	guildOnly:true,
	mailOnly:true,
	execute(message, args) {
		return new Promise(function(resolve, reject) {
      if (ops.dmMail){
        if (message.channel.parent && message.channel.parent.id == ops.mailCategory) {
					mail.hostOpen(message, args.join(" ")).then(() => {
						resolve();
					}).catch((log) => {
						resolve(log);
					});
        } else {
          message.reply(`That command can only be used in the mail category: <#${ops.mailCategory}>. Use \`${ops.prefix}set mailCategory <id>\` to set it if it is incorrect.`);
          resolve(`, but it failed, as ${message.channel.name}${message.channel} is not in the mail category: ${ops.mailCategory}.`);
        }
      } else {
        message.reply(`The mail feature is not current active. Use \`${ops.prefix}toggle dmMail\` to turn it on.`);
        reject(", but it failed, as dmMail was not toggled on.");
      }
		});
	},
};
