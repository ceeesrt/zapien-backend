import express from 'express';
import LeadController from '../../controllers/leads/lead.controller.js';

const router = express.Router({ mergeParams: true });
const leadController = new LeadController();

router.get('/', leadController.list);
router.get('/export', leadController.export);
router.get('/:id', leadController.get);
router.patch('/:id', leadController.update);
router.delete('/:id', leadController.delete);

export default router;
