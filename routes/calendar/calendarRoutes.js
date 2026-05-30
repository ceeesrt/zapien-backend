import express from 'express';
import CalendarController from '../../controllers/calendar/calendar.controller.js';

const router = express.Router({ mergeParams: true });
const calendarController = new CalendarController();

router.get('/auth-url/:chatbotId', calendarController.getAuthUrl);
router.get('/oauth/callback', calendarController.oauthCallback);
router.get('/available-slots/:chatbotId', calendarController.getAvailableSlots);
router.delete('/:chatbotId', calendarController.disconnect);

export default router;
