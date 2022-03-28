const mail = require("../handlers/dm.js");
module.exports = {
	name: "sync-mail-ticket",
	description: "Used to fix the mail ticket system if it loses track of which is which. Use it in the channel that needs fixing. This command is a just stop gap.",
  aliases: ["sync", "sync-ticket"],
  usage: `\`${ops.prefix}sync <id/tag>\``,
	args: true,
	guildOnly:true,
	mailOnly:true,
	type:"Mail",
	execute(message, args) {
		return new Promise(function(resolve, reject) {
      if (ops.dmMail){
        if (message.channel.parent && message.channel.parent.id == ops.mailCategory) {
					if (message.channel.id == ops.mailLogChannel) {
						message.reply("You cannot use this command in the mail log channel. Please use it in the channel you wish to sync.");
					} else {
						mail.sync(message, args.join(" ")).then((msg) => {
							if (msg) resolve(msg);
							else resolve();
						}).catch((msg) => {
							resolve(msg);
						});
					}
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
