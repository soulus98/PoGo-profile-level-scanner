const { GatewayIntentBits, Partials } = require("discord.js");

const gatewayIntents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.GuildModeration,
];

const gatewayPartials = [Partials.Channel];

module.exports = { gatewayIntents, gatewayPartials };
