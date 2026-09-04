
import 'dotenv/config';

const CALENDAR_ID = process.env.CALENDAR_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Cache de 10 minutos para não estourar a cota
let cacheAgenda = { dados: null, timestamp: 0 };

export async function getAgenda(timeMin, timeMax) {
  const agora = Date.now();
  if (cacheAgenda.dados && (agora - cacheAgenda.timestamp < 10 * 60 * 1000)) {
    return cacheAgenda.dados;
  }

  //const timeMin = new Date().toISOString();
  //const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`;

  const res = await fetch(url);
  const json = await res.json();
  //  console.log('getAgenda - JSON:', json);
  if (json.error) throw new Error(json.error.message);

  // Formata para o LLM entender bem
  const formatado = (json.items || []).map(ev => {
    const inicio = ev.start.dateTime || ev.start.date;
    const data = new Date(inicio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    return `- ${data} | ${ev.summary} | Local: ${ev.location || 'a definir'} | Info: ${(ev.description || '').slice(0,150)}`;
  }).join('\n');

  const contexto = formatado || "Nenhum evento nos próximos 60 dias.";

  cacheAgenda = { dados: contexto, timestamp: agora };
  return contexto;
}



/*
{
  "items": [
    {
      "id": "abc123",
      "summary": "Reunião com equipe",
      "description": "Planejamento semanal",
      "start": {
        "dateTime": "2026-09-02T14:00:00-03:00"
      },
      "end": {
        "dateTime": "2026-09-02T15:00:00-03:00"
      },
      "location": "Google Meet"
    }
  ]
}


  const params = new URLSearchParams({
    timeMin: "2026-09-02T12:00:00-03:00",
    timeMax: "2026-09-02T18:00:00-03:00",
    singleEvents: "true",
    orderBy: "startTime"
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  const data = await response.json();




  getAgenda - JSON: {
  kind: 'calendar#events',
  etag: '"p327vjnk1j79pc0o"',
  summary: 'Agenda Pública',
  description: 'Teste',
  updated: '2026-09-03T19:57:36.331Z',
  timeZone: 'America/Sao_Paulo',
  accessRole: 'reader',
  defaultReminders: [],
  items: [
    {
      kind: 'calendar#event',
      etag: '"3576930896148222"',
      id: '7tv549ggkriq2sgf2ib5eva5hl_20260927T160000Z',
      status: 'confirmed',
      htmlLink: 'https://www.google.com/calendar/event?eid=N3R2NTQ5Z2drcmlxMnNnZjJpYjVldmE1aGxfMjAyNjA5MjdUMTYwMDAwWiA0ZDI0N2VlOTljMTlkOTA4YjBkYzhlODE3MmU1NjRjMDk3YmJhYWM4YjdiZjk5OGM0Njk3MGFiYzQxMDBhMjNjQGc',
      created: '2026-09-01T18:02:46.000Z',
      updated: '2026-09-03T19:57:28.074Z',
      summary: 'Feijoada Marina e Lindbergh',
      creator: [Object],
      organizer: [Object],
      start: [Object],
      end: [Object],
      recurringEventId: '7tv549ggkriq2sgf2ib5eva5hl',
      originalStartTime: [Object],
      iCalUID: '7tv549ggkriq2sgf2ib5eva5hl@google.com',
      sequence: 1,
      eventType: 'default'
    }
  ]
}

  */


