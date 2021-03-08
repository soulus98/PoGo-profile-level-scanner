module.exports = {
	name: "prune",
	description: "Automatically deletes a specified amount of messages, after a verification.",
	args: true,
	usage: "<number> (between 1 and 99)",
	execute(message, args) {
    const amount = parseInt(args[0]) +1;

    if (isNaN(amount)){
      return message.reply("You must supply a number of messages to prune.");
    } else if (amount < 1 || amount > 99) {
      return message.reply("You must input a number between 1 and 99.");
    }
    message.channel.bulkDelete(amount);
	},
};
