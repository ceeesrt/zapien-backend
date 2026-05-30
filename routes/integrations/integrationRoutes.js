import express from 'express';
import IntegrationController from '../../controllers/integrations/integration.controller.js';
import { validateWorkspaceAccess } from '../../middlewares/workspace.middleware.js';

const router = express.Router({ mergeParams: true });

router.use(validateWorkspaceAccess);

router.get('/:chatbotId/active', IntegrationController.getActive);
router.post('/chatbots/:chatbotId', IntegrationController.connect);
router.delete('/chatbots/:chatbotId', IntegrationController.disconnect);
router.post('/:integrationId/sync', IntegrationController.sync);
router.get('/:integrationId/status', IntegrationController.getStatus);
router.get('/:integrationId/history', IntegrationController.getHistory);

// Test connection (sin validación de workspace, es pre-auth)
router.post('/test-connection', (req, res, next) => {
  // Permitir sin validación de workspace
  IntegrationController.testConnection(req, res);
});

export default router;
