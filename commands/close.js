const mail = require("../handlers/dm.js");
module.exports = {
	name: "close",
	description: "closes a mail ticket (must be used in a mail ticket)",
  aliases: [""],
  usage: `\`${ops.prefix}close [reason]\``,
	guildOnly:true,
	execute(message, args) {
		return new Promise(function(resolve, reject) {
      if (ops.dmMail){
        if (message.channel.parent && message.channel.parent.id == ops.mailCategory) {
					mail.close(message, args.join(" ")).then(() => {
						resolve();
					}).catch((log) => {
						message.reply(`I can not close <#${message.channel.id}> as it is not linked to a user. Tell <@146186496448135168> if this is in error.`);
						resolve(log);
					});
				} else {
          message.reply(`That command can only be used in the mail category: <#${ops.mailCategory}>. Use \`${ops.prefix}set mailCategory <id>\` to set it if it is incorrect.`);
          reject(`, but it failed, as ${message.channel.name}${message.channel} is not in the mail category: ${ops.mailCategory}.`);
        }
      } else {
        message.reply(`The mail feature is not current active. Use \`${ops.prefix}toggle dmMail\` to turn it on.`);
        reject(", but it failed, as dmMail was not toggled on.");
      }
		});
	},
};
