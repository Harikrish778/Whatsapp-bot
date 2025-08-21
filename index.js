import express from "express";
import fetch from "node-fetch"; // to send messages
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_verify_token";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; // from Meta Developer Dashboard
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // from Meta Dashboard

// ✅ Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
//pp

// ✅ Handle incoming messages
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (messages && messages[0]) {
      const msg = messages[0];
      const from = msg.from; // sender's number
      const text = msg.text?.body?.toLowerCase();

      console.log(`📩 Message from ${from}: ${text}`);

      // reply only if user says "hi"
      if (text === "hi") {
        await sendMessage(from, "hi 👋");
      }
    }
  } catch (error) {
    console.error("❌ Error handling message:", error);
  }

  res.sendStatus(200); // must respond quickly to Meta
});

// ✅ Function to send WhatsApp message back
async function sendMessage(to, message) {
  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      text: { body: message },
    }),
  });

  const data = await response.json();
  console.log("📤 Reply sent:", data);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
