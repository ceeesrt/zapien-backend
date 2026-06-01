import CompanyInfo from '../../models/CompanyInfo.js';
import ChatbotConfig from '../../models/ChatbotConfig.js';
import logger from '../../utils/logger.js';

class ChatbotConfigService {
  /**
   * Obtener configuración completa (Empresa + Instrucciones)
   */
  getConfig = async (workspaceId, chatbotId) => {
    try {
      const company = await CompanyInfo.findOne({ workspaceId });
      const config = await ChatbotConfig.findOne({ chatbotId });

      return {
        success: true,
        data: {
          company: company || null,
          instructions: config?.instructions || this.getDefaultInstructions()
        }
      };
    } catch (error) {
      logger.error('Error getting chatbot config:', error);
      throw error;
    }
  };

  /**
   * Guardar información de empresa
   */
  saveCompanyInfo = async (workspaceId, companyData) => {
    try {
      // companyData contiene: { company: {...}, operationHours: [...], operationHoursDisplay: [...], dispatches: {...}, payments: {...}, social: {...}, additionalInfo: [...] }
      // Guardamos todo directamente
      const company = await CompanyInfo.findOneAndUpdate(
        { workspaceId },
        {
          workspaceId,
          company: companyData.company || {},
          operationHours: companyData.operationHours || [],
          operationHoursDisplay: companyData.operationHoursDisplay || [],
          dispatches: companyData.dispatches || {},
          payments: companyData.payments || {},
          social: companyData.social || {},
          additionalInfo: companyData.additionalInfo || []
        },
        { upsert: true, new: true }
      );

      logger.info('✅ Company info saved:', { workspaceId, name: company.company?.name, additionalInfoCount: company.additionalInfo?.length });
      return { success: true, data: company };
    } catch (error) {
      logger.error('Error saving company info:', error);
      throw error;
    }
  };

  /**
   * Guardar instrucciones del chatbot
   */
  saveInstructions = async (chatbotId, instructionsData) => {
    try {
      const config = await ChatbotConfig.findOneAndUpdate(
        { chatbotId },
        { chatbotId, instructions: instructionsData },
        { upsert: true, new: true }
      );

      logger.info('✅ Instructions saved:', { chatbotId });
      return { success: true, data: config };
    } catch (error) {
      logger.error('Error saving instructions:', error);
      throw error;
    }
  };

  /**
   * Obtener instrucciones por default
   */
  getDefaultInstructions = () => {
    return {
      tone: 'amigable',
      customToneDescription: '',
      additionalContext: '',
      maxProducts: 5,
      maxDiscount: 20,
      maxChars: 500,
      mustDo: {
        mentionHours: true,
        suggestPayment: true,
        includeSources: true
      },
      mustNotDo: {
        inventInfo: true,
        mentionCompetitors: true
      },
      closingQuestion: '¿En qué más puedo ayudarte?',
      mustInclude: {
        sources: true,
        hours: true,
        payments: true,
        dispatch: true
      }
    };
  };

