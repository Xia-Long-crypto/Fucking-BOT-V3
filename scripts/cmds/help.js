const axios = require("axios");
const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const fontUrl = "https://raw.githubusercontent.com/Azadwebapi/Azadx69x-bm-store/main/font.json";
const categoryUrl = "https://raw.githubusercontent.com/Azadwebapi/Azadx69x-bm-store/main/category.json";

let fontMap = {};
let categoryMap = {};
let isLoading = false;

async function loadFont() {
  try {
    const res = await axios.get(fontUrl, { timeout: 5000 });
    fontMap = res.data || {};
  } catch (err) {}
}

async function loadCategory() {
  if (isLoading) return;
  isLoading = true;
  try {
    const res = await axios.get(categoryUrl, { timeout: 5000 });
    const rawData = res.data || {};
    categoryMap = {};
    Object.keys(rawData).forEach(key => {
      categoryMap[key.toLowerCase().trim()] = rawData[key];
    });
  } catch (err) {} finally { isLoading = false; }
}

function toBold(text) {
  if (!text) return "";
  return text.split("").map(ch => fontMap[ch] || ch).join("");
}

function getCategoryEmoji(category) {
  if (Object.keys(categoryMap).length === 0 &&!isLoading) loadCategory();
  const cat = (category || "").toLowerCase().trim();
  return categoryMap[cat] || "📁";
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

async function generateHelpCanvas(prefix, categoriesData, totalCmds) {
  // PAYSAGE 1920x1080 FOND CYBER
  const width = 1920, height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. FOND NOIR + GRILLE CYBER
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Grille néon subtile
  ctx.strokeStyle = "rgba(0, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for(let i = 0; i < width; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for(let i = 0; i < height; i += 50) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
  }

  // Particules cyan
  ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
  for(let i = 0; i < 120; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. HEADER CYBER NÉON
  ctx.textAlign = "center";
  ctx.font = "bold 52px Arial";
  ctx.fillStyle = "#00FFFF"; // Cyan néon
  ctx.shadowColor = "#00FFFF";
  ctx.shadowBlur = 25;
  ctx.fillText("⚡ RAYD BOT COMMANDS ⚡", width/2, 70);
  ctx.shadowBlur = 0;

  ctx.font = "20px Arial";
  ctx.fillStyle = "#00CCFF";
  const activeCats = Object.keys(categoriesData).filter(k => categoriesData[k].length > 0);
  ctx.fillText(`PREFIX: ${prefix} | ${totalCmds} COMMANDS | ${activeCats.length} CATEGORIES`, width/2, 105);

  // Ligne séparatrice CYAN NÉON au lieu de barre rose
  ctx.strokeStyle = "#00FFFF";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "#00FFFF";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(80, 130);
  ctx.lineTo(width - 80, 130);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. 2 COLONNES PAYSAGE
  let y1 = 170, y2 = 170;
  const col1X = 80, col2X = 1000;
  const colWidth = 840;
  let captionText = `⚡ RAYD BOT COMMANDS ⚡\nPREFIX: ${prefix} | ${totalCmds} COMMANDS\n\n`;

  const sortedCats = activeCats.sort();
  const mid = Math.ceil(sortedCats.length / 2);

  sortedCats.forEach((catName, index) => {
    const cmds = categoriesData[catName].sort();
    const isCol1 = index < mid;
    let y = isCol1? y1 : y2;
    const x = isCol1? col1X : col2X;

    // TITRE CATÉGORIE CYAN au lieu de barre rose
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#00FFFF";
    ctx.shadowColor = "#00FFFF";
    ctx.shadowBlur = 10;
    ctx.fillText(`${getCategoryEmoji(catName)} ${catName.toUpperCase()} [${cmds.length}]`, x, y);
    ctx.shadowBlur = 0;

    // Ligne sous le titre
    ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 300, y + 8);
    ctx.stroke();

    y += 30;
    captionText += `═══ ${catName.toUpperCase()} ═══\n`;

    // Commandes en blanc avec effet néon léger
    ctx.font = "15px Consolas";
    ctx.fillStyle = "#E0E0E0";
    cmds.forEach(cmd => {
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,255,255,0.2)";
      ctx.shadowBlur = 3;
      ctx.fillText(`> ${cmd}`, x + 5, y);
      ctx.shadowBlur = 0;
      captionText += `${cmd} `;
      y += 22;
    });

    captionText += `\n\n`;
    y += 10;

    if(isCol1) y1 = y; else y2 = y;
  });

  captionText += `⚡ Powered by RAYD BOT 2026 ⚡`;

  // 4. FOOTER CYBER
  ctx.textAlign = "right";
  ctx.font = "14px Arial";
  ctx.fillStyle = "#00CCFF";
  ctx.shadowColor = "#00CCFF";
  ctx.shadowBlur = 8;
  ctx.fillText(`SYSTEM: RAYD v9.5 CYBER | ${new Date().toLocaleString('fr-FR')}`, width - 80, height - 30);
  ctx.shadowBlur = 0;

  const cacheDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(cacheDir);
  const imgPath = path.join(cacheDir, `help_${Date.now()}.png`);
  await fs.writeFile(imgPath, canvas.toBuffer("image/png"));

  return { imgPath, captionText };
}

