import { llm } from "./llmServer.js";

async function getBotReply(incomingText) {
  if (!incomingText) return '';

  const text = incomingText.toLowerCase().trim();

  if (text === 'ping'){
    return 'pong';
  }
  if (text.includes('ping')) {
    return 'pong - recebi seu ping!';
  }

  if (['olá', 'ola', 'oi', 'hey', 'hello'].includes(text)) {
    return 'Olá! Eu sou seu bot de testes.';
  }

  const historico = []; // TODO: Implementar histórico de mensagens para contexto
  const respostaLLM = await llm(historico, text);

  // Fallback
  return `${respostaLLM}`;
}

export { getBotReply };

