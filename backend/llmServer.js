import 'dotenv/config'; 
import OpenAI from "openai";

const llmURL = "https://api.groq.com/openai/v1";
const llmModel = "groq/compound-mini";
//openai/gpt-oss-20b   openai/gpt-oss-120b  qwen/qwen3.6-27b

const SYSTEM_PROMPT = `
Você é atendente da minha empresa.
- PT-BR curto, 2-3 linhas
- Carioca, simpático e direto
- NUNCA invente preço/horário
- Se não souber: "Vou confirmar com a equipe e te retorno 😉"
`;

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
      { role: "system", content: SYSTEM_PROMPT },
    // ...historico.slice(-10),
      { role: "user", content: mensagemNova }
    ]
  });

  return completion.choices[0].message.content;
}
