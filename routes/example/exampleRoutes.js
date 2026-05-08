import express from 'express';
import ExampleController from '../../controllers/example/example.controller.js';

const router = express.Router();
const exampleController = new ExampleController();

router.get('/status', exampleController.getStatus);

export default router;
