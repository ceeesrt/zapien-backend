import express from 'express';
import WorkspaceController from '../../controllers/workspaces/workspace.controller.js';
import ChatbotRoutes from '../chatbots/chatbotRoutes.js';
import LeadRoutes from '../leads/leadRoutes.js';
import AppointmentRoutes from '../appointments/appointmentRoutes.js';
import QuoteRoutes from '../quotes/quoteRoutes.js';
import IntegrationRoutes from '../integrations/integrationRoutes.js';

const router = express.Router();
const workspaceController = new WorkspaceController();

// Workspace CRUD
router.get('/', workspaceController.list);
router.post('/', workspaceController.create);
router.get('/:id', workspaceController.get);
router.patch('/:id', workspaceController.update);
router.delete('/:id', workspaceController.delete);

// Members
router.get('/:id/members', workspaceController.listMembers);
router.post('/:id/invite', workspaceController.inviteMember);
router.patch('/:id/members/:userId', workspaceController.updateMemberRole);
router.delete('/:id/members/:userId', workspaceController.removeMember);

// Nested routes
router.use('/:workspaceId/chatbots', ChatbotRoutes);
router.use('/:workspaceId/leads', LeadRoutes);
router.use('/:workspaceId/appointments', AppointmentRoutes);
router.use('/:workspaceId/quotes', QuoteRoutes);
router.use('/:workspaceId/integrations', IntegrationRoutes);

export default router;
