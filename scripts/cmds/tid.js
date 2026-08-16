module.exports = {
	config: {
		name: "tid",
	version: "1.0",
		author: "Rayd",
		countDown: 3,
		role: 0,
		description: {
			fr: "Afficher l'ID du groupe et quelques infos",
			en: "Show group ID and some info"
	},
		category: "info",
		guide: {
			fr: "   {pn} \n   Utilisez cette commande dans un groupe pour voir son ID",
			en: "   {pn} \n   Use this command in a group to see its ID"
		}
	},

	langs: {
	fr: {
			notInGroup: "❌ Cette commande ne marche que dans un groupe.",
			result: `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✦
📌 𝗜𝗡𝗙𝗢𝗦 𝗗𝗨 𝗚𝗥𝗢𝗨𝗣𝗘

🏷️ 𝗡𝗼𝗺 : %1
🆔 𝗜𝗗 : %2
👥 𝗠𝗲𝗺𝗯𝗿𝗲𝘀 : %3
🔗 𝗟𝗶𝗲𝗻 : %4

💡 𝗖𝗼𝗽𝗶𝗲𝘇 𝗹'𝗜𝗗 𝗽𝗼𝘂𝗿 𝗹𝗲 𝗰𝗼𝗹𝗲𝗿 𝗱𝗮𝗻𝘀 𝗹𝗲𝘀 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗲𝘀
✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✦
👨‍💻 𝘊𝘳𝘦́𝘦 𝘱𝘢𝘳 : Rayd`
	},
	en: {
			notInGroup: "❌ This command only works in a group.",
			result: `✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✦
📌 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢

🏷️ 𝗡𝗮𝗺𝗲 : %1
🆔 𝗜𝗗 : %2
👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀 : %3
🔗 𝗟𝗶𝗻𝗸 : %4

💡 𝗖𝗼𝗽𝘆 𝘁𝗵𝗲 𝗜𝗗 𝘁𝗼 𝘂𝘀𝗲 𝗶𝗻 𝗰𝗼𝗺𝗮𝗻𝗱𝘀
✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✦
👨‍💻 𝘊𝘳𝘦𝘢𝘵𝘦𝘥 𝘣𝘺 : Rayd`
	}
	},

	onStart: async function ({ event, message, threadsData, api, getLang }) {
		const { threadID, isGroup } = event;

		if (!isGroup) {
			return message.reply(getLang("notInGroup"));
		}

		try {
			const threadInfo = await api.getThreadInfo(threadID);
			const threadName = threadInfo.threadName || "No name";
			const memberCount = threadInfo.participantIDs?.length || 0;
			const link = `https://m.me/j/${threadID}`;

			return message.reply(getLang("result", threadName, threadID, memberCount, link));
		} catch (err) {
			console.error(err);
			return message.reply("❌ Can't get group info.");
		}
	}
};
