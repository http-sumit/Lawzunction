/**
 * Centralized role permission hierarchy for Lawzunction Admin Portal
 *
 * Role hierarchy (highest to lowest):
 * 1. Super Admin (SUPER_ADMIN)
 * 2. Admin (ADMIN)
 * 3. Lawyer / Client / User (roles below Admin)
 */

export const normalizeRole = (role) => {
  return (role || '').toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
};

/**
 * Check if the currently logged in admin can delete the target user
 */
export const canRemoveUser = (requesterRole, targetRole) => {
  const reqR = normalizeRole(requesterRole);
  const tgtR = normalizeRole(targetRole);

  // Super Admin can NEVER be deleted by anyone
  if (tgtR === 'SUPER_ADMIN' || tgtR === 'SUPERADMIN') {
    return {
      allowed: false,
      reason: 'Super Admin accounts are permanently protected and cannot be removed.'
    };
  }

  // Super Admin can delete anyone else
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return { allowed: true };
  }

  // Admin can only delete roles strictly below Admin
  if (reqR === 'ADMIN') {
    if (tgtR === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Admins cannot remove other Admins or Super Admins. Only accounts below Admin rank can be deleted.'
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Insufficient permissions. You do not have authority to remove user accounts.'
  };
};

/**
 * Check if the currently logged in admin can edit the target user
 */
export const canEditUser = (requesterRole, targetRole) => {
  const reqR = normalizeRole(requesterRole);
  const tgtR = normalizeRole(targetRole);

  // Super Admin can only be edited by a Super Admin
  if (tgtR === 'SUPER_ADMIN' || tgtR === 'SUPERADMIN') {
    if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Super Admin accounts can only be edited by a Super Admin.'
    };
  }

  // Super Admin can edit anyone else
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return { allowed: true };
  }

  // Admin can only edit roles strictly below Admin
  if (reqR === 'ADMIN') {
    if (tgtR === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Admins cannot edit another Admin or a Super Admin. You can only edit users with a role below Admin.'
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Insufficient permissions. You do not have authority to edit user accounts.'
  };
};

/**
 * Check if the requester is allowed to assign a specific role to a user
 */
export const canAssignRole = (requesterRole, newRole) => {
  const reqR = normalizeRole(requesterRole);
  const newR = normalizeRole(newRole);

  // Super Admin can assign any role
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return { allowed: true };
  }

  // Admin cannot assign Admin or Super Admin (cannot create/promote to Admin)
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
 * Returns options for role dropdown based on requester privileges
 */
export const getAllowedAssignableRoles = (requesterRole) => {
  const reqR = normalizeRole(requesterRole);
  if (reqR === 'SUPER_ADMIN' || reqR === 'SUPERADMIN') {
    return [
      { value: 'SUPER_ADMIN', label: 'Super Admin (Full Authority)' },
      { value: 'ADMIN', label: 'Admin (Chamber Operations)' },
      { value: 'LAWYER', label: 'Lawyer / Advocate' },
      { value: 'CLIENT', label: 'Client (Corporate / Individual)' }
    ];
  }
  if (reqR === 'ADMIN') {
    return [
      { value: 'LAWYER', label: 'Lawyer / Advocate' },
      { value: 'CLIENT', label: 'Client (Corporate / Individual)' }
    ];
  }
  return [];
};
