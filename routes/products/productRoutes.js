import express from 'express';
import ProductController from '../../controllers/products/product.controller.js';

const router = express.Router({ mergeParams: true });
const productController = new ProductController();

router.get('/', productController.list);
router.post('/', productController.create);
router.post('/bulk', productController.bulkCreate);
router.get('/:productId', productController.get);
router.patch('/:productId', productController.update);
router.delete('/:productId', productController.delete);

export default router;
