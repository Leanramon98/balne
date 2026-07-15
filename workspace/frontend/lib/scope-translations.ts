/**
 * Frontend translation map for scope/catalog names.
 *
 * Scopes are stored in Spanish in the database; this map provides
 * Portuguese translations keyed by scope acronym when the active
 * locale is 'pt'. Falls back to the original Spanish name otherwise.
 */

export const SCOPE_NAME_PT: Record<string, string> = {
  // GOB (Gobernanza)
  ORG: 'Organização',
  FIN: 'Financiamento',
  PLA: 'Planejamento',
  GEST: 'Gestão',

  // INN (Innovación)
  ECO: 'Ecossistema',
  DAT: 'Dados',
  EXP: 'Experiência',

  // TEC (Tecnología)
  INF: 'Infraestrutura',
  CON: 'Conectividade',
  SEN: 'Sensorização',
  PLAT: 'Plataforma',

  // SOST (Sostenibilidad)
  MED: 'Meio Ambiente',
  SOC: 'Social',
  ECON: 'Econômica',

  // ACC (Accesibilidad)
  ACC_FIS: 'Acessibilidade Física',
  ACC_DIG: 'Acessibilidade Digital',
};

/**
 * Returns the translated scope name for the given locale.
 * Falls back to `fallback` (typically scope.name from the API) when
 * no translation exists or locale is not 'pt'.
 */
export function getScopeName(
  acronym: string | undefined | null,
  locale: string,
  fallback: string,
): string {
  if (locale !== 'pt' || !acronym) return fallback;
  return SCOPE_NAME_PT[acronym.toUpperCase()] ?? fallback;
}
