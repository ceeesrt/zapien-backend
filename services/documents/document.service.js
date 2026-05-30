import { Document } from '../../models/index.js';
import documentProcessor from './document.processor.js';

export default class DocumentService {
    listDocuments = async (chatbotId) => {
        try {
            const documents = await Document.find({ chatbotId }).sort({ createdAt: -1 });
            return { success: true, message: 'Documentos obtenidos', data: documents };
        } catch (error) {
            console.error('❌ DocumentService.listDocuments:', error);
            return { success: false, message: error.message };
        }
    };

    get = async (documentId) => {
        try {
            const document = await Document.findById(documentId);
            if (!document) return { success: false, message: 'Documento no encontrado' };
            return { success: true, message: 'Documento obtenido', data: document };
        } catch (error) {
            console.error('❌ DocumentService.get:', error);
            return { success: false, message: error.message };
        }
    };

    uploadDocument = async (chatbotId, workspaceId, file) => {
        try {
            const document = new Document({
                chatbotId,
                workspaceId,
                filename: file.name,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                status: 'processing'
            });

            await document.save();

            // Procesar documento en background (sin esperar)
            setImmediate(async () => {
                await documentProcessor.processDocument(
                    document._id,
                    chatbotId,
                    workspaceId,
                    file.tempFilePath,
                    file.mimetype,
                    file.name
                );
            });

            return { success: true, message: 'Documento cargado, procesando...', data: document };
        } catch (error) {
            console.error('❌ DocumentService.uploadDocument:', error);
            return { success: false, message: error.message };
        }
    };

    create = async (chatbotId, workspaceId, filename, mimeType, sizeBytes) => {
        try {
            const document = new Document({
                chatbotId,
                workspaceId,
                filename,
                mimeType,
                sizeBytes,
                status: 'uploading'
            });

            await document.save();
            return { success: true, message: 'Documento creado', data: document };
        } catch (error) {
            console.error('❌ DocumentService.create:', error);
            return { success: false, message: error.message };
        }
    };

    updateStatus = async (documentId, status, totalChunks = null) => {
        try {
            const updates = { status };
            if (totalChunks) updates.totalChunks = totalChunks;

            const document = await Document.findByIdAndUpdate(documentId, updates, { new: true });
            return { success: true, message: 'Documento actualizado', data: document };
        } catch (error) {
            console.error('❌ DocumentService.updateStatus:', error);
            return { success: false, message: error.message };
        }
    };

    deleteDocument = async (documentId) => {
        try {
            await Document.deleteOne({ _id: documentId });
            return { success: true, message: 'Documento eliminado' };
        } catch (error) {
            console.error('❌ DocumentService.deleteDocument:', error);
            return { success: false, message: error.message };
        }
    };

    getDocumentStatus = async (documentId) => {
        try {
            const document = await Document.findById(documentId);
            if (!document) return { success: false, message: 'Documento no encontrado' };
            return { success: true, message: 'Status obtenido', data: { status: document.status } };
        } catch (error) {
            console.error('❌ DocumentService.getDocumentStatus:', error);
            return { success: false, message: error.message };
        }
    };

    createTextDocument = async (chatbotId, workspaceId, text) => {
        try {
            const document = new Document({
                chatbotId,
                workspaceId,
                filename: `documento-${Date.now()}.txt`,
                mimeType: 'text/plain',
                sizeBytes: text.length,
                status: 'processing'
            });

            await document.save();

            // Procesar documento en background
            setImmediate(async () => {
                const chunks = documentProcessor.createChunks(text);

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const tokenCount = documentProcessor.countTokens(chunk);

                    const { DocumentChunk } = await import('../../models/index.js');
                    new DocumentChunk({
                        documentId: document._id,
                        chatbotId,
                        workspaceId,
                        chunkIndex: i,
                        text: chunk,
                        tokenCount,
                        metadata: {
                            sourceFile: document.filename,
                            pageNumber: null
                        }
                    }).save();
                }

                await Document.findByIdAndUpdate(document._id, {
                    status: 'ready',
                    totalChunks: chunks.length,
                    processedAt: new Date()
                });
            });

            return { success: true, message: 'Documento de texto creado, procesando...', data: document };
        } catch (error) {
            console.error('❌ DocumentService.createTextDocument:', error);
            return { success: false, message: error.message };
        }
    };

    reprocessDocument = async (documentId) => {
        try {
            const document = await Document.findByIdAndUpdate(
                documentId,
                { status: 'processing' },
                { new: true }
            );
            return { success: true, message: 'Documento reprocessado', data: document };
        } catch (error) {
            console.error('❌ DocumentService.reprocessDocument:', error);
            return { success: false, message: error.message };
        }
    };
}
