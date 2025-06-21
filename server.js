const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Serve static files in "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

// 🔍 Check if env vars are loaded
if (!BOT_TOKEN || !GUILD_ID || !ROLE_ID) {
  console.error("❌ Missing environment variables. Please check .env file.");
  process.exit(1);
}

// ✅ Initialize Discord bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log(`✅ Bot ready as ${client.user.tag}`);
});

// ✅ API route to assign role
app.post("/verify", async (req, res) => {
  const { discordID } = req.body;

  if (!discordID || !/^\d{17,19}$/.test(discordID)) {
    return res.status(400).json({ success: false, error: "Invalid Discord ID." });
  }

  try {
    await axios.put(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordID}/roles/${ROLE_ID}`,
      {},
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      }
    );

    res.status(200).json({ success: true, message: "Role assigned successfully." });
  } catch (err) {
    console.error("❌ Role error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to assign role." });
  }
});

// ✅ Serve the HTML page on /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "verify.html"));
});

// ✅ Start server + login bot
app.listen(PORT, () => {
  console.log(`🚀 Server live on http://localhost:${PORT}`);
  client.login(BOT_TOKEN);
});
