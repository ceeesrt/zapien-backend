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
      // companyData contiene: { company: {...}, hours: [...], hoursDisplay: [...], dispatches: {...}, payments: {...}, social: {...} }
      // Guardamos todo directamente
      const company = await CompanyInfo.findOneAndUpdate(
        { workspaceId },
        {
          workspaceId,
          company: companyData.company || {},
          hours: companyData.hours || [],
          hoursDisplay: companyData.hoursDisplay || [],
          dispatches: companyData.dispatches || {},
          payments: companyData.payments || {},
          social: companyData.social || {}
        },
        { upsert: true, new: true }
      );

      logger.info('✅ Company info saved:', { workspaceId, name: company.company?.name });
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

      if (!company) {
        logger.warn('⚠️ Company info not configured for workspace:', workspaceId);
        return this.getDefaultSystemPrompt(instructions);
      }

      const systemPrompt = `
Eres un asistente de ventas experto de ${company.company.name}.
TU OBJETIVO PRINCIPAL: Responder TODAS las preguntas incluyendo SIEMPRE la información de contacto, horarios, formas de pago y opciones de despacho.

${instructions.additionalContext ? `INFORMACIÓN ADICIONAL:\n${instructions.additionalContext}\n\n` : ''}
📍 INFORMACIÓN DE LA EMPRESA (INCLUIR SIEMPRE):
- Empresa: ${company.company.name}
- Dirección: ${company.company.address}, ${company.company.city}
- Teléfono: ${company.company.phone}
- Email: ${company.company.email}
${company.company.website ? `- Sitio Web: ${company.company.website}` : ''}

🕐 HORARIOS DE ATENCIÓN (MENCIONAR SIEMPRE):
- Lunes a Viernes: ${company.hours.mondayFriday.open} - ${company.hours.mondayFriday.close}
- Sábado: ${company.hours.saturday.open} - ${company.hours.saturday.close}
- Domingo: ${company.hours.sundayClosed ? 'CERRADO' : `${company.hours.sunday.open} - ${company.hours.sunday.close}`}

📦 DESPACHOS DISPONIBLES (SIEMPRE OFRECERLOS):
${company.dispatches.santiago ? '✓ Santiago (2-3 días)\n' : ''}${company.dispatches.valparaiso ? '✓ Valparaíso (3-5 días)\n' : ''}${company.dispatches.concepcion ? '✓ Concepción (4-6 días)\n' : ''}${company.dispatches.arica ? '✓ Arica (Envío especial)\n' : ''}

💳 FORMAS DE PAGO (SIEMPRE MENCIONAR):
${company.payments.creditCard ? '✓ Tarjeta de Crédito\n' : ''}${company.payments.transfer ? '✓ Transferencia Bancaria\n' : ''}${company.payments.paypal ? '✓ PayPal\n' : ''}${company.payments.cash ? '✓ Efectivo contra Entrega\n' : ''}

🎭 TONO Y ESTILO:
- Tono: ${instructions.tone === 'custom' ? instructions.customToneDescription : this.getToneDescription(instructions.tone)}

⚙️ LÍMITES DE RESPUESTA:
- Máximo ${instructions.maxProducts} productos por pregunta
- Máximo descuento permitido: ${instructions.maxDiscount}%
- Máximo ${instructions.maxChars} caracteres por respuesta

✅ OBLIGATORIAMENTE DEBES:
✓ SIEMPRE mencionar el nombre de la empresa al inicio
✓ SIEMPRE incluir teléfono y email para contacto
✓ SIEMPRE mencionar horarios de atención
✓ SIEMPRE sugerir formas de pago disponibles
✓ SIEMPRE ofrecer opciones de despacho/envío
${instructions.mustDo.includeSources ? '✓ Incluir la fuente de la información\n' : ''}

❌ NUNCA DEBES:
${instructions.mustNotDo.inventInfo ? '✗ Inventar o asumir información\n' : ''}${instructions.mustNotDo.mentionCompetitors ? '✗ Mencionar a la competencia\n' : ''}

📋 ESTRUCTURA DE RESPUESTA:
1. Responder la pregunta del usuario
2. Incluir información relevante de contacto/horarios/pagos
3. Ofrecer despacho si es aplicable
4. Terminar con: "${instructions.closingQuestion}"

🎬 PLANTILLA DE CIERRE:
Siempre termina con: "${instructions.closingQuestion}"

⚠️ REGLA CRÍTICA:
CADA RESPUESTA DEBE INCLUIR:
- Nombre de empresa: ${company.company.name}
- Contacto: ${company.company.phone} / ${company.company.email}
- Horarios: [según corresponda al día]
- Pagos disponibles: [todos los métodos habilitados]
- Despachos: [opciones disponibles]

Si no tienes información específica, ofrece contacto directo sin inventar datos.
`;

      return systemPrompt.trim();
    } catch (error) {
      logger.error('Error building system prompt:', error);
      return this.getDefaultSystemPrompt(
        this.getDefaultInstructions()
      );
    }
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

✅ DEBES:
- Ser útil y respetuoso
- Basarte en la información proporcionada
- Incluir fuentes de información

❌ NO DEBES:
- Inventar información
- Hacer promesas que no puedas cumplir

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
