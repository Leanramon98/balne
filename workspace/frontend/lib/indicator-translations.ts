/**
 * Frontend translation map for indicator names.
 *
 * Indicators are stored in Spanish in the database; this map provides
 * Portuguese translations keyed by indicator code when the active
 * locale is 'pt'. Falls back to the original Spanish name otherwise.
 */

export const INDICATOR_NAME_PT: Record<string, string> = {
  // ── GOB: ORG ──
  'GOB_ORG_01.NI1': 'Órgão de gestão DTI',
  'GOB_ORG_01.NI2': 'Pessoal DTI dedicado',
  'GOB_ORG_02.NI1': 'Compromisso político',
  'GOB_ORG_02.NI2': 'Delegado DTI',
  'GOB_ORG_03.NI1': 'Perfis da equipe',
  'GOB_ORG_03.NI2': 'Formação da equipe',
  'GOB_ORG_04.NI1': 'Colaboração público-privada',
  'GOB_ORG_04.NI2': 'Empresas colaboradoras',
  'GOB_ORG_05.NI1': 'Participação em redes',
  'GOB_ORG_05.NI2': 'Eventos DTI',

  // ── GOB: FIN ──
  'GOB_FIN_01.NI1': 'Orçamento alocado',
  'GOB_FIN_01.NI2': 'Execução orçamentária',
  'GOB_FIN_02.NI1': 'Fontes de financiamento',
  'GOB_FIN_03.NI1': 'Investimento em tecnologia',
  'GOB_FIN_03.NI2': 'Gasto TIC por turista',
  'GOB_FIN_04.NI1': 'Medição do ROI',
  'GOB_FIN_05.NI1': 'Captação de fundos',

  // ── GOB: PLA ──
  'GOB_PLA_01.NI1': 'Plano estratégico DTI',
  'GOB_PLA_01.NI2': 'Alcance do plano',
  'GOB_PLA_02.NI1': 'Roteiro definido',
  'GOB_PLA_05.NI1': 'Participação cidadã',
  'GOB_PLA_05.NI2': 'Taxa de participação',

  // ── GOB: GEST ──
  'GOB_GEST_01.NI1': 'Sistema de qualidade',
  'GOB_GEST_04.NI1': 'Medição de satisfação',
  'GOB_GEST_04.NI2': 'Índice de satisfação',
  'GOB_GEST_05.NI1': 'Sistema de reclamações',
  'GOB_GEST_05.NI2': 'Taxa de resolução',

  // ── INN: ECO ──
  'INN_ECO_01.NI1': 'Ecossistema de inovação',
  'INN_ECO_02.NI1': 'Apoio ao empreendedorismo',
  'INN_ECO_02.NI2': 'Startups turísticas',
  'INN_ECO_03.NI1': 'Colaboração P&D',
  'INN_ECO_03.NI2': 'Projetos de P&D',
  'INN_ECO_05.NI1': 'Prêmios à inovação',

  // ── INN: DAT ──
  'INN_DAT_01.NI1': 'Dados abertos turísticos',
  'INN_DAT_01.NI2': 'Conjuntos de dados',
  'INN_DAT_02.NI1': 'Qualidade de dados',
  'INN_DAT_03.NI1': 'Painel de controle',
  'INN_DAT_05.NI1': 'Proteção de dados',
  'INN_DAT_05.NI2': 'Conformidade normativa',

  // ── INN: EXP ──
  'INN_EXP_01.NI1': 'Experiências personalizadas',
  'INN_EXP_02.NI1': 'Gamificação turística',
  'INN_EXP_05.NI1': 'Inovação em serviços',
  'INN_EXP_05.NI2': 'Inovações implementadas',

  // ── TEC: INF ──
  'TEC_INF_01.NI1': 'Infraestrutura TIC',
  'TEC_INF_02.NI1': 'Cibersegurança',
  'TEC_INF_02.NI2': 'Incidentes de segurança',
  'TEC_INF_03.NI1': 'Computação em nuvem',
  'TEC_INF_05.NI1': 'Manutenção TIC',

  // ── TEC: CON ──
  'TEC_CON_01.NI1': 'Cobertura wifi pública',
  'TEC_CON_01.NI2': 'Velocidade média wifi',
  'TEC_CON_02.NI1': 'Cobertura móvel',
  'TEC_CON_03.NI1': 'Rede IoT',
  'TEC_CON_03.NI2': 'Sensores implantados',
  'TEC_CON_04.NI1': 'Conectividade em alojamentos',

  // ── TEC: SEN ──
  'TEC_SEN_01.NI1': 'Monitoramento ambiental',
  'TEC_SEN_02.NI1': 'Controle de lotação',
  'TEC_SEN_04.NI1': 'Gestão inteligente de recursos',

  // ── TEC: PLAT ──
  'TEC_PLAT_01.NI1': 'Plataforma DTI',
  'TEC_PLAT_02.NI1': 'App oficial do destino',
  'TEC_PLAT_02.NI2': 'Downloads do app',
  'TEC_PLAT_03.NI1': 'Portal web turístico',
  'TEC_PLAT_05.NI1': 'APIs turísticas',
  'TEC_PLAT_05.NI2': 'Consumidores de API',

  // ── SOST: MED ──
  'SOST_MED_01.NI1': 'Sistema de gestão ambiental',
  'SOST_MED_02.NI1': 'Energia renovável',
  'SOST_MED_02.NI2': 'Consumo energético',
  'SOST_MED_03.NI1': 'Gestão de resíduos',
  'SOST_MED_04.NI1': 'Pegada de carbono',
  'SOST_MED_04.NI2': 'Emissões CO2',
  'SOST_MED_05.NI1': 'Proteção de recursos naturais',

  // ── SOST: SOC ──
  'SOST_SOC_01.NI1': 'Impacto social do turismo',
  'SOST_SOC_02.NI1': 'Turismo inclusivo',
  'SOST_SOC_03.NI1': 'Emprego turístico local',
  'SOST_SOC_03.NI2': 'Qualidade do emprego',
  'SOST_SOC_04.NI1': 'Preservação do patrimônio',
  'SOST_SOC_05.NI1': 'Qualidade de vida dos residentes',

  // ── SOST: ECON ──
  'SOST_ECON_01.NI1': 'Impacto econômico do turismo',
  'SOST_ECON_01.NI2': 'PIB turístico',
  'SOST_ECON_02.NI1': 'Combate à sazonalidade',
  'SOST_ECON_03.NI1': 'Gasto médio por turista',
  'SOST_ECON_04.NI1': 'Empreendedorismo turístico local',
  'SOST_ECON_05.NI1': 'Contratação local',

  // ── ACC: ACC_FIS ──
  'ACC_FIS_01.NI1': 'Acessibilidade urbana',
  'ACC_FIS_01.NI2': 'Itinerários acessíveis',
  'ACC_FIS_02.NI1': 'Alojamentos acessíveis',
  'ACC_FIS_03.NI1': 'Atrativos acessíveis',
  'ACC_FIS_04.NI1': 'Transporte acessível',
  'ACC_FIS_04.NI2': 'Paradas acessíveis',
  'ACC_FIS_05.NI1': 'Sinalização turística acessível',
  'ACC_FIS_05.NI2': 'Sinalização digital',

  // ── ACC: ACC_DIG ──
  'ACC_DIG_01.NI1': 'Acessibilidade web',
  'ACC_DIG_01.NI2': 'Conformidade WCAG',
  'ACC_DIG_02.NI1': 'Informação multilíngue',
  'ACC_DIG_02.NI2': 'Idiomas disponíveis',
  'ACC_DIG_03.NI1': 'Leitura fácil',
  'ACC_DIG_04.NI1': 'Canais de atendimento acessíveis',
  'ACC_DIG_04.NI2': 'Satisfação com os canais de atendimento',
};

/**
 * Returns the translated indicator name for the given locale.
 * Falls back to `fallback` (typically ind.name from the API) when
 * no translation exists or locale is not 'pt'.
 */
export function getIndicatorName(
  code: string | undefined | null,
  locale: string,
  fallback: string,
): string {
  if (locale !== 'pt' || !code) return fallback;
  return INDICATOR_NAME_PT[code] ?? fallback;
}
