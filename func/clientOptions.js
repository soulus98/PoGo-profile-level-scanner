const chanSize = 1;
const sweepInt = 1 * 60 * 60;
function channelKeepOver(v){
	return v.id == ops.screenshotChannel
	|| v.id == ops.profileChannel
	|| v.id == ops.logsChannel
	|| v.id == ops.mailCategory
	|| v.parent?.id == ops.mailCategory;
}

function channelFilter(channel) {
		if (channel.id == ops.logsChannel) console.log("Sweeping channels");
		return !channelKeepOver(channel);
}

module.exports = {
	cacheOps: {
		ChannelManager:{
			maxSize:chanSize,
			keepOverLimit:(v, k) => channelKeepOver(v, k),
			sweepFilter: () => channelFilter,
			sweepInterval: sweepInt,
		},
		GuildChannelManager:{
			maxSize:chanSize,
			keepOverLimit:(v, k) => channelKeepOver(v, k),
			sweepFilter: () => channelFilter,
			sweepInterval: sweepInt,
		},
		UserManager:{
			maxSize:50,
			keepOverLimit:(v, k) => {
				k == v.client.id;
			},
		},
		// GuildMemberManager:,
		// RoleManager:, // Very scary???
		// GuildMemberRoleManager:,
		MessageManager:0, // Scary?
		ClientVoiceManager:0,
		ApplicationCommandManager:0,
		ApplicationCommandPermissionsManager:0,
		// BaseGuildEmojiManager:,
		DataManager:0,
		GuildApplicationCommandManager:0,
		GuildBanManager:0,
		GuildEmojiManager:0,
		GuildEmojiRoleManager:0,
		GuildInviteManager:0,
		GuildScheduledEventManager:0,
		GuildStickerManager:0,
		PresenceManager:0,
		ReactionManager:0,
		ReactionUserManager:0,
		StageInstanceManager:0,
		ThreadManager:0,
		ThreadMemberManager:0,
		VoiceStateManager:0,
		ShardingManager:0,
	},
	sweeperOps: {

	},
};
