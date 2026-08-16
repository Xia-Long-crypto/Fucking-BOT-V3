const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "prefix",
    version: "2.2.0",
    author: "Rayd",
    role: 0, // Tout le monde peut voir
    countDown: 3,
    description: {
      fr: "🌹 Voir le prefix Global et This Chat",
      en: "🌹 View Global and This Chat prefix"
    },
    category: "System",
    guide: {
      fr: "{pn}\n{pn} <nouveau_prefix> = changer pour ce groupe\n{pn} global <nouveau> = Owner only",
      en: "{pn}\n{pn} <new_prefix> = change for this group\n{pn} global <new> = Owner only"
    }
  },

  onStart: async function ({ message, args, event, role }) {
    const { threadID } = event;
    const prefixPath = path.join(__dirname, "..", "..", "data", "prefix.json");
    await fs.ensureDir(path.dirname(prefixPath));

    let prefixes = {};
    if (await fs.pathExists(prefixPath)) prefixes = await fs.readJson(prefixPath);
    const globalPrefix = global.GoatBot.config.prefix || "!";
    const chatPrefix = prefixes[threadID] || globalPrefix;

    // CHANGER PREFIX GLOBAL - OWNER ONLY
    if (args[0]?.toLowerCase() === "global") {
      if (role < 2) return message.reply("❌ Seul l'Owner peut changer le prefix Global");
      const newGlobal = args[1];
      if (!newGlobal) return message.reply("❌ Ex: prefix global!");
      if (newGlobal.length > 5) return message.reply("❌ Max 5 caractères");

      global.GoatBot.config.prefix = newGlobal;
      await fs.writeJson(path.join(__dirname, "..", "..", "config.json"), global.GoatBot.config, { spaces: 2 });

      const { imgPath } = await generatePrefixCanvas(globalPrefix, newGlobal, "global");
      return message.reply({
        body: `✅ Prefix GLOBAL changé!\nAncien: ${globalPrefix} → Nouveau: ${newGlobal}`,
        attachment: fs.createReadStream(imgPath)
      }).finally(() => setTimeout(() => fs.unlinkSync(imgPath), 15000));
    }

    // CHANGER PREFIX THIS CHAT
    if (args[0]) {
      const newPrefix = args[0];
      if (newPrefix.length > 5) return message.reply("❌ Max 5 caractères");

      prefixes[threadID] = newPrefix;
      await fs.writeJson(prefixPath, prefixes, { spaces: 2 });
      global.data.allThreadData.set(threadID, { prefix: newPrefix });

      const { imgPath } = await generatePrefixCanvas(chatPrefix, newPrefix, "chat");
      return message.reply({
        body: `✅ Prefix THIS CHAT changé!\nAncien: ${chatPrefix} → Nouveau: ${newPrefix}`,
        attachment: fs.createReadStream(imgPath)
      }).finally(() => setTimeout(() => fs.unlinkSync(imgPath), 15000));
    }

    // VOIR LES 2 PREFIX
    const { imgPath } = await generatePrefixCanvas(globalPrefix, chatPrefix, "view");
    return message.reply({
      body: `🌹 Rayd Prefix System 🌹\n\nGlobal: ${globalPrefix}\nThis Chat: ${chatPrefix}\n\n${globalPrefix}prefix <nouveau> = changer ici\n${globalPrefix}prefix global <nouveau> = changer partout`,
      attachment: fs.createReadStream(imgPath)
    }).finally(() => setTimeout(() => fs.unlinkSync(imgPath), 15000));
  }
};

async function generatePrefixCanvas(globalP, chatP, type) {
  const width = 1280, height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. FOND DÉGRADÉ + PARTICULES
  const bg = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
  bg.addColorStop(0, "#0f0f1a");
  bg.addColorStop(1, "#050508");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  for(let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. TITRE
  ctx.textAlign = "center";
  ctx.font = "bold 42px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(100,150,255,0.3)";
  ctx.shadowBlur = 20;
  ctx.fillText("🌹 PREFIX MANAGER 🌹", width/2, 80);
  ctx.shadowBlur = 0;

  // 3. 2 BOX GLASS CÔTE À CÔTE
  // BOX GLOBAL
  ctx.fillStyle = "rgba(30, 35, 60, 0.55)";
  roundRect(ctx, 80, 140, 500, 350, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 80, 140, 500, 350, 20);
  ctx.stroke();

  ctx.font = "18px Arial";
  ctx.fillStyle = "rgba(180, 200, 255, 0.9)";
  ctx.fillText("🌍 GLOBAL", 330, 180);

  ctx.font = "bold 90px Consolas";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(100,150,255,0.5)";
  ctx.shadowBlur = 25;
  ctx.fillText(globalP, 330, 280);
  ctx.shadowBlur = 0;

  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("Prefix pour tous les groupes", 330, 330);

  // BOX THIS CHAT
  ctx.fillStyle = "rgba(60, 30, 50, 0.55)";
  roundRect(ctx, 700, 140, 500, 350, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 100, 200, 0.3)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 700, 140, 500, 350, 20);
  ctx.stroke();

  ctx.font = "18px Arial";
  ctx.fillStyle = "rgba(255, 180, 220, 0.9)";
  ctx.fillText("💬 THIS CHAT", 950, 180);

  ctx.font = "bold 90px Consolas";
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(255,100,200,0.5)";
  ctx.shadowBlur = 25;
  ctx.fillText(chatP, 950, 280);
  ctx.shadowBlur = 0;

  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("Prefix pour ce groupe seulement", 950, 330);

  // 4. INFO EN BAS
  ctx.font = "16px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("Utilise: prefix <nouveau> pour This Chat | prefix global <nouveau> pour Global", width/2, 550);

  ctx.font = "12px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText(`RAYD BOT v2.2 | ${new Date().toLocaleString('fr-FR')}`, width/2, 690);

  const cacheDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(cacheDir);
  const imgPath = path.join(cacheDir, `prefix_${Date.now()}.png`);
  await fs.writeFile(imgPath, canvas.toBuffer("image/png"));
  return { imgPath };
}

function roundRect(ctx, x, y, width, height, radius) {
	if (typeof radius === 'number') radius = {tl: radius, tr: radius, br: radius, bl: radius};
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
