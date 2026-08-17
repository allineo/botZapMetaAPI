
function getBotReply(incomingText) {
  if (!incomingText) return '';

  const text = incomingText.toLowerCase().trim();

  if (text === 'ping'){
    return 'pong';
  }
  if (text.includes('ping')) {
    return 'pong - recebi seu ping!';
  }

  if (['olá', 'ola', 'oi', 'hey', 'hello'].includes(text)) {
    return 'Olá! Eu sou seu bot de testes.\n\n Digite *menu* para ver opções.';
  }

  if (text === '/menu' || text === 'menu') {
    return (
      '📋 *Menu:*\n' +
      '2️⃣ Digite *oi* → saudação\n' +
      '3️⃣ Digite *ajuda* → comandos\n' +
      '4️⃣ Digite *hora* → hora atual'
    );
  }

  if (['ajuda', 'help', 'comandos'].includes(text)) {
    return (
      '*Comandos disponíveis:*\n' +
      '• `oi` / `olá`\n' +
      '• `/menu`\n' +
      '• `hora`'
    );
  }

  if (text === 'hora' || text.includes('que horas')) {
    const agora = new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `Agora são ${agora} (horário de Brasília)`;
  }

  // Fallback
  return `Você disse: "${incomingText}"`;
}

module.exports = { getBotReply };
