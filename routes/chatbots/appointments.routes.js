import express from 'express';
import AppointmentController from '../../controllers/appointments/appointment.controller.js';

const router = express.Router({ mergeParams: true });
const appointmentController = new AppointmentController();

router.get('/', appointmentController.list);
router.patch('/:id', appointmentController.patch);
router.delete('/:id', appointmentController.delete);
router.get('/:id', appointmentController.get);

export default router;
