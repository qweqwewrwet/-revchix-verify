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

    res.status(200).json({ success: true, message: "Role assigned successfully." });
  } catch (err) {
    console.error("❌ Role assignment failed:", err.message);
    res.status(500).json({ success: false, error: "Failed to assign role." });
  }
});

// Serve the verify page (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "verify-site", "index.html"));
});

// Start the server and login to Discord
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  client.login(BOT_TOKEN);
});
