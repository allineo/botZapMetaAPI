import { llmIntencao } from "./llmIntencaoServer.js";
import { llm } from "./llmServer.js";
import { getAgenda } from "./agendaServer.js";

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

  let intencaoPergunta = await llmIntencao(historico, text);
  intencaoPergunta = JSON.parse(intencaoPergunta);
  console.log('intencaoPergunta:', intencaoPergunta);

  let respostaLLM = 'Pesquisando pergunta sobre: ';
  if (intencaoPergunta.intencao === "BUSCAR_AGENDA") {
    // consultar Google Calendar
    //{"intencao": "BUSCAR_AGENDA",
    // "timeMin": "2026-09-02T12:00:00-03:00",
    // "timeMax": "2026-09-02T18:00:00-03:00",
    // "q": "reunião"}

    respostaLLM += `agenda.\n` 
                  + `Eventos de: ${intencaoPergunta.timeMin} até ${intencaoPergunta.timeMax}.` 
                  + `Pergunta: ${intencaoPergunta.q}`;

    let agenda = await getAgenda(intencaoPergunta.timeMin, intencaoPergunta.timeMax);
    console.log('Agenda:', agenda);

    respostaLLM = `\n\nEventos encontrados:\n${agenda}`;
  
  } else if (intencaoPergunta.intencao === "CONSULTAR_IARAA") {
    // consultar IARAA
    respostaLLM += `IARAA.\n` 
                  + `Assunto: ${intencaoPergunta.assunto}`;

  } else {
   // respostaLLM = await llm(historico, text);
   // resposta da pergunta genérica
    respostaLLM = `${intencaoPergunta.resposta}`;
  }

  return `${respostaLLM}`;
}

export { getBotReply };

