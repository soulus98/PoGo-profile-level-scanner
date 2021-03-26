const { prefix } = require("../config.json");
const fs = require("fs");

module.exports = {
	name: "toggle-setting",
	description: "Used to toggle bot settings. Use it without an argument to see options and current states. Currently toggles settings for all instances of the bot, as there is only one intended instance.",
  aliases: ["toggle", "tog"],
  usage: `\`${prefix}toggle [setting-name]\``,
  args: true,
  permissions: "ADMINISTRATOR",
	execute(message, args) {
    console.log(`args 0: ${args}`)
    if (args.length == 0){
      message.reply(`You must supply only one argument in the form \`${prefix}toggle [setting-name]\``);
      return `, but it failed, as there were no arguments provided`;
    }
    if (args.length > 1){
      message.reply(`You must supply only one argument in the form \`${prefix}toggle [setting-name]\``);
      return `, but it failed, as "${args}" contains too many arguments.`;
    }
    try{
      fs.readFile("config.json", (err, raw) => {
        configs =JSON.parse(raw);
        toggles = configs.toggles;
        if (toggles[args[0]] === undefined){
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
            message.channel.send(`"${args}" was successfully toggled from ${was} to ${toggles[args[0]]}.`);
            console.log(`and successfully toggled "${args}" from ${was} to ${toggles[args[0]]}.`);
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
