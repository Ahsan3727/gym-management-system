// Central error handler. Any error passed via next(err), or thrown inside
// an asyncHandler-wrapped route, ends up here instead of leaking a stack
// trace to the client.
function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format.' });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong on the server.' });
}

module.exports = { notFound, errorHandler };
