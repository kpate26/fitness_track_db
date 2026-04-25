export function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: message,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
