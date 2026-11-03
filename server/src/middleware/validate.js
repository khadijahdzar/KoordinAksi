export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      convert: true
    });

    if (error) {
      return res.status(400).json({
        message: "Data request tidak valid.",
        errors: error.details.map(({ message, path }) => ({
          field: path.join("."),
          message
        }))
      });
    }

    req.body = value;
    return next();
  };
}
