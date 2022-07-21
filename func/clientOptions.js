const chanSize = 1;
const sweepInt = 1 * 60 * 60;
function channelKeepOver(v){
	return v.id == ops.screenshotChannel
	|| v.id == ops.profileChannel
	|| v.id == ops.logsChannel
	|| v.id == ops.badgeChannel
	|| v.id == ops.mailCategory
	|| v.parent?.id == ops.mailCategory;
}

function channelFilter(channel) {
		// if (channel.id == ops.logsChannel) console.log("Sweeping channels");
		return !channelKeepOver(channel);
}

function roleKeepOver(v){
	return v.id == ops.targetLevelRole
	|| v.id == ops.level40Role
	|| v.id == ops.level50Role
	|| v.id == ops.verifiedRole
	|| v.id == ops.blacklistRole
	|| v.id == ops.modRole
	|| v.id == v.guild.roles.everyone
	|| v.color != 0;
}

function roleFilter(role) {
		// if (role.id == ops.targetLevelRole) console.log("Sweeping roles");
		return !roleKeepOver(role);
}

function userFilter(user) {
		if (user.id == user.client.user.id) {
			// console.log("Sweeping users");
			return false;
		}
		return true;
}

const chanObject = {
	maxSize:chanSize,
	keepOverLimit:(v, k) => channelKeepOver(v, k),
	sweepFilter: () => channelFilter,
	sweepInterval: sweepInt,
};
const roleObject = {
	maxSize:chanSize,
	keepOverLimit:(v, k) => roleKeepOver(v, k),
	sweepFilter: () => roleFilter,
	sweepInterval: sweepInt,
};
const userObject = {
	maxSize:chanSize,
};

module.exports = {
	cacheOps: {
		ChannelManager:chanObject,
		GuildChannelManager:chanObject,
		// UserManager:userObject, // Scary?
		GuildMemberManager:userObject, // Scary?
		RoleManager:roleObject, // Very scary???
		GuildMemberRoleManager:roleObject,
		BaseGuildEmojiManager:0,
		// MessageManager:0, // Scary? Fixed using sweepers
		ClientVoiceManager:0,
		ApplicationCommandManager:0,
		ApplicationCommandPermissionsManager:0,
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
		messages:{
			interval:4 * 60,
			lifetime:5 * 60, // *60 for minutes
		},
		users:{
			interval: 5 * 60,
			filter: () => userFilter,
		},
	},
};
