import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBotReply } from './botzapReply.js';


const PORT = 3000;
const appExpress = express();

appExpress.use(cors({ origin: '*' }));
appExpress.use(express.json());
appExpress.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..')));

appExpress.get('/', (request, response) => {
  response.sendFile(fileURLToPath(new URL('../botZapInit.html', import.meta.url)));
});

appExpress.get('/health', (request, response) => response.json({ ok:true }));

appExpress.get('/webhook', (request, response) => {
  if (request.query['hub.verify_token'] === process.env.WEBHOOK_VERIFY_TOKEN) {
    return response.send(request.query['hub.challenge']);
  }
  return response.json({ ok: true, message: 'webhook online, use POST' });
});

appExpress.post('/webhook', async (request, response) => {

  const isTesteLocal = request.body.from && request.body.body &&!request.body.entry;

  if (isTesteLocal) {
    console.log('LOCAL');
    const replyText = await getBotReply(request.body.body);
    console.log('Reply:', replyText);
    return response.json({ reply: replyText, ok: true });
  }

  response.sendStatus(200);
  const value = request.body.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return;

  console.log('NAO LOCAL');
  const reply = await getBotReply(msg.text?.body);
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.FROM_PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to: msg.from, type: "text", text: { body: reply } },
      { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } }
    );
  } catch (e) {
    console.error('ERRO META:', e.response?.data);
  }




  try {
    const { from, body, pushName } = req.body;
    const historico = []; // se quiser pegar do req.body.historico
    const resposta = await llm(historico, body);
    

    res.json({ reply: resposta, ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }





});

appExpress.listen(PORT, () => console.log(`Bot rodando na porta ${PORT}`));

// curl.exe -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d "@./testes/test.json"

// ngrok http 3000    
// curl.exe -X POST "https://severity-crock-jinx.ngrok-free.dev/webhook" -H "Content-Type: application/json" -d "@./testes/test.json"

// curl.exe -X POST "https://graph.facebook.com/v20.0/1253187821212583/messages" -H "Authorization: Bearer SEU_TOKEN_AQUI" -H "Content-Type: application/json" -d "@./testes/teste2.json"

// curl.exe -X GET "https://api.groq.com/openai/v1/models" -H "Authorization: Bearer $env:GROQ_API_KEY"

// https://botzapmetaapi.onrender.com/