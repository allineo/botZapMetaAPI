const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const { getBotReply } = require('./botzapReply');

const PORT = 3000;
const appExpress = express();

appExpress.use(cors({ origin: '*' }));
appExpress.use(express.json());
appExpress.use(express.static(__dirname + '/../'));

appExpress.get('/', (req, res) => {
  res.sendFile('botZapInit.html', { root: __dirname + '/../' });
});

appExpress.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verificado Meta');
    return res.send(req.query['hub.challenge']);
  }
  if (!req.query['hub.verify_token']) {
    return res.json({ ok: true, message: 'webhook online, use POST' });
  }
  res.sendStatus(403);
});

appExpress.get('/health', (req,res) => {
  res.json({ ok: true, bot: 'Maria da Mayra', port: PORT });
});

appExpress.post('/webhook', async (req, res) => {
  console.log('Payload recebido:', JSON.stringify(req.body).slice(0,500));

  const isTesteLocal = req.body.from && req.body.body &&!req.body.entry;

  if (isTesteLocal) {
    const texto = req.body.body;
    const contato = req.body.pushName || req.body.from;
    console.log(`[TESTE LOCAL] De: ${contato} | Msg: ${texto}`);

    const replyText = getBotReply(texto); // usa sua lógica da Maria

    return res.json({
      reply: replyText,
      from: req.body.from,
      ok: true
    });
  }

  // 2. SE FOR DA META - mantém seu fluxo original
  res.sendStatus(200); // responde rápido pra Meta
  const value = req.body.entry?.[0]?.changes?.[0]?.value;

  if (value?.statuses) {
    console.log('--- STATUS DE ENTREGA ---');
    console.log(JSON.stringify(value.statuses[0], null, 2));
    return;
  }

  const msg = value?.messages?.[0];
  if (!msg) return;

  console.log(`De: ${msg.from} | Mensagem: ${msg.text?.body}`);
  const reply = getBotReply(msg.text?.body);
  console.log(`Resposta: ${reply}`);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.FROM_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: msg.from,
        type: "text",
        text: { body: reply } // CORRIGIDO: antes você estava mandando "Recebi:..."
      },
      { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } }
    );
    console.log('Respondido:', response.data);
  } catch (e) {
    console.error('ERRO DA META:', JSON.stringify(e.response?.data, null, 2));
  }
});

appExpress.listen(PORT, () => console.log(`Bot rodando em ${PORT}`));



// curl.exe -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d "@./testes/test.json"

// ngrok http 3000    
// curl.exe -X POST "https://severity-crock-jinx.ngrok-free.dev/webhook" -H "Content-Type: application/json" -d "@./testes/test.json"

// curl.exe -X POST "https://graph.facebook.com/v20.0/1253187821212583/messages" -H "Authorization: Bearer SEU_TOKEN_AQUI" -H "Content-Type: application/json" -d "@./testes/teste2.json"

