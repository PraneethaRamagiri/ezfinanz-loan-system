const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]', err.stack || err.message);

  if (err.code === 'LIMIT_FILE_SIZE' || err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds the 10 MB limit. Please select or capture a smaller image.'
      }
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || err.name || 'SERVER_ERROR',
      message: err.message || 'Internal server error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};

module.exports = errorHandler;
