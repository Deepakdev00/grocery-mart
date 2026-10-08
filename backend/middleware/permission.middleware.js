const prisma = require('../config/prisma');

const requirePermissions = (...requiredPermissions) => async (req, res, next) => {
  const roleName = req.admin?.role || req.userRole;
  if (!roleName) return res.status(401).json({ message: 'Authentication required' });

  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      select: {
        permissions: {
          select: { permission: { select: { name: true } } },
        },
      },
    });
    const granted = new Set((role?.permissions || []).map(({ permission }) => permission.name));
    const missingPermissions = requiredPermissions.filter((permission) => !granted.has(permission));

    if (missingPermissions.length) {
      return res.status(403).json({ message: 'Insufficient permission', missingPermissions });
    }

    req.permissions = granted;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { requirePermissions };
