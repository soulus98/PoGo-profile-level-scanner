module.exports = {
	name: "check-bot-presence",
	description: "This is a testing command. It replies with the current presence information of the bot.",
  aliases: ["presence", "activity", "pres", "act", "activities", "check-presence"],
  usage: `\`${ops.prefix}\`presence`,
	guildOnly:true,
	execute(message) {
		return new Promise(function(resolve) {
			loopyMap(message.client.presence).then((msgtxt) => {
				message.reply(msgtxt.join("\n"));
				resolve();
			});
		});
	},
};
async function loopyMap(cat) {
	const txt = [];
	const size = Object.keys(cat).length;
	let i = 0;
	for (const v in cat) {
		i++;
		if ((typeof cat[v] == "object" && cat[v] != null)) {
			txt.push(v);
			await loopyMap(cat[v]).then((a) => {
				for (const t in a) {
					txt.push(" " + a[t]);
				}
			});
		} else {
			txt.push(`${v}: **${cat[v]}**`);
		}
		if (i == size) {
			return txt;
		}
	}
}
