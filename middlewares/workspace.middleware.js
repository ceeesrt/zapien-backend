import Workspace from '../models/Workspace.js';

export const validateWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!workspaceId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID and user required'
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: 'No access to this workspace'
      });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('❌ Workspace validation middleware:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
