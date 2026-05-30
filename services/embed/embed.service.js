import Chatbot from '../../models/Chatbot.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import Appointment from '../../models/Appointment.js';
import Lead from '../../models/Lead.js';
import Quote from '../../models/Quote.js';
import openaiService from '../openai/openai.service.js';
import AdvancedRAGService from '../rag/advanced-rag.service.js';
import chatbotConfigService from '../config/chatbot-config.service.js';
import appointmentService from '../appointments/appointment.service.js';
import socialService from '../messaging/social.service.js';
import whatsappService from '../messaging/whatsapp.service.js';
import emailService from '../notifications/email.service.js';
import calendarService from '../calendar/calendar.service.js';
import logger from '../../utils/logger.js';

const whatsAppInstance = new whatsappService();
const advancedRag = new AdvancedRAGService();

// Limpieza de cache cada 30 minutos
setInterval(() => {
    advancedRag.cleanupCache();
}, 30 * 60 * 1000);

export default class EmbedService {
    constructor() {
    }

    startConversation = async (embedKey, visitorId, visitorMetadata = {}) => {
        try {
            const chatbot = await Chatbot.findOne({ embedKey });
            if (!chatbot) {
                return { success: false, message: 'Chatbot no encontrado' };
            }

            const conversation = new Conversation({
                chatbotId: chatbot._id,
                workspaceId: chatbot.workspaceId,
                visitorId: visitorId || 'anonymous',
                visitorMetadata: visitorMetadata,
                status: 'active'
            });

            await conversation.save();

            return {
                success: true,
                message: 'Conversación iniciada',
                data: {
                    conversationId: conversation._id,
                    botId: chatbot._id,
                    welcomeMessage: chatbot.personality?.welcomeMessage || '¡Hola! ¿En qué te puedo ayudar?'
                }
            };
        } catch (error) {
            console.error('❌ EmbedService.startConversation:', error);
            return { success: false, message: error.message };
        }
    };

