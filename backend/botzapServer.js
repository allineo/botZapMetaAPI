const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const { getBotReply } = require('./botzapReply');

const PORT = process.env.PORT || 3000;
const appExpress = express();

appExpress.use(cors({ origin: '*' }));
appExpress.use(express.json());
const publicPath = path.join(__dirname, '..');
appExpress.use(express.static(publicPath));

appExpress.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'botZapInit.html'));
});

appExpress.get('/health', (req,res) => res.json({ ok:true }));

appExpress.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
    return res.send(req.query['hub.challenge']);
  }
  return res.json({ ok: true, message: 'webhook online, use POST' });
});

appExpress.post('/webhook', async (req, res) => {
  const isTesteLocal = req.body.from && req.body.body &&!req.body.entry;

  if (isTesteLocal) {
    const replyText = getBotReply(req.body.body);
    return res.json({ reply: replyText, ok: true });
  }

  // Fluxo Meta
  res.sendStatus(200);
  const value = req.body.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return;

  const reply = getBotReply(msg.text?.body);
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.FROM_PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to: msg.from, type: "text", text: { body: reply } },
      { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } }
    );
  } catch (e) {
    console.error('ERRO META:', e.response?.data);
  }
});

appExpress.listen(PORT, () => console.log(`Bot rodando na porta ${PORT}`));

// curl.exe -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d "@./testes/test.json"

// ngrok http 3000    
// curl.exe -X POST "https://severity-crock-jinx.ngrok-free.dev/webhook" -H "Content-Type: application/json" -d "@./testes/test.json"

// curl.exe -X POST "https://graph.facebook.com/v20.0/1253187821212583/messages" -H "Authorization: Bearer SEU_TOKEN_AQUI" -H "Content-Type: application/json" -d "@./testes/teste2.json"

