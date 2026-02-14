import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook para verificar permisos del usuario actual
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene permiso para acceder a un módulo
   */
  const hasPermission = (moduloId: string): boolean => {
    if (!user) return false;
    
    // Admin siempre tiene todos los permisos
    if (user.role === 'admin') return true;
    
    // Verificar en el array de permisos del usuario
    return user.permisos?.includes(moduloId) || false;
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = (moduloIds: string[]): boolean => {
    return moduloIds.some(id => hasPermission(id));
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = (moduloIds: string[]): boolean => {
    return moduloIds.every(id => hasPermission(id));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permisos: user?.permisos || [],
  };
}
