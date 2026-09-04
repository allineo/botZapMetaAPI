import 'dotenv/config'; 
import OpenAI from "openai";

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


const llmURL = "https://api.groq.com/openai/v1";
const llmModel = "groq/compound-mini";
//openai/gpt-oss-20b   openai/gpt-oss-120b  qwen/qwen3.6-27b

const promptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../prompts/promptIntencao.md');
const prompt = await readFile(promptPath, 'utf-8');

export async function llmIntencao(historico, mensagemNova) {
  const apiKey = process.env.GROQ_API_KEY;
  const groq = new OpenAI({
    apiKey: apiKey,
    baseURL: llmURL
  });

  const completion = await groq.chat.completions.create({
    model: llmModel,
    temperature: 0.4,
    max_tokens: 350,
    response_format: { type: "json_object"},
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: mensagemNova }
    ]
  });

  return completion.choices[0].message.content;
}


