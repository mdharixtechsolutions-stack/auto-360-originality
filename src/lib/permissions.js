/**
 * Helper to check granular user permissions for a given module
 * @param {object} currentUser - The logged in user object from localStorage / auth state
 * @param {string} moduleName - The module key (e.g., 'customers', 'sales')
 * @param {'view' | 'create' | 'edit' | 'delete'} type - The access action type
 * @returns {boolean} Whether the action is permitted
 */
export function hasModulePermission(currentUser, moduleName, type) {
  if (!currentUser) return false;
  
  // Stock finder search module is open to all logged in users
  if (moduleName === "stock_search") {
    if (type === "view") return true;
    return false;
  }

  // Super Admin always bypasses all checks
  if (currentUser.role === "Super Admin" || currentUser.role === "Admin" && moduleName === "dashboard") {
    return true;
  }

  const detailed = currentUser.detailedPermissions || [];
  const found = detailed.find(p => p.module_name === moduleName);
  
  if (!found) {
    // Fallback to legacy view-only flat permissions tracking if detailed entry is missing
    if (type === "view") {
      return (currentUser.permissions || []).includes(moduleName);
    }
    return false;
  }

  if (type === "view") return !!found.can_view;
  if (type === "create") return !!found.can_create;
  if (type === "edit") return !!found.can_edit;
  if (type === "delete") return !!found.can_delete;

  return false;
}
