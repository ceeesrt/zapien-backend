import { Lead } from '../../models/index.js';

export default class LeadService {

    list = async (workspaceId, filters = {}) => {
        try {
            let query = { workspaceId };
            if (filters.status) query.status = filters.status;
            if (filters.search) query.email = { $regex: filters.search, $options: 'i' };

            const leads = await Lead.find(query).sort({ createdAt: -1 });
            return { success: true, message: 'Leads obtenidos', data: leads };
        } catch (error) {
            console.error('❌ LeadService.list:', error);
            return { success: false, message: error.message };
        }
    };

    get = async (leadId) => {
        try {
            const lead = await Lead.findById(leadId);
            if (!lead) return { success: false, message: 'Lead no encontrado' };
            return { success: true, message: 'Lead obtenido', data: lead };
        } catch (error) {
            console.error('❌ LeadService.get:', error);
            return { success: false, message: error.message };
        }
    };

    update = async (leadId, updates) => {
        try {
            const lead = await Lead.findByIdAndUpdate(leadId, updates, { new: true });
            return { success: true, message: 'Lead actualizado', data: lead };
        } catch (error) {
            console.error('❌ LeadService.update:', error);
            return { success: false, message: error.message };
        }
    };

    delete = async (leadId) => {
        try {
            await Lead.deleteOne({ _id: leadId });
            return { success: true, message: 'Lead eliminado' };
        } catch (error) {
            console.error('❌ LeadService.delete:', error);
            return { success: false, message: error.message };
        }
    };

    export = async (workspaceId, filters = {}) => {
        try {
            // TODO: Generate CSV from leads
            return { success: true, message: 'Exportación generada', data: { csvUrl: '' } };
        } catch (error) {
            console.error('❌ LeadService.export:', error);
            return { success: false, message: error.message };
        }
    };
}
