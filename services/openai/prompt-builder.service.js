/**
 * PromptBuilderService
 * Construye prompts profesionales para OpenAI basados en contexto
 */

class PromptBuilderService {

  buildSystemPrompt = (chatbot, context = []) => {
    const documentContent = context.length > 0
      ? this.formatDocumentContext(context)
      : '';

    return `Eres un asistente de servicio al cliente profesional para: ${chatbot.name}

${chatbot.personality?.customPrompt ? `Contexto: ${chatbot.personality.customPrompt}\n` : ''}

${documentContent ? `INFORMACIÓN DISPONIBLE:\n${documentContent}\n` : ''}

REGLAS CRÍTICAS:
1. ⚠️ SOLO responde preguntas basadas en la INFORMACIÓN PROPORCIONADA arriba
2. Si la pregunta NO está en los documentos, DEBES responder: "No tengo esa información en mis documentos. Por favor contacta con nuestro equipo para una respuesta más precisa."
3. NO inventar información (NO alucinar)
4. Sé ${chatbot.personality?.tone || 'profesional y amable'}
5. Responde en ${chatbot.language || 'español'}
6. Si hay múltiples partes en la pregunta, responde cada una
7. Mantén las respuestas concisas y claras
8. Si mencionas precios o datos específicos, asegúrate que estén en los documentos

FORMATO DE RESPUESTA:
- Directo al punto
- Máximo 2 párrafos
- Si necesitas dirigir al usuario, ofrece: "¿Hay algo más en lo que pueda ayudarte?"`;
  };

  buildUserMessage = (query, context = []) => {
    if (context.length === 0) {
      return `Pregunta del cliente: ${query}

Responde basándote en la información disponible.`;
    }

    const sources = [...new Set(context.map(c => c.source))].join(', ');

    return `Pregunta del cliente: ${query}

Información relevante disponible:
${context.map((c, i) => `[${i + 1}] (${c.source}) - Categoría: ${c.category}\n${c.text}`).join('\n\n')}

IMPORTANTE:
- Responde SOLO basándote en la información anterior
- Si la pregunta no está en los documentos, di que no tienes esa información
- Menciona la fuente si es relevante`;
  };

  buildMessages = (chatbot, query, context = [], customSystemPrompt = null) => {
    // Si se proporciona un systemPrompt personalizado (desde configuración), usarlo
    // Si no, construir uno por defecto
    const systemPrompt = customSystemPrompt
      ? customSystemPrompt
      : this.buildSystemPrompt(chatbot, context);

    const userMessage = this.buildUserMessage(query, context);

    return [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
  };

  formatDocumentContext = (context) => {
    if (!context || context.length === 0) {
      return '';
    }

    const grouped = {};
    context.forEach(doc => {
      if (!grouped[doc.source]) {
        grouped[doc.source] = [];
      }
      grouped[doc.source].push(doc);
    });

    let formatted = '';
    Object.entries(grouped).forEach(([source, docs], idx) => {
      formatted += `\n[Documento ${idx + 1}: ${source}]\n`;
      docs.forEach((doc, docIdx) => {
        formatted += `  ${docIdx + 1}. ${doc.text}\n`;
      });
    });

    return formatted;
  };

  // Construir prompt para validación de respuesta
  buildValidationPrompt = (response, context) => {
    return {
      role: 'user',
      content: `¿La siguiente respuesta está basada en la información proporcionada?

RESPUESTA: "${response}"

INFORMACIÓN DISPONIBLE:
${context.map(c => `- ${c.text}`).join('\n')}

Responde solo "SÍ" o "NO". Si es "NO", explica brevemente por qué.`
    };
  };

  // Construir prompt para clasificar pregunta
  buildClassificationPrompt = (query) => {
    return {
      role: 'user',
      content: `Clasifica la siguiente pregunta en una de estas categorías:
- PRICING: Precios, costos, tarifas, planes
- FEATURES: Características, funcionalidades, capacidades
- POLICIES: Políticas, términos, condiciones, derechos
- CONTACT: Información de contacto, ubicación, teléfono
- HOURS: Horarios, disponibilidad
- PRODUCT: Información sobre productos/servicios
- OTHER: Otra

Pregunta: "${query}"

Responde solo la categoría.`
    };
  };

  // Construir prompt para detectar alucinación
  buildHallucinationDetectionPrompt = (response, sources) => {
    return {
      role: 'user',
      content: `Detecta si esta respuesta contiene información inventada (alucinación):

RESPUESTA: "${response}"

FUENTES DISPONIBLES:
${sources.join('\n')}

Responde con:
- "VÁLIDA" si la respuesta está completamente basada en las fuentes
- "PARCIAL" si tiene información de las fuentes pero también inventada
- "ALUCINACIÓN" si está mayormente inventada

Explica brevemente.`
    };
  };
}

export default PromptBuilderService;