  /**
   * Construir system prompt basándose en la configuración
   */
  buildSystemPrompt = async (workspaceId, chatbotId) => {
    try {
      const { data } = await this.getConfig(workspaceId, chatbotId);
      const company = data.company;
      const instructions = data.instructions;
      const chatbot = await (await import('../../models/Chatbot.js')).default.findById(chatbotId);

      if (!company || !company.company) {
        logger.warn('⚠️ Company info not configured for workspace:', workspaceId);
        return this.getDefaultSystemPrompt(instructions);
      }

      // Construir horarios desde el array de días
      const hoursText = company.operationHours && Array.isArray(company.operationHours) && company.operationHours.length > 0
        ? company.operationHours
            .filter(h => !h.isClosed)
            .map(h => `- ${this.getDayLabel(h.day)}: ${h.open} - ${h.close}`)
            .join('\n')
        : 'No especificado';

      // Construir formas de pago
      const paymentMethods = company.payments ? [
        company.payments.creditCard && '✓ Tarjeta de Crédito',
        company.payments.transfer && '✓ Transferencia Bancaria',
        company.payments.paypal && '✓ PayPal',
        company.payments.cash && '✓ Efectivo contra Entrega',
        company.payments.webpay && '✓ Webpay',
        company.payments.flow && '✓ Flow',
        company.payments.mercadopago && '✓ Mercado Pago',
        company.payments.maquinaPos && '✓ Máquina POS'
      ].filter(Boolean).join('\n') : 'No especificado';

      // Construir despachos
      const dispatchText = company.dispatches?.available
        ? `✓ Sí, realizamos despachos${company.dispatches.specialCases ? `\n  Casos especiales: ${company.dispatches.specialCases}` : ''}`
        : '✗ No realizamos despachos';

      // Construir redes sociales
      const socialText = company.social ? [
        company.social.instagram && `📱 Instagram: @${company.social.instagram}`,
        company.social.facebook && `📱 Facebook: ${company.social.facebook}`,
        company.social.tiktok && `📱 TikTok: @${company.social.tiktok}`,
        company.social.whatsapp && `📱 WhatsApp: ${company.social.whatsapp}`,
        company.social.linkedin && `📱 LinkedIn: ${company.social.linkedin}`,
        company.social.youtube && `📱 YouTube: ${company.social.youtube}`,
        company.social.twitter && `📱 Twitter: @${company.social.twitter}`,
        company.social.telegram && `📱 Telegram: @${company.social.telegram}`
      ].filter(Boolean).join('\n') : '';

      const systemPrompt = `
Eres un asistente de ventas de ${company.company.name}.
TU OBJETIVO: Responder las preguntas del usuario de forma concisa y directa.

${instructions.additionalContext ? `INFORMACIÓN ADICIONAL:\n${instructions.additionalContext}\n\n` : ''}
📍 INFORMACIÓN DE LA EMPRESA:
- Empresa: ${company.company.name}
- Dirección: ${company.company.address}${company.company.city ? ', ' + company.company.city : ''}${company.company.country ? ', ' + company.company.country : ''}
- Teléfono: ${company.company.phone}
- Email: ${company.company.email}
${company.company.website ? `- Sitio Web: ${company.company.website}` : ''}

🕐 HORARIOS DE ATENCIÓN:
${hoursText}

📦 DESPACHOS / ENTREGAS:
${dispatchText}

💳 FORMAS DE PAGO DISPONIBLES:
${paymentMethods}

${socialText ? `🌐 REDES SOCIALES:
${socialText}

` : ''}🎭 TONO Y ESTILO:
- Tono: ${instructions.tone === 'custom' ? instructions.customToneDescription : this.getToneDescription(instructions.tone)}

⚙️ LÍMITES:
- Máximo ${instructions.maxProducts} productos por pregunta
- Máximo descuento permitido: ${instructions.maxDiscount}%
- Máximo ${instructions.maxChars} caracteres por respuesta

✅ GUÍA INTELIGENTE (incluir cuando sea RELEVANTE):
- Incluye contacto/teléfono cuando el usuario lo pueda necesitar
- Menciona horarios si habla sobre disponibilidad o atención
- Sugiere métodos de pago solo si habla de compra/precio
- Ofrece despacho si pregunta por envío o entregas
- Termina siempre con: "${instructions.closingQuestion || '¿En qué más puedo ayudarte?'}"
${instructions.mustDo?.includeSources ? '- Incluye fuentes de información cuando menciones datos específicos\n' : ''}

💡 COTIZACIONES (HUMANIZADO E INTELIGENTE):
CUANDO OFRECER: Solo si el usuario ha mostrado interés concreto (preguntó cantidad, variante específica, o precio total)
CÓMO OFRECER: De forma natural, conversacional, NO como formulario:
  ✓ "Perfecto, 5 unidades son $17.500. Si necesitas un presupuesto formal, ¿cuál es tu email?"
  ✓ "Dale, te preparo la cotización. ¿A qué email te la envío?"
  ✗ "¿Quieres que genere una cotización? Si/No"
TONO: Como si estuvieras ayudando a un cliente real, no como un bot

📋 DATOS NECESARIOS PARA COTIZACIÓN:
${chatbot && chatbot.quoteFields && chatbot.quoteFields.length > 0
  ? chatbot.quoteFields
      .sort((a, b) => a.order - b.order)
      .map(f => `- ${f.label}${f.required ? ' (OBLIGATORIO)' : ''}${f.helpText ? ': ' + f.helpText : ''}`)
      .join('\n')
  : '- Email (OBLIGATORIO)\n- Nombre (OBLIGATORIO)'}
IMPORTANTE: Cuando ofrezcas cotización, pide NATURALMENTE estos datos en la conversación. No hagas un formulario. Solo pide los que falten basándote en lo que ya has capturado.
NUNCA PREGUNTES: Cotización si no hay cantidad/precio en la conversación

${(() => {
  const cal = chatbot?.integrations?.calendar;
  const calEnabled = cal?.enabled === true;
  const hasHours = cal?.bookingHoursStart && cal?.bookingHoursEnd;
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const bookingDays = cal?.bookingDays?.length ? cal.bookingDays.map(d => days[d]).join(', ') : null;

  if (!calEnabled) {
    return `📅 AGENDAMIENTO DE CITAS:
No realizamos citas ni reservas. Si el usuario menciona "cita", "agendar" o "reserva", responde claramente: "Por el momento no gestionamos citas ni reservas. Para más información contáctanos directamente."`;
  }

  if (!hasHours) {
    return `📅 AGENDAMIENTO DE CITAS:
El agendamiento está activado pero los horarios aún no están configurados. Si el usuario pregunta por citas, responde: "Puedes coordinar una cita contactándonos directamente al ${company.company?.phone || '[teléfono]'} o a ${company.company?.email || '[email]'}."`;
  }

  return `📅 AGENDAMIENTO DE CITAS:
CUANDO OFRECER: Cuando el usuario mencione "cita", "agendar", "reserva", "appointment", o quiera conocer disponibilidad.
HORARIOS PARA AGENDAR: ${cal.bookingHoursStart} - ${cal.bookingHoursEnd}${bookingDays ? `, solo ${bookingDays}` : ''}.
CÓMO OFRECER: De forma natural y conversacional:
  ✓ "Claro, podemos agendar una cita de ${cal.bookingHoursStart} a ${cal.bookingHoursEnd}. ¿Qué día te vendría mejor?"
  ✗ "¿Deseas agendar una cita? Si/No"

📋 DATOS NECESARIOS PARA CITA:
- Nombre (OBLIGATORIO)
- Teléfono o Email (al menos uno)
- Fecha y hora preferida
- Motivo de la cita (opcional pero útil)

VALIDACIÓN: Los horarios para agendar deben respetar:
  - Dentro de ${cal.bookingHoursStart}-${cal.bookingHoursEnd}
  ${bookingDays ? `- Días: ${bookingDays}` : ''}
  - Máximo ${cal.maxDaysInAdvance || 30} días en avance`;
})()}

🎁 RECOMENDACIONES DE REGALO:
Si el usuario pregunta por regalos (para mamá, papá, cumpleaños, navidad, etc):
- Los productos recomendados ya han sido seleccionados por el sistema
- Preséntalos como recomendaciones personalizadas, no como catálogo
- Explica POR QUÉ cada producto es un buen regalo
- Sugiere combinaciones si es relevante
- Mantén un tono cálido y personal

Ejemplos:
✓ "Para mamá te recomiendo [Producto] porque es perfecto para que cuide su salud..."
✓ "¿Y si lo combinas con [Otro Producto]? Harían un regalo más completo"
✓ "Tengo [X] opciones hermosas para mamá, ¿cuál te interesa?"
✗ "Aquí están los productos para regalo" (impersonal)
✗ "¿Quieres ver regalos?" (genérico)

❌ NUNCA:
${instructions.mustNotDo?.inventInfo ? '- Inventar o asumir información - si no está explícito arriba, NO lo digas\n' : ''}${instructions.mustNotDo?.mentionCompetitors ? '- Mencionar a la competencia\n' : ''}
- Hablar de servicios no listados (estacionamientos, cafetería, wifi, etc)
- Asumir características del local que no están en la información
- Forzar cotización antes de que el usuario mencione cantidad o precio

📋 ESTRUCTURA:
1. Responder DIRECTAMENTE lo que pregunta
2. Agregar información contextual RELEVANTE (contacto si lo van a necesitar, horarios si es pertinente, etc)
3. Mantén respuestas concisas - sé breve
4. Termina con pregunta de cierre

⚠️ MUY IMPORTANTE - Si no tienes información exacta:
- NO inventes detalles (estacionamientos, servicios, características)
- Di: "No tengo información sobre eso. Te puedo pasar el contacto directo: [teléfono/email]"
- Ofrece contacto directo para que el cliente pregunte directamente
`;

      return systemPrompt.trim();
    } catch (error) {
      logger.error('Error building system prompt:', error);
      return this.getDefaultSystemPrompt(
        this.getDefaultInstructions()
      );
    }
  };

