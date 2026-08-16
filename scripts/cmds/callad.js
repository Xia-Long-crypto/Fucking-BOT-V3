const { getStreamsFromAttachment, log } = global.utils;
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];
const TARGET_GROUP_ID = "1623761279268276"; // <-- TON ID DE GROUPE ADMIN

async function getAvatarBuffer(uid, api) {
	try {
		const userInfo = await api.getUserInfo(uid);
		const url = userInfo[uid]?.thumbSrc || `https://graph.facebook.com/${uid}/picture?type=large`;
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return Buffer.from(response.data, 'binary');
	} catch (_) {
		try {
			const fallback = await axios.get('https://i.imgur.com/6V7669V.png', { responseType: 'arraybuffer' });
			return Buffer.from(fallback.data, 'binary');
		} catch(__) { return null; }
	}
}

async function getGroupImageBuffer(threadID, api) {
	try {
		const threadInfo = await api.getThreadInfo(threadID);
		const url = threadInfo.imageSrc || `https://graph.facebook.com/${threadID}/picture?type=large`;
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		return Buffer.from(response.data, 'binary');
	} catch (_) {
		return null;
	}
}

function roundRect(ctx, x, y, width, height, radius) {
	if (typeof radius === 'number') {
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
	}
	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.closePath();
}

async function createCustomCanvas(title, subText, mainContent, avatarBuffer, groupBuffer, isAnonymous = false) {
	const canvas = createCanvas(900, 500);
	const ctx = canvas.getContext('2d');
	const now = new Date();
	const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	const dateString = now.toLocaleDateString('fr-FR');

	const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	if (isAnonymous) {
		bgGradient.addColorStop(0, '#0f0f0f');
		bgGradient.addColorStop(1, '#1a1a1a');
	} else {
		bgGradient.addColorStop(0, '#1e3c72');
		bgGradient.addColorStop(0.5, '#2a5298');
		bgGradient.addColorStop(1, '#7e22ce');
	}
	ctx.fillStyle = bgGradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.strokeStyle = 'rgba(255,255,255,0.05)';
	ctx.lineWidth = 1;
	for(let i = 0; i < canvas.width; i += 40) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, canvas.height);
		ctx.stroke();
	}
	for(let i = 0; i < canvas.height; i += 40) {
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(canvas.width, i);
		ctx.stroke();
	}

	const cardX = 40, cardY = 40, cardW = 820, cardH = 420;
	ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
	roundRect(ctx, cardX, cardY, cardW, cardH, 25);
	ctx.fill();
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
	ctx.lineWidth = 2;
	roundRect(ctx, cardX, cardY, cardW, cardH, 25);
	ctx.stroke();

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 32px Arial';
	ctx.textAlign = 'center';
	ctx.fillText(isAnonymous? '🔒 RAYD ANONYMOUS' : '⚡ RAYD SUPPORT', canvas.width / 2, 80);

	const lineGradient = ctx.createLinearGradient(100, 0, 800, 0);
	lineGradient.addColorStop(0, 'transparent');
	lineGradient.addColorStop(0.5, isAnonymous? '#888' : '#00f5ff');
	lineGradient.addColorStop(1, 'transparent');
	ctx.strokeStyle = lineGradient;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(100, 95);
	ctx.lineTo(800, 95);
	ctx.stroke();

	ctx.fillStyle = 'rgba(255,255,255,0.8)';
	ctx.font = '16px Arial';
	ctx.textAlign = 'right';
	ctx.fillText(`📅 ${dateString} | 🕒 ${timeString}`, canvas.width - 60, 130);

	if (avatarBuffer &&!isAnonymous) {
		try {
			const img = await loadImage(avatarBuffer);
			ctx.shadowColor = '#00f5ff';
			ctx.shadowBlur = 20;
			ctx.beginPath();
			ctx.arc(130, 180, 50, 0, Math.PI * 2);
			ctx.fill();
			ctx.shadowBlur = 0;
			ctx.save();
			ctx.beginPath();
			ctx.arc(130, 180, 45, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(img, 85, 135, 90, 90);
			ctx.restore();
	} catch(_) {}
	} else {
		ctx.fillStyle = 'rgba(255,255,255,0.1)';
		ctx.beginPath();
		ctx.arc(130, 180, 45, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#ffffff';
		ctx.font = 'bold 35px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('?', 130, 192);
	}

	if (groupBuffer &&!isAnonymous) {
		try {
			const groupImg = await loadImage(groupBuffer);
			ctx.save();
			ctx.beginPath();
			ctx.arc(170, 220, 20, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(groupImg, 150, 200, 40, 40);
			ctx.restore();
			ctx.strokeStyle = '#00f5ff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(170, 220, 20, 0, Math.PI * 2);
			ctx.stroke();
	} catch(_) {}
	}

	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 26px Arial';
	ctx.textAlign = 'left';
	ctx.fillText(isAnonymous? "MESSAGE ANONYME" : title, 210, 175);

	ctx.fillStyle = 'rgba(255,255,255,0.7)';
	ctx.font = '18px Arial';
	ctx.fillText(isAnonymous? "Identité masquée" : subText, 210, 205);

	const bubbleX = 70;
	const bubbleY = 250;
	const bubbleW = 760;
	const bubbleH = 160;
	
	ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
	roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 20);
	ctx.fill();
	ctx.strokeStyle = 'rgba(255,255,255,0.15)';
	ctx.lineWidth = 1;
	roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 20);
	ctx.stroke();

	ctx.fillStyle = '#ffffff';
	ctx.font = '20px Arial';
	ctx.textAlign = 'left';
	
	const words = mainContent.split(' ');
	let line = '';
	let textX = bubbleX + 25;
	let textY = bubbleY + 35;
	const maxTextWidth = bubbleW - 50;
	const lineHeight = 30;

	for (let n = 0; n < words.length; n++) {
		let testLine = line + words[n] + ' ';
		let metrics = ctx.measureText(testLine);
		if (metrics.width > maxTextWidth && n > 0) {
			ctx.fillText(line, textX, textY);
			line = words[n] + ' ';
			textY += lineHeight;
		} else {
			line = testLine;
		}
	}
	ctx.fillText(line, textX, textY);

	ctx.fillStyle = 'rgba(255,255,255,0.5)';
	ctx.font = '14px Arial';
	ctx.textAlign = 'left';
	ctx.fillText(`SYSTEM: Rayd v5.2`, 60, canvas.height - 45);

	ctx.textAlign = 'right';
	ctx.fillText(`Mots: ${words.length} | Caractères: ${mainContent.length}`, canvas.width - 60, canvas.height - 45);

	ctx.textAlign = 'center';
	ctx.font = 'bold 16px Arial';
	ctx.fillStyle = isAnonymous? '#888' : '#00f5ff';
	ctx.fillText('🇨🇩 Securisé par Rayd Team', canvas.width / 2, canvas.height - 20);

	const cacheDir = path.join(__dirname, 'cache');
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir, { recursive: true });
	}

	const cachePath = path.join(cacheDir, `canvas_${Date.now()}.png`);
	const buffer = canvas.toBuffer('image/png');
	fs.writeFileSync(cachePath, buffer);
	
	return cachePath;
}

