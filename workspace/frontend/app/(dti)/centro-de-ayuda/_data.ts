/* ------------------------------------------------------------------ */
/*  Tipos y datos de respaldo                                         */
/*  SWR refresca desde la API cuando está disponible                  */
/* ------------------------------------------------------------------ */

export interface HelpStep {
  id: string;
  title_es: string;
  title_pt: string;
  description_es: string;
  description_pt: string;
  image?: string;
  tip_es?: string;
  tip_pt?: string;
  order: number;
}

export interface HelpTopic {
  id: string;
  icon: string;
  title_es: string;
  title_pt: string;
  description_es: string;
  description_pt: string;
  order: number;
  steps: HelpStep[];
}

export interface HelpCenterData {
  topics: HelpTopic[];
}

/** Elige el valor correcto según el locale activo. */
export function localeValue<T>(es: T, pt: T, locale: string): T {
  return locale === 'pt' ? pt : es;
}

export const FALLBACK_DATA: HelpCenterData = {
  topics: [
    {
      id: 'primeros-pasos',
      icon: 'Home',
      title_es: 'Primeros pasos',
      title_pt: 'Primeiros passos',
      description_es:
        'Conocé la estructura del sistema DTI y cómo moverte entre destino, ámbitos e indicadores.',
      description_pt:
        'Conheça a estrutura do sistema DTI e como navegar entre destino, âmbitos e indicadores.',
      order: 0,
      steps: [
        {
          id: 'pp-01',
          title_es: 'El panel de inicio',
          title_pt: 'O painel inicial',
          description_es:
            'Al ingresar ves un resumen de tu destino: progreso general, indicadores pendientes y accesos directos a las tareas más frecuentes.',
          description_pt:
            'Ao entrar você vê um resumo do seu destino: progresso geral, indicadores pendentes e atalhos para as tarefas mais frequentes.',
          tip_es: 'Podés cambiar de destino desde el selector superior en cualquier momento.',
          tip_pt: 'Você pode mudar de destino pelo seletor superior a qualquer momento.',
          order: 0,
        },
        {
          id: 'pp-02',
          title_es: 'Navegación por secciones',
          title_pt: 'Navegação por seções',
          description_es:
            'El menú lateral organiza el sistema en tres grandes áreas: Evaluar, Planificar y Analizar. Cada sección agrupa las funciones que necesitás para gestionar el ciclo DTI.',
          description_pt:
            'O menu lateral organiza o sistema em três grandes áreas: Avaliar, Planejar e Analisar. Cada seção agrupa as funções necessárias para gerenciar o ciclo DTI.',
          order: 1,
        },
        {
          id: 'pp-03',
          title_es: 'Selector de destino',
          title_pt: 'Seletor de destino',
          description_es:
            'Usá el selector en la parte superior para cambiar entre los destinos a los que tenés acceso. Toda la información de la pantalla se actualiza automáticamente.',
          description_pt:
            'Use o seletor na parte superior para alternar entre os destinos aos quais você tem acesso. Todas as informações da tela são atualizadas automaticamente.',
          order: 2,
        },
      ],
    },
    {
      id: 'cargar-indicadores',
      icon: 'Activity',
      title_es: 'Cargar indicadores',
      title_pt: 'Carregar indicadores',
      description_es:
        'Aprendé a completar los indicadores de una evaluación paso a paso.',
      description_pt:
        'Aprenda a preencher os indicadores de uma avaliação passo a passo.',
      order: 1,
      steps: [
        {
          id: 'ci-01',
          title_es: 'Ingresar a una evaluación',
          title_pt: 'Entrar em uma avaliação',
          description_es:
            'Desde el panel de inicio o la sección Evaluaciones, seleccioná una evaluación activa para comenzar la carga.',
          description_pt:
            'Pelo painel inicial ou pela seção Avaliações, selecione uma avaliação ativa para começar o preenchimento.',
          order: 0,
        },
        {
          id: 'ci-02',
          title_es: 'Seleccionar ámbito e indicador',
          title_pt: 'Selecionar âmbito e indicador',
          description_es:
            'Dentro de la evaluación, navegá por los ámbitos (GOB, INN, TEC, SOST, ACC) y elegí el indicador que querés completar.',
          description_pt:
            'Dentro da avaliação, navegue pelos âmbitos (GOB, INN, TEC, SOST, ACC) e escolha o indicador que deseja preencher.',
          order: 1,
        },
        {
          id: 'ci-03',
          title_es: 'Completar valores',
          title_pt: 'Preencher valores',
          description_es:
            'Según el tipo de indicador (gradiente, booleano o numérico), cargá el valor actual, la meta y las observaciones correspondientes.',
          description_pt:
            'Conforme o tipo de indicador (gradiente, booleano ou numérico), carregue o valor atual, a meta e as observações correspondentes.',
          order: 2,
        },
        {
          id: 'ci-04',
          title_es: 'Guardar y continuar',
          title_pt: 'Salvar e continuar',
          description_es:
            'Una vez completados los campos, guardá el valor. El sistema actualiza automáticamente el progreso del ámbito.',
          description_pt:
            'Após preencher os campos, salve o valor. O sistema atualiza automaticamente o progresso do âmbito.',
          tip_es: 'Podés adjuntar evidencias (documentos, imágenes, URLs) para respaldar el valor cargado.',
          tip_pt: 'Você pode anexar evidências (documentos, imagens, URLs) para apoiar o valor informado.',
          order: 3,
        },
      ],
    },
    {
      id: 'evaluaciones',
      icon: 'ClipboardList',
      title_es: 'Evaluaciones',
      title_pt: 'Avaliações',
      description_es:
        'Creá, gestioná y cerrá evaluaciones del ciclo DTI.',
      description_pt:
        'Crie, gerencie e encerre avaliações do ciclo DTI.',
      order: 2,
      steps: [
        {
          id: 'ev-01',
          title_es: 'Crear una evaluación',
          title_pt: 'Criar uma avaliação',
          description_es:
            "Desde el botón 'Nueva evaluación' elegí el destino, el tipo (autodiagnóstico, diagnóstico, auditoría) y las fechas del ciclo.",
          description_pt:
            "Pelo botão 'Nova avaliação' escolha o destino, o tipo (autodiagnóstico, diagnóstico, auditoria) e as datas do ciclo.",
          order: 0,
        },
        {
          id: 'ev-02',
          title_es: 'Gestionar estados',
          title_pt: 'Gerenciar estados',
          description_es:
            'Las evaluaciones avanzan por estados: borrador → en curso → carga finalizada → en evaluación → cerrada. Solo usuarios con permisos pueden cambiar de estado.',
          description_pt:
            'As avaliações avançam por estados: rascunho → em andamento → carga finalizada → em avaliação → encerrada. Apenas usuários com permissão podem mudar de estado.',
          order: 1,
        },
        {
          id: 'ev-03',
          title_es: 'Revisar y cerrar',
          title_pt: 'Revisar e encerrar',
          description_es:
            'Una vez que el evaluador completa su revisión, la evaluación puede cerrarse. A partir de ahí se puede promover a un ciclo superior.',
          description_pt:
            'Após o avaliador completar sua revisão, a avaliação pode ser encerrada. A partir daí pode ser promovida para um ciclo superior.',
          order: 2,
        },
      ],
    },
    {
      id: 'plan-transformacion',
      icon: 'Target',
      title_es: 'Plan de transformación',
      title_pt: 'Plano de transformação',
      description_es:
        'Definí objetivos y vinculá acciones de mejora a los indicadores.',
      description_pt:
        'Defina objetivos e vincule ações de melhoria aos indicadores.',
      order: 3,
      steps: [
        {
          id: 'pt-01',
          title_es: 'Definir objetivos',
          title_pt: 'Definir objetivos',
          description_es:
            'A partir de los resultados de las evaluaciones, identificá los indicadores con brechas y establecé metas de mejora con plazos definidos.',
          description_pt:
            'A partir dos resultados das avaliações, identifique os indicadores com lacunas e estabeleça metas de melhoria com prazos definidos.',
          order: 0,
        },
        {
          id: 'pt-02',
          title_es: 'Vincular acciones',
          title_pt: 'Vincular ações',
          description_es:
            'Creá acciones de mejora y vinculalas a los indicadores correspondientes. Asigná responsables, plazos y presupuesto.',
          description_pt:
            'Crie ações de melhoria e vincule-as aos indicadores correspondentes. Atribua responsáveis, prazos e orçamento.',
          order: 1,
        },
      ],
    },
    {
      id: 'resultados-informes',
      icon: 'TrendingUp',
      title_es: 'Resultados e informes',
      title_pt: 'Resultados e relatórios',
      description_es:
        'Visualizá métricas y exportá informes de los resultados DTI.',
      description_pt:
        'Visualize métricas e exporte relatórios dos resultados DTI.',
      order: 4,
      steps: [
        {
          id: 'ri-01',
          title_es: 'Visualizar resultados',
          title_pt: 'Visualizar resultados',
          description_es:
            'Accedé a dashboards con métricas agregadas por destino, ámbito, eje y más. Filtrá por tipología, país y rango de población.',
          description_pt:
            'Acesse dashboards com métricas agregadas por destino, âmbito, eixo e mais. Filtre por tipologia, país e faixa populacional.',
          order: 0,
        },
        {
          id: 'ri-02',
          title_es: 'Exportar informes',
          title_pt: 'Exportar relatórios',
          description_es:
            'Generá informes en PDF con los resultados de las evaluaciones para compartir con stakeholders o presentar en reuniones.',
          description_pt:
            'Gere relatórios em PDF com os resultados das avaliações para compartilhar com stakeholders ou apresentar em reuniões.',
          order: 1,
        },
      ],
    },
    {
      id: 'preguntas-frecuentes',
      icon: 'HelpCircle',
      title_es: 'Preguntas frecuentes',
      title_pt: 'Perguntas frequentes',
      description_es:
        'Respuestas a las consultas más comunes sobre el uso del sistema.',
      description_pt:
        'Respostas às consultas mais comuns sobre o uso do sistema.',
      order: 5,
      steps: [
        {
          id: 'pf-01',
          title_es: '¿Quién puede cargar indicadores?',
          title_pt: 'Quem pode carregar indicadores?',
          description_es:
            'Los usuarios con rol "gestor_destino" o "admin_destino" pueden cargar valores de destino. Los evaluadores cargan sus valores en la etapa correspondiente.',
          description_pt:
            'Usuários com função "gestor_destino" ou "admin_destino" podem carregar valores de destino. Os avaliadores carregam seus valores na etapa correspondente.',
          order: 0,
        },
        {
          id: 'pf-02',
          title_es: '¿Puedo modificar una evaluación cerrada?',
          title_pt: 'Posso modificar uma avaliação encerrada?',
          description_es:
            'No. Una evaluación cerrada es de solo lectura. Si necesitás hacer correcciones, contactá al administrador del sistema.',
          description_pt:
            'Não. Uma avaliação encerrada é apenas para leitura. Se precisar fazer correções, contate o administrador do sistema.',
          order: 1,
        },
        {
          id: 'pf-03',
          title_es: '¿Cómo se promueve una evaluación?',
          title_pt: 'Como promover uma avaliação?',
          description_es:
            'Una evaluación cerrada puede promoverse al siguiente tipo de ciclo (autodiagnóstico → diagnóstico → auditoría). El sistema copia los datos automáticamente.',
          description_pt:
            'Uma avaliação encerrada pode ser promovida para o próximo tipo de ciclo (autodiagnóstico → diagnóstico → auditoria). O sistema copia os dados automaticamente.',
          order: 2,
        },
      ],
    },
  ],
};