module.exports = {
  config: {
    name: "help",
    version: "9.5.0",
    author: "Rayd",
    role: 0,
    countDown: 5,
    description: {
      fr: "🌹 Affiche toutes les commandes du bot style Cyber",
      en: "🌹 Show all bot commands Cyber style"
    },
    category: "Info",
    guide: {
      fr: "{pn} [nom_commande]",
      en: "{pn} [command_name]"
    }
  },

  onStart: async function ({ message, args, event, role }) {
    if (Object.keys(fontMap).length === 0) await loadFont();
    if (Object.keys(categoryMap).length === 0) await loadCategory();

    const prefix = getPrefix(event.threadID);
    const input = args[0]?.toLowerCase();

    let cmd = null;
    if (input) {
      if (commands.has(input)) cmd = commands.get(input);
      else if (aliases.has(input)) cmd = commands.get(aliases.get(input));
      else return message.reply(`❌ NOT FOUND\n🔍 Command: "${input}"`);
    }

    if (cmd) {
      const cfg = cmd.config;
      const desc = typeof cfg.description === "string"? cfg.description : cfg.description?.fr || cfg.description?.en || "No description";
      const usage = typeof cfg.guide?.fr === "string"? cfg.guide.fr.replace(/\{pn\}/g, prefix + cfg.name) : `${prefix}${cfg.name}`;
      const aliasesList = cfg.aliases? cfg.aliases.map(a => `${prefix}${a}`).join(", ") : "None";

      const helpMessage = `┍━━━[ ⚡ ${toBold("RAYD HELP")} ]━━━◊
┋➥ 📛 ${toBold("Name")}: ${prefix}${cfg.name}
┋➥ 🗂️ ${toBold("Category")}: ${getCategoryEmoji(cfg.category)} ${cfg.category}
┋➥ 📄 ${toBold("Description")}: ${desc}
┋➥ ⚙️ ${toBold("Version")}: ${cfg.version || "1.0"}
┋➥ ⏳ ${toBold("Cooldown")}: ${cfg.countDown || 1}s
┋➥ 🔒 ${toBold("Role")}: ${cfg.role === 0? "👤 All" : cfg.role === 1? "👑 Admin" : "⚡ Owner"}
┋➥ 👑 ${toBold("Author")}: ${cfg.author}
┋➥ 🔤 ${toBold("Aliases")}: ${aliasesList}
┍━━━[ 📘 ${toBold("USAGE")} ]━━━◊
${usage.split('\n').map(line => `┋➥ ${line}`).join('\n')}
┕━━━━━━━━◊`;
      return message.reply(helpMessage);
    }

    const categories = {};
    for (const [, c] of commands) {
      if (c.config.role > role) continue;
      const cat = c.config.category || "Uncategorized";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c.config.name);
    }

    const totalCmds = Object.values(categories).flat().length;
    const { imgPath, captionText } = await generateHelpCanvas(prefix, categories, totalCmds);

    try {
      await message.reply({
        body: captionText,
        attachment: fs.createReadStream(imgPath)
      });
    } catch (error) {
      await message.reply("❌ Erreur envoi image");
    } finally {
      setTimeout(() => { if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath) }, 15000);
    }
  }
};
