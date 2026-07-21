// discord.js v14 only supports cache overrides for managers that are safe to
// customize. Member data is intentionally not bulk-cached because this bot no
// longer requests the privileged GuildMembers intent.
module.exports = {
	cacheOps: {
		MessageManager: 20,
	},
	sweeperOps: {
		messages: {
			interval: 4 * 60,
			lifetime: 5 * 60,
		},
	},
};
