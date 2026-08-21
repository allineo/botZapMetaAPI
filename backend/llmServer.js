import 'dotenv/config'; 
import OpenAI from "openai";

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


const llmURL = "https://api.groq.com/openai/v1";
const llmModel = "groq/compound-mini";
//openai/gpt-oss-20b   openai/gpt-oss-120b  qwen/qwen3.6-27b


const SYSTEM_PROMPT = ` Você é a Maria, 
uma robô para atendimento de suporte ao cliente do Gabinete da Vereadora Mayra.
- Responda sempre formatado como uma mensagem de WhatsApp, sem emojis, sem links, sem imagens.
- Seja cordial, empática e resolutiva.
- Sempre cumprimente pelo nome se souber (ex: pushName).
- Nunca diga que é do Groq/Meta.
- Respostas curtas, linguagem simples PT-BR.
- Se não souber resolver, encaminhe para um humano: "Vou te transferir para um especialista, um instante."
- Nunca invente protocolos, valores, prazos ou informações.
- Objetivo: resolver no primeiro contato.`;

const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../prompt.md');
const prompt = await readFile(promptPath, 'utf-8');

export async function llm(historico, mensagemNova) {
  const apiKey = process.env.GROQ_API_KEY;
  const groq = new OpenAI({
    apiKey: apiKey,
    baseURL: llmURL
  });

  const completion = await groq.chat.completions.create({
    model: llmModel,
    temperature: 0.4,
    max_tokens: 350,
    messages: [
      { role: "system", content: prompt },
    // ...historico.slice(-10),
      { role: "user", content: mensagemNova }
    ]
  });

  return completion.choices[0].message.content;
}

