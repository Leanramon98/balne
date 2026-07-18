/**
 * Module contribution types and registry.
 *
 * The neutral shell uses this registry to discover navigation items
 * contributed by feature modules. Modules register independently and
 * must not import each other's contributions.
 */

export interface NavItem {
  /** Unique identifier within the module */
  id: string;
  /** Display label for the navigation item */
  label: string;
  /** Route href */
  href: string;
  /** Icon name string (resolved by the shell via a lookup map) */
  icon?: string;
  /** Optional permissions required for this item to be visible */
  requiredPermissions?: string[];
  /** Optional section/group label */
  section?: string;
  /** Sort order within the section (lower comes first) */
  order?: number;
}

export interface ModuleContribution {
  /** Unique module identifier (e.g. 'reference', 'evaluations') */
  moduleId: string;
  /** Navigation items contributed by this module */
  navItems: NavItem[];
}

export class ModuleRegistry {
  private contributions: Map<string, ModuleContribution> = new Map();

  register(contribution: ModuleContribution): void {
    this.contributions.set(contribution.moduleId, contribution);
  }

  getNavItems(userPermissions?: string[]): NavItem[] {
    const allItems: NavItem[] = [];
    const perms = userPermissions ?? [];

    for (const contrib of this.contributions.values()) {
      for (const item of contrib.navItems) {
        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
          const hasAll = item.requiredPermissions.every((p) => perms.includes(p));
          if (!hasAll) continue;
        }
        allItems.push(item);
      }
    }

    allItems.sort((a, b) => {
      const aOrder = a.order ?? 999;
      const bOrder = b.order ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id.localeCompare(b.id);
    });

    return allItems;
  }

  hasModule(id: string): boolean {
    return this.contributions.has(id);
  }

  getModule(id: string): ModuleContribution | undefined {
    return this.contributions.get(id);
  }
}

/** Singleton instance shared across the frontend */
export const moduleRegistry = new ModuleRegistry();
