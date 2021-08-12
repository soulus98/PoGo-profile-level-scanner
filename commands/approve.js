const config = require("../server/config.json");
const prefix = config.chars.prefix;
const {saveStats} = require('./func/saveStats.js');

module.exports = {
	name: "approve",
	description: "Manually approves a user. Can add a level to add the vanity roles/for stats purposes",
  aliases: ["a","app"],
  usage: `\`${prefix}a <@mention/ID> [level]\``,
	guildOnly:true,
  args: true,
	permissions: "MANAGE_GUILD",
	execute(input, args) {
    const server = input.guild;
    if (input[1] == undefined) {
      const inCommand = true;
      if (args[0].charAt(0) == "<") {
        id = args[0].slice(3,-1);
      } else {
        id = args[0];
      }
      level = args[1] || "missing";
    } else {
      const inCommand = false;
      const message = input[0];
      const logimg = input[1];
    }

// id, user




	},
};
