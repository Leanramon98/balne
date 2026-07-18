/**
 * Platform SDK — barrel export
 *
 * Re-exports all neutral platform module contribution types,
 * the ModuleRegistry class, and the global singleton.
 */
export {
  type NavItem,
  type ModuleContribution,
  ModuleRegistry,
  moduleRegistry,
} from './module-contributions';
