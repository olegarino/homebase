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
    clearChat: string;
  };
  traces: {
    title: string;
    recorded: (n: number) => string;
    clearAll: string;
    empty: string;
    agent: string;
    input: string;
    output: string;
    compressed: string;
    tokensSaved: (n: number) => string;
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
    compression: {
      label: string;
      description: string;
    };
    sections: {
      cloudApi: string;
      integrations: string;
    };
    fields: {
      githubToken: string;
      githubTokenDescription: string;
      githubTokenSaved: string;
      jiraBaseUrl: string;
      jiraApiToken: string;
    };
    provider: {
      label: string;
      description: string;
      ollama: string;
      copilot: string;
      ollamaUnavailable: string;
      copilotModel: string;
    };
    modelManager: {
      label: string;
      description: string;
      download: string;
      downloading: string;
      downloaded: string;
      placeholder: string;
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
      clearChat: "Clear chat",
    },
    traces: {
      title: "Traces",
      recorded: (n) => `${n} recorded`,
      clearAll: "Clear all",
      empty: "No traces yet. Start a conversation to see activity.",
      agent: "Agent",
      input: "Input",
      output: "Output",
      compressed: "Caveman compressed",
      tokensSaved: (n: number) => `${n} tokens saved`,
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
      compression: {
        label: "Caveman Compression",
        description: "Strip grammar, keep facts. Reduces tokens by 15–30% before sending to models.",
      },
      sections: {
        cloudApi: "Cloud API",
        integrations: "Integrations",
      },
      fields: {
        githubToken: "GitHub Token",
        githubTokenDescription: "Used to access GitHub Copilot models. Find yours at github.com/settings/tokens.",
        githubTokenSaved: "Token saved",
        jiraBaseUrl: "Jira Base URL",
        jiraApiToken: "Jira API Token",
      },
      provider: {
        label: "AI Provider",
        description: "Choose where chat requests are processed.",
        ollama: "Local (Ollama)",
        copilot: "Cloud (GitHub Copilot)",
        ollamaUnavailable: "Ollama is not installed or not running",
        copilotModel: "Copilot model",
      },
      modelManager: {
        label: "Download Ollama Model",
        description: "Pull a model directly from the Ollama library to use locally.",
        download: "Download",
        downloading: "Downloading…",
        downloaded: "Downloaded",
        placeholder: "e.g. llama3.2, mistral, phi4",
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
      clearChat: "Effacer le chat",
    },
    traces: {
      title: "Traces",
      recorded: (n) => `${n} enregistrée${n > 1 ? "s" : ""}`,
      clearAll: "Tout effacer",
      empty: "Aucune trace. Commencez une conversation pour voir l'activité.",
      agent: "Agent",
      input: "Entrée",
      output: "Sortie",
      compressed: "Compression Caveman",
      tokensSaved: (n: number) => `${n} tokens économisés`,
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
      compression: {
        label: "Compression Caveman",
        description: "Supprime la grammaire, conserve les faits. Réduit les tokens de 15–30% avant envoi aux modèles.",
      },
      sections: {
        cloudApi: "API Cloud",
        integrations: "Intégrations",
      },
      fields: {
        githubToken: "Token GitHub",
        githubTokenDescription: "Utilisé pour accéder aux modèles GitHub Copilot. Trouvez le vôtre sur github.com/settings/tokens.",
        githubTokenSaved: "Token enregistré",
        jiraBaseUrl: "URL de base Jira",
        jiraApiToken: "Token API Jira",
      },
      provider: {
        label: "Fournisseur IA",
        description: "Choisissez où les requêtes sont traitées.",
        ollama: "Local (Ollama)",
        copilot: "Cloud (GitHub Copilot)",
        ollamaUnavailable: "Ollama n'est pas installé ou ne fonctionne pas",
        copilotModel: "Modèle Copilot",
      },
      modelManager: {
        label: "Télécharger un modèle Ollama",
        description: "Téléchargez un modèle depuis la bibliothèque Ollama pour l'utiliser localement.",
        download: "Télécharger",
        downloading: "Téléchargement…",
        downloaded: "Téléchargé",
        placeholder: "ex. llama3.2, mistral, phi4",
      },
    },
  },
};