  getDayLabel = (day) => {
    const labels = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return labels[day] || day;
  };

  /**
   * System prompt por defecto
   */
  getDefaultSystemPrompt = (instructions) => {
    return `
Eres un asistente de ventas amigable y profesional.

🎭 TONO: ${this.getToneDescription(instructions.tone)}

⚙️ LÍMITES:
- Máximo ${instructions.maxProducts} productos por respuesta
- Máximo descuento: ${instructions.maxDiscount}%
- Máximo ${instructions.maxChars} caracteres

📋 CATÁLOGO DE PRODUCTOS:
IMPORTANTE: Tu único catálogo de productos es el que se proporciona a continuación.
- Si el usuario pregunta por un producto específico, BUSCA en la lista de productos proporcionada
- Si el producto existe en el catálogo, SIEMPRE incluye: nombre, descripción, precio y stock disponible
- Si pregunta por un producto que NO está en el catálogo, responde claramente que "No tenemos ese producto en este momento"
- Cuando menciones un producto, verifica siempre el stock: si stock > 0, está disponible; si stock = 0, NO está disponible

✅ DEBES:
- Ser útil y respetuoso
- RESPONDER SOLO basándote en el catálogo proporcionado abajo
- Incluir stock y disponibilidad al hablar de productos
- Mencionar precio en CLP
- Sonar como una persona, no como un bot

❌ NO DEBES:
- Inventar productos que no están en el catálogo
- Asumir disponibilidad sin verificar stock
- Hacer promesas sobre productos no listados
- Forzar una cotización si el cliente no ha mencionado cantidad

💡 COTIZACIONES (HUMANIZADO):
- Si el cliente pregunta por cantidad/variante específica: Calcula el total naturalmente
- Luego, ofrece cotización de forma casual: "Si necesitas un presupuesto formal, ¿cuál es tu email?"
- NUNCA preguntes "¿Quieres cotización?" como un formulario - hazlo conversacional
- Tono: Como si ayudaras a un cliente real en una tienda, no como un bot

🎬 CIERRE:
${instructions.closingQuestion}
`;
  };

  /**
   * Descripción del tono
   */
  getToneDescription = (tone) => {
    const descriptions = {
      formal: '🎩 Formal y profesional, mantén distancia respetuosa',
      amigable: '😊 Amigable y cercano, genera confianza',
      casual: '😎 Casual y desenfadado, sé como un amigo',
      custom: 'Personalizado'
    };
    return descriptions[tone] || descriptions.amigable;
  };
}

export default new ChatbotConfigService();
