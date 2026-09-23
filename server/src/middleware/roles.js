export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles` });
    }

    next();
  };
};

/**
 * Normalizes role string for comparison (e.g. 'Super Admin' -> 'SUPER_ADMIN')
 */
export const normalizeRole = (role) => {
  return (role || '').toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
};

/**
 * Role-based permission hierarchy:
 * 1. SUPER_ADMIN
 * 2. ADMIN
 * 3. LAWYER / CLIENT / USER (roles below Admin)
 */

/**
 * Can requesterRole remove/delete targetRole?
 * - NO ONE can delete a Super Admin (fully protected).
 * - Super Admin can delete any other user.
 * - Admin can only delete users strictly below Admin rank.
 * - Roles below Admin cannot delete anyone.
 */
export const canRemoveUser = (requesterRole, targetRole) => {
  const reqR = normalizeRole(requesterRole);
  const tgtR = normalizeRole(targetRole);

  // Rule 1: Super Admin is completely protected from deletion
  if (tgtR === 'SUPER_ADMIN' || tgtR === 'SUPERADMIN') {
    return {
      allowed: false,
      reason: 'Super Admin accounts are permanently protected and cannot be deleted.'
    };
  }

  // Rule 2: Super Admin can delete anyone else
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return {
      allowed: true
    };
  }

  // Rule 3: Admin can only delete roles strictly below Admin
  if (reqR === 'ADMIN') {
    if (tgtR === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Admins cannot delete other Admins or Super Admins. Only users below Admin rank can be removed.'
      };
    }
    return {
      allowed: true
    };
  }

  // Rule 4: Non-admins cannot delete any user
  return {
    allowed: false,
    reason: 'Insufficient permissions. You do not have authority to remove user accounts.'
  };
};

/**
 * Can requesterRole update/edit targetRole?
 * - Super Admin can edit ANY user (including other Admins, lower roles, and Super Admins).
 * - Admin can ONLY edit users with a role strictly below Admin.
 * - Admin CANNOT edit another Admin or a Super Admin at all.
 * - NO ONE except a Super Admin can edit a Super Admin's details.
 */
export const canEditUser = (requesterRole, targetRole) => {
  const reqR = normalizeRole(requesterRole);
  const tgtR = normalizeRole(targetRole);

  // Rule 1: Only Super Admin can edit a Super Admin
  if (tgtR === 'SUPER_ADMIN' || tgtR === 'SUPERADMIN') {
    if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Super Admin accounts can only be edited by a Super Admin.'
    };
  }

  // Rule 2: Super Admin can edit anyone else
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return { allowed: true };
  }

  // Rule 3: Admin can only edit roles strictly below Admin
  if (reqR === 'ADMIN') {
    if (tgtR === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Admins cannot edit another Admin or a Super Admin. You can only edit users with a role below Admin.'
      };
    }
    return { allowed: true };
  }

  // Rule 4: Non-admins cannot edit any user
  return {
    allowed: false,
    reason: 'Insufficient permissions. You do not have authority to edit user accounts.'
  };
};

/**
 * Can requesterRole assign newRole to a user?
 * - Super Admin can assign ANY role (including Admin, Super Admin, Lawyer, Client).
 * - Admin CANNOT assign Admin or Super Admin role (can never create/promote an Admin).
 * - Admin can only assign roles strictly below Admin (Lawyer, Client, etc.).
 */
export const canAssignRole = (requesterRole, newRole) => {
  const reqR = normalizeRole(requesterRole);
  const newR = normalizeRole(newRole);

  // Super Admin can assign any valid role
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return { allowed: true };
  }

  // Admin cannot assign Admin or Super Admin
  if (reqR === 'ADMIN') {
    if (newR === 'SUPER_ADMIN' || newR === 'SUPERADMIN' || newR === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Admins cannot assign the Admin or Super Admin role. Only roles strictly below Admin can be assigned.'
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Insufficient permissions to assign user roles.'
  };
};

/**
 * Returns the list of roles that a requester is allowed to select/assign
 */
export const getAllowedAssignableRoles = (requesterRole) => {
  const reqR = normalizeRole(requesterRole);
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'CLIENT'];
  }
  if (reqR === 'ADMIN') {
    return ['LAWYER', 'CLIENT'];
  }
  return [];
};

