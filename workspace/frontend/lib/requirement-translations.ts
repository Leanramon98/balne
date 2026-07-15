/**
 * Frontend translation map for requirement names.
 *
 * Requirements are stored in Spanish in the database; this map provides
 * Portuguese translations keyed by requirement code when the active
 * locale is 'pt'. Falls back to the original Spanish name otherwise.
 */

export const REQUIREMENT_NAME_PT: Record<string, string> = {
  // ── GOB: ORG ──
  GOB_ORG_01: 'Estrutura DTI',
  GOB_ORG_02: 'Liderança política',
  GOB_ORG_03: 'Equipe multidisciplinar',
  GOB_ORG_04: 'Participação público-privada',
  GOB_ORG_05: 'Rede DTI',

  // ── GOB: FIN ──
  GOB_FIN_01: 'Orçamento DTI',
  GOB_FIN_02: 'Diversificação financeira',
  GOB_FIN_03: 'Investimento TIC',
  GOB_FIN_04: 'Retorno do investimento',
  GOB_FIN_05: 'Ajudas e subsídios',

  // ── GOB: PLA ──
  GOB_PLA_01: 'Plano estratégico',
  GOB_PLA_02: 'Roteiro',
  GOB_PLA_03: 'Indicadores de acompanhamento',
  GOB_PLA_04: 'Avaliação periódica',
  GOB_PLA_05: 'Participação cidadã',

  // ── GOB: GEST ──
  GOB_GEST_01: 'Sistema de qualidade',
  GOB_GEST_02: 'Processos definidos',
  GOB_GEST_03: 'Cartas de serviços',
  GOB_GEST_04: 'Satisfação do turista',
  GOB_GEST_05: 'Gestão de reclamações',

  // ── INN: ECO ──
  INN_ECO_01: 'Ecossistema inovador',
  INN_ECO_02: 'Empreendedorismo',
  INN_ECO_03: 'Colaboração universidade-empresa',
  INN_ECO_04: 'Laboratório de inovação',
  INN_ECO_05: 'Prêmios e incentivos',

  // ── INN: DAT ──
  INN_DAT_01: 'Dados abertos',
  INN_DAT_02: 'Qualidade do dado',
  INN_DAT_03: 'Painel de controle',
  INN_DAT_04: 'Big data',
  INN_DAT_05: 'Privacidade de dados',

  // ── INN: EXP ──
  INN_EXP_01: 'Personalização',
  INN_EXP_02: 'Gamificação',
  INN_EXP_03: 'Realidade aumentada',
  INN_EXP_04: 'Cocriação',
  INN_EXP_05: 'Inovação em serviços',

  // ── TEC: INF ──
  TEC_INF_01: 'Infraestrutura TIC',
  TEC_INF_02: 'Cibersegurança',
  TEC_INF_03: 'Computação em nuvem',
  TEC_INF_04: 'Sistemas interoperáveis',
  TEC_INF_05: 'Manutenção tecnológica',

  // ── TEC: CON ──
  TEC_CON_01: 'Cobertura wifi',
  TEC_CON_02: 'Conectividade 5G',
  TEC_CON_03: 'Rede de sensores',
  TEC_CON_04: 'Conectividade em alojamentos',

  // ── TEC: SEN ──
  TEC_SEN_01: 'Sensores ambientais',
  TEC_SEN_02: 'Controle de lotação inteligente',
  TEC_SEN_03: 'Mobilidade inteligente',
  TEC_SEN_04: 'Gestão de recursos',

  // ── TEC: PLAT ──
  TEC_PLAT_01: 'Plataforma integrada',
  TEC_PLAT_02: 'App turística',
  TEC_PLAT_03: 'Portal web',
  TEC_PLAT_04: 'Comércio eletrônico',
  TEC_PLAT_05: 'API turística',

  // ── SOST: MED ──
  SOST_MED_01: 'Gestão ambiental',
  SOST_MED_02: 'Energia renovável',
  SOST_MED_03: 'Gestão de resíduos',
  SOST_MED_04: 'Pegada de carbono',
  SOST_MED_05: 'Proteção natural',

  // ── SOST: SOC ──
  SOST_SOC_01: 'Impacto social',
  SOST_SOC_02: 'Turismo inclusivo',
  SOST_SOC_03: 'Emprego local',
  SOST_SOC_04: 'Patrimônio cultural',
  SOST_SOC_05: 'Qualidade de vida',

  // ── SOST: ECON ──
  SOST_ECON_01: 'Impacto econômico',
  SOST_ECON_02: 'Sazonalidade',
  SOST_ECON_03: 'Gasto turístico',
  SOST_ECON_04: 'Empreendedorismo local',
  SOST_ECON_05: 'Fornecedores locais',

  // ── ACC: ACC_FIS ──
  ACC_FIS_01: 'Acessibilidade urbana',
  ACC_FIS_02: 'Acessibilidade em alojamentos',
  ACC_FIS_03: 'Acessibilidade em atrativos',
  ACC_FIS_04: 'Transporte acessível',
  ACC_FIS_05: 'Sinalização acessível',

  // ── ACC: ACC_DIG ──
  ACC_DIG_01: 'Acessibilidade web',
  ACC_DIG_02: 'Informação multilíngue',
  ACC_DIG_03: 'Leitura fácil',
  ACC_DIG_04: 'Canais de atendimento',
};

/**
 * Returns the translated requirement name for the given locale.
 * Falls back to `fallback` (typically req.name from the API) when
 * no translation exists or locale is not 'pt'.
 */
export function getRequirementName(
  code: string | undefined | null,
  locale: string,
  fallback: string,
): string {
  if (locale !== 'pt' || !code) return fallback;
  return REQUIREMENT_NAME_PT[code] ?? fallback;
}
