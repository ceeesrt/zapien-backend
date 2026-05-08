import express from 'express';
import IntegrationController from '../../controllers/integrations/integration.controller.js';

const router = express.Router();
const integrationController = new IntegrationController();

router.get('/', integrationController.list);
router.post('/google-calendar/connect', integrationController.startGoogleCalendarOAuth);
router.get('/google-calendar/callback', integrationController.handleGoogleCalendarCallback);
router.delete('/:id', integrationController.disconnect);

export default router;
