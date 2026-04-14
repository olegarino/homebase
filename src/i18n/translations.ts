export type Locale = "en" | "fr";

export interface Translations {
  appSubtitle: string;
  nav: {
    chat: string;
    traces: string;
    status: string;
    settings: string;
  };
  chat: {
    model: string;
    placeholder: string;
    startConversation: string;
    thinking: string;
    ollamaRunning: string;
    ollamaOffline: string;
    ollamaChecking: string;
    ollamaTooltip: string;
  };
  traces: {
    title: string;
    recorded: (n: number) => string;
    clearAll: string;
    empty: string;
    agent: string;
    input: string;
    output: string;
    taskTypes: Record<string, string>;
  };
  status: {
    title: string;
    subtitle: string;
    startOllama: string;
    stopOllama: string;
    installHint: string;
    installHintSuffix: string;
    infoLabels: {
      host: string;
      port: string;
      protocol: string;
      client: string;
    };
    states: Record<string, { label: string; description: string }>;
  };
  settings: {
    title: string;
    language: string;
    sections: {
      cloudApi: string;
      integrations: string;
    };
    fields: {
      githubToken: string;
      jiraBaseUrl: string;
      jiraApiToken: string;
    };
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    appSubtitle: "Local AI Orchestrator",
    nav: {
      chat: "Chat",
      traces: "Traces",
      status: "Status",
      settings: "Settings",
    },
    chat: {
      model: "Model",
      placeholder: "Type your message…",
      startConversation: "Start a conversation…",
      thinking: "Thinking…",
      ollamaRunning: "Ollama running",
      ollamaOffline: "Ollama offline",
      ollamaChecking: "Checking…",
      ollamaTooltip: "Ollama status — click to manage",
    },
    traces: {
      title: "Traces",
      recorded: (n) => `${n} recorded`,
      clearAll: "Clear all",
      empty: "No traces yet. Start a conversation to see activity.",
      agent: "Agent",
      input: "Input",
      output: "Output",
      taskTypes: {
        simple_chat: "Simple chat",
        coding: "Coding",
        data: "Data",
        tool_call: "Tool call",
        reasoning: "Reasoning",
      },
    },
    status: {
      title: "Status",
      subtitle: "Ollama service monitor",
      startOllama: "Start Ollama",
      stopOllama: "Stop Ollama",
      installHint: "Make sure Ollama is installed. Run",
      installHintSuffix: "if it's not.",
      infoLabels: {
        host: "Host",
        port: "Port",
        protocol: "Protocol",
        client: "Client",
      },
      states: {
        checking: {
          label: "Checking…",
          description: "Connecting to Ollama at localhost:11434",
        },
        running: {
          label: "Running",
          description: "Ollama is active and ready at localhost:11434",
        },
        stopped: {
          label: "Stopped",
          description: "Ollama is not running. Start it to use the chat.",
        },
      },
    },
    settings: {
      title: "Settings",
      language: "Language",
      sections: {
        cloudApi: "Cloud API",
        integrations: "Integrations",
      },
      fields: {
        githubToken: "GitHub Token",
        jiraBaseUrl: "Jira Base URL",
        jiraApiToken: "Jira API Token",
      },
    },
  },
  fr: {
    appSubtitle: "Orchestrateur IA local",
    nav: {
      chat: "Chat",
      traces: "Traces",
      status: "Statut",
      settings: "Paramètres",
    },
    chat: {
      model: "Modèle",
      placeholder: "Votre message…",
      startConversation: "Commencez une conversation…",
      thinking: "Réflexion…",
      ollamaRunning: "Ollama actif",
      ollamaOffline: "Ollama hors ligne",
      ollamaChecking: "Vérification…",
      ollamaTooltip: "Statut Ollama — cliquer pour gérer",
    },
    traces: {
      title: "Traces",
      recorded: (n) => `${n} enregistrée${n > 1 ? "s" : ""}`,
      clearAll: "Tout effacer",
      empty: "Aucune trace. Commencez une conversation pour voir l'activité.",
      agent: "Agent",
      input: "Entrée",
      output: "Sortie",
      taskTypes: {
        simple_chat: "Conversation simple",
        coding: "Code",
        data: "Données",
        tool_call: "Appel d'outil",
        reasoning: "Raisonnement",
      },
    },
    status: {
      title: "Statut",
      subtitle: "Moniteur du service Ollama",
      startOllama: "Démarrer Ollama",
      stopOllama: "Arrêter Ollama",
      installHint: "Assurez-vous qu'Ollama est installé. Exécutez",
      installHintSuffix: "si ce n'est pas le cas.",
      infoLabels: {
        host: "Hôte",
        port: "Port",
        protocol: "Protocole",
        client: "Client",
      },
      states: {
        checking: {
          label: "Vérification…",
          description: "Connexion à Ollama sur localhost:11434",
        },
        running: {
          label: "Actif",
          description: "Ollama est actif et prêt sur localhost:11434",
        },
        stopped: {
          label: "Arrêté",
          description: "Ollama n'est pas actif. Démarrez-le pour utiliser le chat.",
        },
      },
    },
    settings: {
      title: "Paramètres",
      language: "Langue",
      sections: {
        cloudApi: "API Cloud",
        integrations: "Intégrations",
      },
      fields: {
        githubToken: "Token GitHub",
        jiraBaseUrl: "URL de base Jira",
        jiraApiToken: "Token API Jira",
      },
    },
  },
};
