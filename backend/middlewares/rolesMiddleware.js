// Authorization middleware
const allowedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).redirect(`/users/${req.user.role}`);
    }
    next();
  };
};

module.exports = allowedRoles;
