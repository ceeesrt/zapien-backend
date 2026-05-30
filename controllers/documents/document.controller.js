import DocumentService from '../../services/documents/document.service.js';

const documentService = new DocumentService();

export default class DocumentController {
    list = async (req, res) => {
        try {
            const { id: chatbotId } = req.params;
            const response = await documentService.listDocuments(chatbotId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ DocumentController.list:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al listar documentos'
            });
        }
    };

    upload = async (req, res) => {
        try {
            const { id: chatbotId, workspaceId } = req.params;

            console.log('🔵 DocumentController.upload called');
            console.log('   params:', { chatbotId, workspaceId });
            console.log('   req.files exists:', !!req.files);
            console.log('   req.files.file exists:', !!req.files?.file);

            if (!req.files || !req.files.file) {
                console.log('❌ No file in request');
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            console.log('✅ File received:', {
                name: req.files.file.name,
                size: req.files.file.size,
                mimetype: req.files.file.mimetype
            });

            const response = await documentService.uploadDocument(chatbotId, workspaceId, req.files.file);
            console.log('✅ Service response:', response.success);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ DocumentController.upload error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Error al subir documento: ' + error.message
            });
        }
    };

    createText = async (req, res) => {
        try {
            const { id: chatbotId, workspaceId } = req.params;
            const { text } = req.body;
            const response = await documentService.createTextDocument(chatbotId, workspaceId, text);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ DocumentController.createText:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al crear documento de texto'
            });
        }
    };

    getStatus = async (req, res) => {
        try {
            const { documentId } = req.params;
            const response = await documentService.getDocumentStatus(documentId);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ DocumentController.getStatus:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener status'
            });
        }
    };

    reprocess = async (req, res) => {
        try {
            const { documentId } = req.params;
            const response = await documentService.reprocessDocument(documentId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ DocumentController.reprocess:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al reprocessar documento'
            });
        }
    };

    delete = async (req, res) => {
        try {
            const { documentId } = req.params;
            const response = await documentService.deleteDocument(documentId);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ DocumentController.delete:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar documento'
            });
        }
    };
}
