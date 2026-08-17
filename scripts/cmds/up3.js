const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");
const os = require("os");

module.exports = {
  config: {
    name: "up3",
    version: "1.0.1",
    author: "Rayd",
    countDown: 3,
    role: 0,
    shortDescription: "bot stats cyber",
    longDescription: "Uptime, ping, CPU load avec canvas cyber néon",
    category: "Info",
    guide: "{p}up3"
  },

  onStart: async function ({ event, message, api }) {
    try {
      const pingMsg = await message.reply({ body: `⚡ Checking ping...` });

      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

      const ping = Date.now() - event.timestamp;
      const cpuUsage = os.loadavg()[0].toFixed(2);
      const owner = "Rayd"; // ✅ CHANGÉ ICI
      const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

      const { imgPath } = await generateCyberCanvas(uptimeStr, ping, cpuUsage, owner, ramUsed);

      const bodyText = `
✿•≫•『⚡RAYD BOT STATUS⚡』•≪•✿
⏳ UPTIME: ${uptimeStr}
📶 PING: ${ping} ms
🖥 CPU LOAD: ${cpuUsage}
💾 RAM: ${ramUsed} MB
👑 OWNER: ${owner}  // ✅ CHANGÉ ICI
✿•≫≪•✿
`;

      await message.reply({
        body: bodyText,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        api.unsendMessage(pingMsg.messageID).catch(() => {});
      }, 3000);

      setTimeout(() => fs.unlinkSync(imgPath), 15000);

    } catch (err) {
      console.error("Command error:", err);
      return message.reply(`❌ Could not fetch stats`);
    }
  }
};

async function generateCyberCanvas(uptime, ping, cpu, owner, ram) {
  const width = 1280, height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. FOND NOIR + GRILLE CYBER
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for(let i = 0; i < width; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for(let i = 0; i < height; i += 40) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
  }

  ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
  for(let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. TITRE CYBER
  ctx.textAlign = "center";
  ctx.font = "bold 60px Arial";
  ctx.fillStyle = "#00FFFF";
  ctx.shadowColor = "#00FFFF";
  ctx.shadowBlur = 30;
  ctx.fillText("⚡ BOT STATUS ⚡", width/2, 100);
  ctx.shadowBlur = 0;

  // 3. 4 BOX GLASS CYBER
  const stats = [
    { label: "UPTIME", value: uptime, icon: "⏳" },
    { label: "PING", value: `${ping} ms`, icon: "📶" },
    { label: "CPU LOAD", value: cpu, icon: "🖥" },
    { label: "RAM", value: `${ram} MB`, icon: "💾" }
  ];

  let x = 80;
  stats.forEach((stat, i) => {
    ctx.fillStyle = "rgba(0, 255, 255, 0.08)";
    roundRect(ctx, x, 180, 260, 200, 15);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#00FFFF";
    ctx.shadowBlur = 15;
    roundRect(ctx, x, 180, 260, 200, 15);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = "40px Arial";
    ctx.fillStyle = "#00FFFF";
    ctx.textAlign = "center";
    ctx.fillText(stat.icon, x + 130, 240);

    ctx.font = "16px Arial";
    ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
    ctx.fillText(stat.label, x + 130, 280);

    ctx.font = "bold 32px Consolas";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "#00FFFF";
    ctx.shadowBlur = 10;
    ctx.fillText(stat.value, x + 130, 330);
    ctx.shadowBlur = 0;

    x += 300;
  });

  // 4. OWNER EN BAS ✅ CHANGÉ ICI AUSSI
  ctx.textAlign = "center";
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#00CCFF";
  ctx.fillText(`OWNER: ${owner} | RAYD BOT v1.0 CYBER`, width/2, 650);

  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
  ctx.fillText(`${new Date().toLocaleString('fr-FR')}`, width/2, 680);

  const cacheDir = path.join(process.cwd(), "cache");
  await fs.ensureDir(cacheDir);
  const imgPath = path.join(cacheDir, `up3_${Date.now()}.png`);
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
