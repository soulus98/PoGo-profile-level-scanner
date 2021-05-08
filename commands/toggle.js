config = require("../config.json");
const prefix = config.chars.prefix;
const fs = require("fs");
const bot = require("../bot.js");

module.exports = {
	name: "toggle-setting",
	description: `Used to toggle bot settings. Currently toggles settings for all instances of the bot, as there is only one intended instance. Use \`${prefix}show-options\` to see all current settings.`,
  aliases: ["toggle", "tog"],
  usage: `\`${prefix}toggle <setting>\``,
  args: true,
  cooldown: 5,
	guildOnly:true,
  permissions: "ADMINISTRATOR",
	execute(message, args) {
    if (args.length != 1){
      message.reply(`You must supply only one argument in the form \`${prefix}toggle [setting-name]\``);
      return `, but it failed, as there were no arguments provided`;
    }
    try{
      fs.readFile("config.json", (err, raw) => {
        configs =JSON.parse(raw);
        toggles = configs.toggles;
        if (toggles[args[0]] === undefined){
					message.reply(`Sorry, but ${args[0]} is not a valid setting. Use \`${prefix}show\` to see a list of all settings.`);
          console.log(`But it failed, as ${args} is not a valid setting.`);
          return;
        }
        was = toggles[args[0]];
        toggles[args[0]] = !toggles[args[0]];
        configs.toggles = toggles;
        const jsonString = JSON.stringify(configs);
        fs.writeFile("./config.json",jsonString, err => {
          if (err) {
            message.reply(`An unexpected error occured when editing the config file.`);
            console.log(`But an unexpected write error occured. Error: ${err}`);
            return;
          } else {
            message.channel.send(`"${args}" was successfully toggled from \`${was.toString().replace("true","ON").replace("false","OFF")}\` to \`${toggles[args[0]].toString().replace("true","ON").replace("false","OFF")}\`.`);
            console.log(`and successfully toggled "${args}" from ${was} to ${toggles[args[0]]}.`);
						bot.loadConfigs();
            return;
          }
        })
      })
    } catch (err){
      message.reply(`An unexpected error occured.`);
      return `, but an unexpected error occured. Error: ${err}`;
    }
  },
};
