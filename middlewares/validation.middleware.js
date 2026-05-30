export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    return password && password.length >= 6;
};

export const validateWorkspaceId = (workspaceId) => {
    return workspaceId && workspaceId.length === 24;
};

export const validateMongoId = (id) => {
    return id && id.length === 24;
};

export const validateRequired = (fields, obj) => {
    const missing = fields.filter(field => !obj[field]);
    return missing.length === 0 ? null : missing;
};

export const validationMiddleware = (validationRules) => {
    return (req, res, next) => {
        const errors = [];

        for (const rule of validationRules) {
            const { field, type, required = false, minLength, maxLength, pattern } = rule;
            const value = req.body[field];

            if (required && !value) {
                errors.push(`${field} es requerido`);
                continue;
            }

            if (!value) continue;

            if (type === 'email' && !validateEmail(value)) {
                errors.push(`${field} debe ser un email válido`);
            }

            if (type === 'password' && !validatePassword(value)) {
                errors.push(`${field} debe tener mínimo 6 caracteres`);
            }

            if (minLength && value.length < minLength) {
                errors.push(`${field} debe tener mínimo ${minLength} caracteres`);
            }

            if (maxLength && value.length > maxLength) {
                errors.push(`${field} debe tener máximo ${maxLength} caracteres`);
            }

            if (pattern && !pattern.test(value)) {
                errors.push(`${field} tiene formato inválido`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validación fallida',
                errors
            });
        }

        next();
    };
};