    sendMessage = async (conversationId, content, botId) => {
        const startTime = Date.now();
        try {
            // 1. Validaciones iniciales
            const chatbot = await Chatbot.findById(botId);
            const conversation = await Conversation.findById(conversationId);

            if (!chatbot) {
                logger.warn('Chatbot not found', { botId, conversationId });
                return { success: false, message: 'Chatbot no encontrado' };
            }

            if (!conversation) {
                logger.warn('Conversation not found', { conversationId });
                return { success: false, message: 'Conversación no encontrada' };
            }

            if (!chatbot.openaiApiKey) {
                logger.warn('OpenAI API key not configured', { botId });
                return {
                    success: false,
                    message: 'OpenAI API key no configurada. Por favor, configura tu chatbot.'
                };
            }

            // 2. Verificar cache de respuesta
            const cachedResponse = advancedRag.getCachedResponse(botId, content);
            if (cachedResponse) {
                logger.info('Returning cached response', {
                    botId,
                    contentLength: content.length
                });

                // Aún guardar mensaje del usuario
                await Message.create({
                    conversationId: conversation._id,
                    chatbotId: chatbot._id,
                    role: 'user',
                    content: content,
                    createdAt: new Date()
                });

                return {
                    success: true,
                    message: 'Mensaje procesado (desde cache)',
                    data: {
                        botMessage: {
                            content: cachedResponse,
                            role: 'assistant',
                            cached: true
                        }
                    }
                };
            }

            // 3. Guardar mensaje del usuario
            await Message.create({
                conversationId: conversation._id,
                chatbotId: chatbot._id,
                role: 'user',
                content: content,
                createdAt: new Date()
            });

            // 4. Búsqueda semántica de documentos
            const ragStartTime = Date.now();
            const ragChunks = await advancedRag.searchDocumentsBySemantics(
                chatbot._id,
                content,
                5
            );
            const ragDuration = Date.now() - ragStartTime;
            logger.performance('RAG Search', ragDuration, { chunks: ragChunks.length });

            // 5. Búsqueda de productos
            const products = await advancedRag.searchProducts(chatbot._id, content, 5);

            // 6. Construir contexto optimizado
            const contextText = advancedRag.buildContext(
                ragChunks,
                products,
                chatbot.personality?.customPrompt
            );

            // 7. Validar token count
            const isValidTokenCount = advancedRag.validateTokenCount(contextText);
            if (!isValidTokenCount) {
                logger.warn('Context exceeds token limit', { botId, contextLength: contextText.length });
            }

            // 8. Obtener historial (últimos 6 mensajes para no exceder contexto)
            const history = await Message.find({
                conversationId: conversation._id
            }).limit(6).sort({ createdAt: -1 }).lean();

            // 9. Construir system prompt Rico (con datos de empresa integrados)
            let systemPrompt = await chatbotConfigService.buildSystemPrompt(
                chatbot.workspaceId,
                chatbot._id
            );

            // Agregar contexto RAG al final del system prompt
            if (contextText) {
                systemPrompt += `\n\nINFORMACIÓN ADICIONAL DE DOCUMENTOS:\n${contextText}`;
            }

            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                },
                ...history.reverse().map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: content
                }
            ];

            // 10. Llamar OpenAI
            const openaiStartTime = Date.now();
            const response = await openaiService.generateResponse(
                chatbot,
                content,
                messages
            );
            const openaiDuration = Date.now() - openaiStartTime;
            logger.performance('OpenAI Generation', openaiDuration, {
                tokensIn: response.tokensIn,
                tokensOut: response.tokensOut
            });

            // 11. Guardar respuesta del bot
            const botMessage = await Message.create({
                conversationId: conversation._id,
                chatbotId: chatbot._id,
                role: 'assistant',
                content: response.content,
                metadata: {
                    ragChunksUsed: ragChunks.map(c => c.chunkId),
                    ragSimilarityScores: ragChunks.map(c => c.similarity),
                    productsReferenced: products.map(p => p._id || p.id),
                    tokensIn: response.tokensIn,
                    tokensOut: response.tokensOut,
                    model: response.model,
                    totalLatencyMs: Date.now() - startTime,
                    ragLatencyMs: ragDuration,
                    openaiLatencyMs: openaiDuration,
                    cost: response.cost,
                    cached: false
                },
                createdAt: new Date()
            });

            // 12. Cachear respuesta
            advancedRag.cacheResponse(botId, content, response.content);

            // 13. Actualizar estadísticas de la conversación
            conversation.messageCount = (conversation.messageCount || 0) + 2;
            conversation.lastMessageAt = new Date();
            await conversation.save();

            // 14. Enviar a canales sociales (asincrónico)
            let whatsappWarning = null;
            let instagramWarning = null;

            if (conversation.source === 'whatsapp') {
                if (!chatbot?.integrations?.whatsapp?.enabled || !chatbot?.integrations?.whatsapp?.accessToken) {
                    whatsappWarning = {
                        warning: 'WHATSAPP_NOT_CONFIGURED',
                        warningMessage: '⚠️ Este chatbot no tiene WhatsApp Business API configurado.'
                    };
                } else {
                    setImmediate(async () => {
                        try {
                            await whatsAppInstance.sendMessage(
                                chatbot.integrations.whatsapp.phoneNumberId,
                                chatbot.integrations.whatsapp.accessToken,
                                conversation.visitorId,
                                response.content
                            );
                        } catch (err) {
                            logger.error('Error sending WhatsApp message', {
                                error: err.message,
                                botId,
                                visitorId: conversation.visitorId
                            });
                        }
                    });
                }
            }

            if (conversation.source === 'instagram') {
                if (!chatbot?.integrations?.instagram?.enabled || !chatbot?.integrations?.instagram?.accessToken) {
                    instagramWarning = {
                        warning: 'INSTAGRAM_NOT_CONFIGURED',
                        warningMessage: '⚠️ Este chatbot no tiene Instagram configurado.'
                    };
                } else {
                    setImmediate(async () => {
                        try {
                            await socialService.sendInstagramMessage(
                                chatbot._id,
                                conversation.visitorId,
                                response.content
                            );
                        } catch (err) {
                            logger.error('Error sending Instagram message', {
                                error: err.message,
                                botId,
                                visitorId: conversation.visitorId
                            });
                        }
                    });
                }
            }

            const totalDuration = Date.now() - startTime;
            logger.info('Message processed successfully', {
                botId,
                conversationId,
                contentLength: content.length,
                totalDurationMs: totalDuration,
                ragChunksUsed: ragChunks.length
            });

            const responseData = {
                success: true,
                message: 'Mensaje procesado',
                data: {
                    botMessage: {
                        _id: botMessage._id,
                        content: botMessage.content,
                        role: 'assistant'
                    },
                    tokensUsed: response.tokensIn + response.tokensOut,
                    cost: response.cost,
                    latencyMs: totalDuration,
                    ragChunksUsed: ragChunks.length
                }
            };

            if (whatsappWarning) {
                responseData.warning = whatsappWarning.warning;
                responseData.warningMessage = whatsappWarning.warningMessage;
            }

            if (instagramWarning) {
                responseData.warning = instagramWarning.warning;
                responseData.warningMessage = instagramWarning.warningMessage;
            }

            return responseData;
        } catch (error) {
            logger.critical('Error in sendMessage', error, {
                conversationId,
                botId,
                contentLength: content?.length
            });

            return {
                success: false,
                message: error.message || 'Error procesando tu mensaje'
            };
        }
    };

    captureLead = async (conversationId, leadData) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return { success: false, message: 'Conversación no encontrada' };
            }

            const lead = new Lead({
                chatbotId: conversation.chatbotId,
                workspaceId: conversation.workspaceId,
                conversationId,
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                company: leadData.company,
                source: 'chatbot',
                message: leadData.message
            });

            await lead.save();

            // Actualizar estadísticas del chatbot
            await Chatbot.updateOne(
                { _id: conversation.chatbotId },
                { $inc: { 'stats.totalLeads': 1 } }
            );

            // Enviar email de confirmación
            setImmediate(async () => {
                await emailService.sendLeadConfirmation({
                    name: leadData.name,
                    email: leadData.email,
                    phone: leadData.phone,
                    company: leadData.company
                });
            });

            return {
                success: true,
                message: 'Lead capturado exitosamente',
                data: { lead }
            };
        } catch (error) {
            console.error('❌ EmbedService.captureLead:', error);
            return { success: false, message: error.message };
        }
    };

    requestQuote = async (conversationId, quoteData) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return { success: false, message: 'Conversación no encontrada' };
            }

            const chatbot = await Chatbot.findById(conversation.chatbotId);

            // Generar número de cotización
            const quoteCount = await Quote.countDocuments({ chatbotId: conversation.chatbotId });
            const quoteNumber = `QT-${conversation.chatbotId.toString().slice(-6)}-${String(quoteCount + 1).padStart(4, '0')}`;

            const quote = new Quote({
                chatbotId: conversation.chatbotId,
                workspaceId: conversation.workspaceId,
                conversationId,
                quoteNumber,
                items: quoteData.items || [],
                subtotal: quoteData.subtotal || 0,
                tax: quoteData.tax || 0,
                total: quoteData.total || 0,
                currency: quoteData.currency || 'CLP',
                customerData: quoteData.customerData || {},
                status: 'draft'
            });

            await quote.save();

            // Actualizar estadísticas del chatbot
            await Chatbot.updateOne(
                { _id: conversation.chatbotId },
                { $inc: { 'stats.totalQuotes': 1 } }
            );

            // Enviar email de cotización asincronamente
            setImmediate(async () => {
                try {
                    const customerEmail = quoteData.customerData?.email || quoteData.customerData?.customerEmail;
                    const customerName = quoteData.customerData?.name || quoteData.customerData?.customerName;

                    if (customerEmail) {
                        await emailService.sendQuote({
                            quoteNumber,
                            customerName: customerName || 'Cliente',
                            customerEmail,
                            items: quoteData.items || [],
                            subtotal: quoteData.subtotal || 0,
                            tax: quoteData.tax || 0,
                            total: quoteData.total || 0,
                            currency: quoteData.currency || 'CLP'
                        }).catch(err => {
                            console.warn('Email de cotización no se pudo enviar:', err);
                        });
                    }
                } catch (err) {
                    console.warn('Error al enviar email de cotización:', err);
                }
            });

            const response = {
                success: true,
                message: 'Cotización creada exitosamente',
                data: { quote }
            };

            return response;
        } catch (error) {
            console.error('❌ EmbedService.requestQuote:', error);
            return { success: false, message: error.message };
        }
    };

    requestAppointment = async (conversationId, appointmentData) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return { success: false, message: 'Conversación no encontrada' };
            }

            const chatbot = await Chatbot.findById(conversation.chatbotId);

            const appointment = new Appointment({
                chatbotId: conversation.chatbotId,
                workspaceId: conversation.workspaceId,
                conversationId,
                scheduledAt: appointmentData.scheduledAt,
                durationMinutes: appointmentData.durationMinutes || 30,
                reason: appointmentData.reason,
                customerName: appointmentData.customerName,
                customerEmail: appointmentData.customerEmail,
                customerPhone: appointmentData.customerPhone,
                notes: appointmentData.notes,
                status: 'scheduled'
            });

            await appointment.save();

            // Actualizar estadísticas del chatbot
            await Chatbot.updateOne(
                { _id: conversation.chatbotId },
                { $inc: { 'stats.totalAppointments': 1 } }
            );

            // Flag para detectar si falta Google Calendar
            let calendarWarning = false;

            // Enviar email de confirmación
            setImmediate(async () => {
                await emailService.sendAppointmentConfirmation({
                    customerName: appointmentData.customerName,
                    customerEmail: appointmentData.customerEmail,
                    scheduledAt: appointmentData.scheduledAt,
                    durationMinutes: appointmentData.durationMinutes || 30,
                    reason: appointmentData.reason
                });
            });

            // Crear evento en Google Calendar si está configurado
            if (chatbot?.integrations?.calendar?.accessToken) {
                setImmediate(async () => {
                    const result = await calendarService.createCalendarEvent(
                        conversation.chatbotId,
                        chatbot.integrations.calendar.accessToken,
                        {
                            customerName: appointmentData.customerName,
                            customerEmail: appointmentData.customerEmail,
                            scheduledAt: appointmentData.scheduledAt,
                            durationMinutes: appointmentData.durationMinutes || 30,
                            reason: appointmentData.reason
                        }
                    );

                    if (result.success) {
                        await Appointment.updateOne(
                            { _id: appointment._id },
                            {
                                calendarEventId: result.calendarEventId,
                                calendarEventUrl: result.calendarEventUrl
                            }
                        );
                    }
                });
            } else {
                calendarWarning = true;
            }

            const response = {
                success: true,
                message: 'Cita agendada exitosamente',
                data: { appointment }
            };

            // Agregar warning si Google Calendar no está conectado
            if (calendarWarning) {
                response.warning = 'APPOINTMENT_NOT_IN_CALENDAR';
                response.warningMessage = '⚠️ Tu cita ha sido registrada en nuestro sistema, pero no aparecerá en Google Calendar porque aún no está conectado.';
            }

            return response;
        } catch (error) {
            console.error('❌ EmbedService.requestAppointment:', error);
            return { success: false, message: error.message };
        }
    };

    getAvailability = async (chatbotId, workspaceId, days = 7) => {
        try {
            const chatbot = await Chatbot.findById(chatbotId);
            if (!chatbot) {
                return { success: false, message: 'Chatbot no encontrado' };
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);

            const slots = await appointmentService.getAvailableSlots(
                chatbotId,
                workspaceId,
                startDate,
                endDate,
                30 // 30 minutos por slot
            );

            return {
                success: true,
                message: 'Disponibilidad obtenida',
                data: { slots }
            };
        } catch (error) {
            console.error('❌ EmbedService.getAvailability:', error);
            return { success: false, message: error.message };
        }
    };

    searchProducts = async (chatbotId, query) => {
        try {
            // TODO: Search products_cache using embeddings (semantic search)
            return {
                success: true,
                message: 'Productos encontrados',
                data: { products: [] }
            };
        } catch (error) {
            console.error('❌ EmbedService.searchProducts:', error);
            return { success: false, message: error.message };
        }
    };
}
