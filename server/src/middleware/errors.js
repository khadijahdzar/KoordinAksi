export function notFound(req, res) {
  res.status(404).json({ message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Format JSON request tidak valid." });
  }
  if (error.code === 20 && /Transaction numbers are only allowed/.test(error.message)) {
    return res.status(503).json({
      message: "Operasi ini membutuhkan MongoDB replica set. Konfigurasikan replica set lokal atau gunakan MongoDB Atlas."
    });
  }
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "ID tidak valid." });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "Data sudah terdaftar." });
  }
  console.error(error);
  return res.status(500).json({
    message: process.env.NODE_ENV === "production" ? "Terjadi kesalahan pada server." : error.message
  });
}
