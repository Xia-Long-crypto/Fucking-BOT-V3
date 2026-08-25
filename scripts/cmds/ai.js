const axios = require('axios');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";

async function getAIResponse(input, userId) {
  try {
    // Redirection des questions sur le créateur vers Rayd
    const creatorKeywords = /\b(créateur|créé|développeur|développé|conçu|fait par|ton père|qui t'a|qui t'a créé|qui t'a fait)\b/i;
    if (creatorKeywords.test(input)) {
      return "J'ai été entièrement créé et développé par ටි. Ᏼ𝗋𝖾𝗐𝖾𝗇ꜝ さ.";
    }

    const response = await axios.post(
      API_ENDPOINT,
      { uid: userId, message: input },
      { timeout: 30000 }
    );

    let apiReply = response.data?.reply || response.data?.result || response.data?.message;

    if (apiReply && typeof apiReply === 'string') {
      // Nettoyage et remplacement des mentions indésirables
      apiReply = apiReply
        .replace(/🎀\s*𝗦𝗵𝗶𝘇𝘂/gi, "")
        .replace(/Shizu AI/gi, "➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅ")
        .replace(/Shizuka AI/gi, "➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅ")
        .replace(/Shizuka/gi, "➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅ")
        .replace(/Shizu/gi, "➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅ")
        .replace(/Aryan/gi, "ටි. Ᏼ𝗋𝖾𝗐𝖾𝗇ꜝ さ")
        .replace(/Christus/gi, "ටි. Ᏼ𝗋𝖾𝗐𝖾𝗇ꜝ さ")
        .trim();

      return apiReply.split('\n').slice(0, 3).join('\n');
    }

    return "Serveur indisponible.";
  } catch (error) {
    return null;
  }
}

async function clearConversation(userId) {
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${userId}`);
    return true;
  } catch {
    return false;
  }
}

async function handleAIProcess({ api, event, userInput, message }) {
  if (['reset', 'clear'].includes(userInput.toLowerCase())) {
    const isCleared = await clearConversation(event.senderID);
    if (isCleared) {
      return message.reply("➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅn\n  Mémoire réinitialisée avec succès.");
    }
    return message.reply("➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅ\n\n  Échec de la réinitialisation.");
  }

  const response = await getAIResponse(userInput, event.senderID);

  if (!response) {
    return message.reply("➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅn\n  Une erreur est survenue lors de la réponse.");
  }

  const chicBox = 
    `➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅn\n` +
    `  ${response.replace(/\n/g, '\n  ')}\n\n` +
    `✧ ─── ටි. Ᏼ𝗋𝖾𝗐𝖾𝗇ꜝ さ ─── ✧`;

  const sentMessage = await message.reply(chicBox);

  // Enregistre le message envoyée pour permettre la continuité via réponse (reply)
  if (sentMessage && sentMessage.messageID && global.GoatBot?.onReply) {
    global.GoatBot.onReply.set(sentMessage.messageID, {
      commandName: 'ai',
      messageID: sentMessage.messageID,
      author: event.senderID
    });
  }
}

module.exports = {
  config: {
    name: 'ai',
    aliases: ['ටි. Ᏼ𝗋𝖾𝗐𝖾𝗇ꜝ さ', 'br'],
    version: '4.5',
    author: 'ටි. Ᏼ𝗋𝖾𝗐𝖾𝗇ꜝ さ',
    countDown: 1,
    role: 0,
    shortDescription: 'IA Chic & Épurée par ➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅ',
    category: '🤖 IA',
    guide: { fr: '{pn} <question>' }
  },

  onStart: async function ({ api, event, args, message }) {
    const userInput = args.join(' ').trim();
    if (!userInput) return message.reply("➤『𝗝𝗢𝗥𝗗𝗔𝗡 𝗕𝗢𝗧 』☜ヅn\n  Veuillez poser une question.");

    return await handleAIProcess({ api, event, userInput, message });
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) return;

    const userInput = event.body?.trim();
    if (!userInput) return;

    return await handleAIProcess({ api, event, userInput, message });
  }
};
