const config = require("../server/config.json");
const prefix = config.chars.prefix;
const {saveStats} = require('../func/saveStats.js');

module.exports = {
	name: "approve",
	description: "Manually approves a user. Can add a level to add the vanity roles/for stats purposes",
  aliases: ["a","app"],
  usage: `\`${prefix}a <@mention/ID> [level]\``,
	guildOnly:true,
  args: true,
	permissions: "MANAGE_GUILD",
	execute(input, args) {
		let prom = new Promise(function(resolve, reject) {
			server = input.guild;
			if (input[1] == undefined) {
				inCommand = true;
				message = input;
				logimg = false;
				if (args[0].charAt(0) == "<") {
					id = args[0].slice(3,-1);
				} else {
					id = args[0];
				}
				level = args[1] || "missing";
				resolve(server.members.cache.get(id));
				//id, level
			} else {
				inCommand = false;
				message = input[0];
				logimg = input[1];
				level = args[1];
				resolve(message.member);
			}
		});
		prom.then((member)=>{
			console.log(inCommand,message.id,(logimg)?logimg.id:logimg,level,member.user.username);
		});
	},
};
