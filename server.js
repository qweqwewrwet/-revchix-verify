const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve verify.html, wwee.gif, etc.

// Env variables from .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

// Discord bot setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log(`✅ Discord bot is online as ${client.user.tag}`);
});

// API route for verification
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
    console.error("❌ Error assigning role:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to assign role." });
  }
});

// Serve UI at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "verify.html"));
});

// Start server and login bot
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  client.login(BOT_TOKEN);
});
