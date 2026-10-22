export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!parsed.success) return next(Object.assign(new Error('Request validation failed'), { status: 400, code: 'VALIDATION_ERROR' }));
  req.body = parsed.data.body;
  req.params = parsed.data.params;
  req.validatedQuery = parsed.data.query;
  return next();
};
