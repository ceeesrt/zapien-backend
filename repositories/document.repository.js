import Document from '../models/Document.js';

class DocumentRepository {
  async create(data) {
    return Document.create(data);
  }

  async findById(id) {
    return Document.findById(id);
  }

  async find(filter) {
    return Document.find(filter).select('originalFile stats status createdAt');
  }

  async findOne(filter) {
    return Document.findOne(filter);
  }

  async update(id, data) {
    return Document.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return Document.deleteOne({ _id: id });
  }

  async findByUserAndChatbot(userId, chatbotId) {
    return Document.find({
      userId,
      chatbotId,
      status: 'ready'
    }).select('originalFile stats createdAt');
  }

  async searchByEmbedding(userId, chatbotId, embedding, limit = 5) {
    try {
      return await Document.aggregate([
        {
          $match: {
            userId,
            chatbotId,
            status: 'ready'
          }
        },
        {
          $unwind: '$chunks'
        },
        {
          $search: {
            cosmosSearch: embedding,
            k: limit * 2
          },
          scoreDetails: { type: 'uniform' }
        },
        {
          $project: {
            similarityScore: { $meta: 'searchScore' },
            text: '$chunks.text',
            category: '$chunks.metadata.category',
            importance: '$chunks.metadata.importance',
            source: '$originalFile.name',
            tokens: '$chunks.tokens'
          }
        },
        { $sort: { similarityScore: -1 } },
        { $limit: limit * 2 }
      ]);
    } catch (error) {
      console.error('Error en searchByEmbedding:', error);
      return [];
    }
  }

  async getDocumentStats(userId, chatbotId) {
    const result = await Document.aggregate([
      {
        $match: {
          userId,
          chatbotId,
          status: 'ready'
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalChunks: { $sum: '$stats.totalChunks' },
          totalTokens: { $sum: '$stats.totalTokens' },
          totalSize: { $sum: '$originalFile.size' }
        }
      }
    ]);

    return result.length > 0 ? result[0] : {
      totalDocuments: 0,
      totalChunks: 0,
      totalTokens: 0,
      totalSize: 0
    };
  }

  async getChunksByCategory(userId, chatbotId, category) {
    return await Document.aggregate([
      {
        $match: {
          userId,
          chatbotId,
          status: 'ready'
        }
      },
      {
        $unwind: '$chunks'
      },
      {
        $match: {
          'chunks.metadata.category': category
        }
      },
      {
        $project: {
          text: '$chunks.text',
          tokens: '$chunks.tokens',
          source: '$originalFile.name'
        }
      }
    ]);
  }
}

export default DocumentRepository;
