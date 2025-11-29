export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // req.user được gán từ authMiddleware
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ message: "Forbidden: User role not defined" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: You do not have permission. Required: ${allowedRoles.join(
          ", "
        )}`,
      });
    }
    next();
  };
};
