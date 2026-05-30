import ProductService from '../../services/products/product.service.js';

const productService = new ProductService();

export default class ProductController {
  create = async (req, res) => {
    try {
      const { id: chatbotId, workspaceId } = req.params;
      const productData = req.body;
      const imageFile = req.files?.image;

      const response = await productService.create(chatbotId, workspaceId, productData, imageFile);
      return res.status(response.success ? 201 : 400).json(response);
    } catch (error) {
      console.error('❌ ProductController.create:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear producto'
      });
    }
  };

  list = async (req, res) => {
    try {
      const { id: chatbotId } = req.params;
      const response = await productService.list(chatbotId);
      return res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      console.error('❌ ProductController.list:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al listar productos'
      });
    }
  };

  get = async (req, res) => {
    try {
      const { productId } = req.params;
      const response = await productService.get(productId);
      return res.status(response.success ? 200 : 404).json(response);
    } catch (error) {
      console.error('❌ ProductController.get:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener producto'
      });
    }
  };

  update = async (req, res) => {
    try {
      const { productId } = req.params;
      const updateData = req.body;
      const imageFile = req.files?.image;

      const response = await productService.update(productId, updateData, imageFile);
      return res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      console.error('❌ ProductController.update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar producto'
      });
    }
  };

  delete = async (req, res) => {
    try {
      const { productId } = req.params;
      const response = await productService.delete(productId);
      return res.status(response.success ? 200 : 400).json(response);
    } catch (error) {
      console.error('❌ ProductController.delete:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar producto'
      });
    }
  };

  bulkCreate = async (req, res) => {
    try {
      const { id: chatbotId, workspaceId } = req.params;
      const { products } = req.body;

      // Validar que es array
      if (!Array.isArray(products)) {
        return res.status(400).json({
          success: false,
          message: 'El campo "products" debe ser un array'
        });
      }

      const response = await productService.bulkCreate(workspaceId, chatbotId, products);
      return res.status(response.success ? 201 : 400).json(response);
    } catch (error) {
      console.error('❌ ProductController.bulkCreate:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al importar productos'
      });
    }
  };
}