module.exports = {
	config: {
		name: "callad",
	version: "5.2",
	author: "Rayd",
		countDown: 5,
	role: 0,
		description: {
			fr: "Envoyer un rapport aux admins. Mode anonyme: /anon",
			en: "Send report to admins. Anonymous mode: /anon"
		},
		category: "contacts admin",
		guide: {
			fr: " {pn} <message> \n {pn} /anon <message>",
			en: " {pn} <message> \n {pn} /anon <message>"
		}
	},

	langs: {
		fr: {
			missingMessage: "💙 Veuillez entrer le message à envoyer.",
			sendByGroup: "\n🔹 Envoyé depuis : %1\n🔹 ID Groupe : %2",
			sendByUser: "\n🔹 Envoyé en privé",
			content: "\n\n╔═════ 📬 MESSAGE ═════╗\n%1\n╚══════════════╝\n\n💬 Répondez à ce message pour répondre.",
			success: "💙 Message transmis aux admins avec succès!",
			failed: "❌ Impossible d'envoyer le message.",
			reply: "✧ RAYD SUPPORT ✧\n💙 REPONSE ADMIN %1 :\n\n%2\n🛀 Répondez pour continuer.",
			replySuccess: "💙 Réponse envoyée!",
			feedback: "✧ RAYD SUPPORT ✧\n🛀 RETOUR UTILISATEUR %1 :\n🔹 ID : %2%3\n\n📬 Message :\n%4",
			replyUserSuccess: "💙 Réponse envoyée!"
		},
		en: {
			missingMessage: "💙 Please enter the message to send.",
			sendByGroup: "\n🔹 Sent from : %1\n🔹 Group ID : %2",
			sendByUser: "\n🔹 Sent in private",
			content: "\n\n╔═════ 📬 MESSAGE ═════╗\n%1\n╚══════════════╝\n\n💬 Reply to this message to respond.",
			success: "💙 Message sent to admins successfully!",
			failed: "❌ Failed to send message.",
			reply: "✧ RAYD SUPPORT ✧\n💙 ADMIN REPLY %1 :\n\n%2\n🛀 Reply to continue.",
			replySuccess: "💙 Reply sent!",
			feedback: "✧ RAYD SUPPORT ✧\n🛀 USER FEEDBACK %1 :\n🔹 ID : %2%3\n📬 Message :\n%4",
			replyUserSuccess: "💙 Reply sent!"
	}
	},

	onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
		try {
			if (!args[0]) return message.reply(getLang("missingMessage"));
			const { senderID, threadID, isGroup } = event;
			
			let mainMsg = args.join(" ");
			let isAnonymous = false;

			if (mainMsg.startsWith("/anon ")) {
				isAnonymous = true;
				mainMsg = mainMsg.replace("/anon ", "");
			}

			const senderName = isAnonymous? "Anonyme" : await usersData.getName(senderID);
			const locationText = isGroup? getLang("sendByGroup", (await threadsData.get(threadID)).threadName, threadID) : getLang("sendByUser");

			const avatarBuffer = isAnonymous? null : await getAvatarBuffer(senderID, api);
			const groupBuffer = (isGroup &&!isAnonymous)? await getGroupImageBuffer(threadID, api) : null;
			
			const canvasImagePath = await createCustomCanvas("📬 CALL ADMIN", `De : ${senderName}`, mainMsg, avatarBuffer, groupBuffer, isAnonymous);

			const msg = `💙 ═══ RAYD SUPPORT ${isAnonymous? '[ANONYME]' : ''} ═══ 💙`
				+ `\n🔹 Nom : ${senderName}`
				+ `\n🔹 ID : ${isAnonymous? 'Masqué' : senderID}`
				+ (isAnonymous? "\n🔹 Source : Sécurisé" : locationText);

			const attachments = await getStreamsFromAttachment(
				[...event.attachments,...(event.messageReply?.attachments || [])].filter(item => mediaTypes.includes(item.type))
			);
			
			if (fs.existsSync(canvasImagePath)) {
				attachments.push(fs.createReadStream(canvasImagePath));
			}

			const formMessage = {
				body: msg + getLang("content", mainMsg),
				mentions: isAnonymous? [] : [{ id: senderID, tag: senderName }],
				attachment: attachments
			};

			try {
				const messageSend = await api.sendMessage(formMessage, TARGET_GROUP_ID);
				global.GoatBot.onReply.set(messageSend.messageID, {
					commandName,
					messageID: messageSend.messageID,
					threadID,
					messageIDSender: event.messageID,
					type: "userCallAdmin"
				});

				if (fs.existsSync(canvasImagePath)) {
					setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
				}
				return message.reply(getLang("success"));
			} catch (err) {
				if (fs.existsSync(canvasImagePath)) {
					setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
				}
				log.err("CALL ADMIN", err);
				return message.reply(getLang("failed"));
			}
	} catch (error) {
			console.error(error);
			return message.reply("❌ Une erreur est survenue.");
	}
	},

	onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
		try {
			const { type, threadID, messageIDSender } = Reply;
			const senderName = await usersData.getName(event.senderID);
			const { isGroup } = event;
			const replyMsg = args.join(" ");

			const avatarBuffer = await getAvatarBuffer(event.senderID, api);
			const groupBuffer = isGroup? await getGroupImageBuffer(event.threadID, api) : null;

			switch (type) {
				case "userCallAdmin": {
					const canvasImagePath = await createCustomCanvas("⌖ ADMIN REPOND", `Par : ${senderName}`, replyMsg, avatarBuffer, groupBuffer);
					const attachments = await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)));
					if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

					const formMessage = {
						body: getLang("reply", senderName, replyMsg),
						mentions: [{ id: event.senderID, tag: senderName }],
						attachment: attachments
					};

					api.sendMessage(formMessage, threadID, (err, info) => {
						if (fs.existsSync(canvasImagePath)) {
							setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
						}
						if (err) return message.err(err);
						message.reply(getLang("replyUserSuccess"));
						global.GoatBot.onReply.set(info.messageID, {
							commandName,
							messageID: info.messageID,
							messageIDSender: event.messageID,
							threadID: event.threadID,
							type: "adminReply"
						});
					}, messageIDSender);
					break;
				}
				case "adminReply": {
					let sendByGroup = "";
					if (isGroup) {
						try {
							const threadInfo = await api.getThreadInfo(event.threadID);
							sendByGroup = getLang("sendByGroup", threadInfo.threadName, event.threadID);
						} catch(_) {}
					}

					const canvasImagePath = await createCustomCanvas("✎ NOUVEAU MESSAGE", `De : ${senderName}`, replyMsg, avatarBuffer, groupBuffer);
					const attachments = await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)));
					if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

					const formMessage = {
						body: getLang("feedback", senderName, event.senderID, sendByGroup, replyMsg),
						mentions: [{ id: event.senderID, tag: senderName }],
						attachment: attachments
					};

					api.sendMessage(formMessage, TARGET_GROUP_ID, (err, info) => {
						if (fs.existsSync(canvasImagePath)) {
							setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
						}
						if (err) return message.err(err);
						message.reply(getLang("replySuccess"));
						global.GoatBot.onReply.set(info.messageID, {
							commandName,
							messageID: info.messageID,
							messageIDSender: event.messageID,
							threadID: event.threadID,
							type: "userCallAdmin"
						});
					}, messageIDSender);
					break;
				}
				default:
					break;
			}
		} catch (error) {
			console.error(error);
		}
	}
};
