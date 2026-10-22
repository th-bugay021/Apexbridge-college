export const notImplemented = (_req, res) => res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented yet' } });
