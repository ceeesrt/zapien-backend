import { Workspace, WorkspaceMember } from '../../models/index.js';

export default class WorkspaceService {
    list = async (userId) => {
        try {
            const members = await WorkspaceMember.find({ userId });
            const workspaceIds = members.map(m => m.workspaceId);
            const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });

            return {
                success: true,
                message: 'Workspaces obtenidos',
                data: workspaces
            };
        } catch (error) {
            console.error('❌ WorkspaceService.list:', error);
            return { success: false, message: error.message };
        }
    };

    create = async (userId, name, industry, country) => {
        try {
            const slug = name.toLowerCase().replace(/\s+/g, '-');

            const workspace = new Workspace({
                name,
                slug,
                ownerId: userId,
                industry,
                country,
                plan: 'free'
            });

            await workspace.save();

            await WorkspaceMember.create({
                workspaceId: workspace._id,
                userId,
                role: 'owner',
                status: 'active',
                joinedAt: new Date()
            });

            return {
                success: true,
                message: 'Workspace creado',
                data: workspace
            };
        } catch (error) {
            console.error('❌ WorkspaceService.create:', error);
            return { success: false, message: error.message };
        }
    };

    get = async (workspaceId) => {
        try {
            const workspace = await Workspace.findById(workspaceId);

            if (!workspace) {
                return { success: false, message: 'Workspace no encontrado' };
            }

            return {
                success: true,
                message: 'Workspace obtenido',
                data: workspace
            };
        } catch (error) {
            console.error('❌ WorkspaceService.get:', error);
            return { success: false, message: error.message };
        }
    };

    update = async (workspaceId, updates) => {
        try {
            const allowedFields = ['name', 'logo', 'brandColor', 'industry', 'country'];
            const filteredUpdates = {};

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
            });

            const workspace = await Workspace.findByIdAndUpdate(workspaceId, filteredUpdates, { new: true });

            return {
                success: true,
                message: 'Workspace actualizado',
                data: workspace
            };
        } catch (error) {
            console.error('❌ WorkspaceService.update:', error);
            return { success: false, message: error.message };
        }
    };

    delete = async (workspaceId) => {
        try {
            await Workspace.deleteOne({ _id: workspaceId });
            await WorkspaceMember.deleteMany({ workspaceId });

            return { success: true, message: 'Workspace eliminado' };
        } catch (error) {
            console.error('❌ WorkspaceService.delete:', error);
            return { success: false, message: error.message };
        }
    };

    listMembers = async (workspaceId) => {
        try {
            const members = await WorkspaceMember.find({ workspaceId }).populate('userId', 'email name');

            return {
                success: true,
                message: 'Miembros obtenidos',
                data: members
            };
        } catch (error) {
            console.error('❌ WorkspaceService.listMembers:', error);
            return { success: false, message: error.message };
        }
    };

    inviteMember = async (workspaceId, invitedByUserId, inviteeEmail, role = 'member') => {
        try {
            const existing = await WorkspaceMember.findOne({
                workspaceId,
                'inviteeEmail': inviteeEmail
            });

            if (existing) {
                return { success: false, message: 'Miembro ya existe' };
            }

            const member = await WorkspaceMember.create({
                workspaceId,
                userId: inviteeEmail,
                role,
                status: 'invited',
                invitedBy: invitedByUserId,
                invitedAt: new Date()
            });

            return {
                success: true,
                message: 'Invitación enviada',
                data: member
            };
        } catch (error) {
            console.error('❌ WorkspaceService.inviteMember:', error);
            return { success: false, message: error.message };
        }
    };

    updateMemberRole = async (workspaceId, userId, newRole) => {
        try {
            const member = await WorkspaceMember.findOneAndUpdate(
                { workspaceId, userId },
                { role: newRole },
                { new: true }
            );

            return {
                success: true,
                message: 'Rol actualizado',
                data: member
            };
        } catch (error) {
            console.error('❌ WorkspaceService.updateMemberRole:', error);
            return { success: false, message: error.message };
        }
    };

    removeMember = async (workspaceId, userId) => {
        try {
            await WorkspaceMember.deleteOne({ workspaceId, userId });

            return { success: true, message: 'Miembro removido' };
        } catch (error) {
            console.error('❌ WorkspaceService.removeMember:', error);
            return { success: false, message: error.message };
        }
    };
}
