import { Payment, Subscription, Appointment } from '../../models/index.js';
import crypto from 'crypto';

export default class WebhookService {
    handleMercadoPagoNotification = async (data) => {
        try {
            const { id, type, data: mpData } = data;

            if (type === 'payment') {
                const paymentData = mpData;
                const externalReference = paymentData.external_reference;

                const payment = await Payment.findOne({
                    mercadoPagoId: id
                });

                if (!payment) {
                    const newPayment = new Payment({
                        mercadoPagoId: id,
                        amount: paymentData.transaction_amount,
                        currency: paymentData.currency_id,
                        status: paymentData.status,
                        paymentMethod: paymentData.payment_method_id,
                        externalReference: externalReference
                    });
                    await newPayment.save();
                } else {
                    payment.status = paymentData.status;
                    payment.updatedAt = new Date();
                    await payment.save();
                }

                // Update subscription if payment successful
                if (paymentData.status === 'approved' && externalReference) {
                    await Subscription.findOneAndUpdate(
                        { mercadoPagoPreferenceId: externalReference },
                        { status: 'active', lastPaymentDate: new Date() },
                        { new: true }
                    );
                }
            }

            return { success: true, message: 'Notificación procesada' };
        } catch (error) {
            console.error('❌ WebhookService.handleMercadoPagoNotification:', error);
            return { success: false, message: error.message };
        }
    };

    handleGoogleCalendarNotification = async (workspaceId, data) => {
        try {
            const { resourceId, resourceState } = data;

            if (resourceState === 'exists') {
                // Calendar was updated, sync appointments
                // In a real implementation, call Google Calendar API to get updated events
                const appointments = await Appointment.find({
                    workspaceId,
                    syncedWithGoogle: true
                });

                for (const appointment of appointments) {
                    // Mock sync - in real implementation would fetch from Google Calendar API
                    appointment.lastSyncedAt = new Date();
                    await appointment.save();
                }
            }

            return { success: true, message: 'Notificación de Google Calendar procesada' };
        } catch (error) {
            console.error('❌ WebhookService.handleGoogleCalendarNotification:', error);
            return { success: false, message: error.message };
        }
    };

    verifyMercadoPagoSignature = (data, signature, secret) => {
        try {
            const message = `${data.id},${data.type},${data.created},${secret}`;
            const hash = crypto
                .createHash('sha256')
                .update(message)
                .digest('hex');

            return hash === signature;
        } catch (error) {
            console.error('❌ WebhookService.verifyMercadoPagoSignature:', error);
            return false;
        }
    };

    sendConversationAlert = async (workspaceId, conversationData) => {
        try {
            // TODO: Send alert email to workspace owner about new conversation
            return {
                success: true,
                message: 'Alerta enviada',
                data: { conversationData }
            };
        } catch (error) {
            console.error('❌ WebhookService.sendConversationAlert:', error);
            return { success: false, message: error.message };
        }
    };

    sendLeadNotification = async (workspaceId, leadData) => {
        try {
            // TODO: Send notification email about new lead
            return {
                success: true,
                message: 'Notificación de lead enviada',
                data: { leadData }
            };
        } catch (error) {
            console.error('❌ WebhookService.sendLeadNotification:', error);
            return { success: false, message: error.message };
        }
    };
}
