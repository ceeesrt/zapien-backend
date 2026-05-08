import express from 'express';
import DocumentController from '../../controllers/documents/document.controller.js';

const router = express.Router({ mergeParams: true });
const documentController = new DocumentController();

router.get('/', documentController.list);
router.post('/', documentController.upload);
router.post('/text', documentController.createText);
router.get('/:documentId/status', documentController.getStatus);
router.post('/:documentId/reprocess', documentController.reprocess);
router.delete('/:documentId', documentController.delete);

export default router;
