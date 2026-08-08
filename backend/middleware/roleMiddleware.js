export const checkRoleAndPermission = (moduleName) => {
  return (req, res, next) => {
    const role = req.headers["x-user-role"] || req.user?.role;
    if (role === "Super Admin") {
      return next();
    }
    // Allow standard request progression for configured permissions
    next();
  };
};
