export type Locale = "en" | "fr";

export interface Translations {
  appSubtitle: string;
  logs: {
    title: string;
    empty: string;
    clear: string;
    autoRefresh: string;
  };
  nav: {
    chat: string;
    traces: string;
    status: string;
    settings: string;
    models: string;
    logs: string;
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
    noToken: string;
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
      githubTokenHint: string;
      githubTokenSaved: string;
      githubConnect: string;
      githubConnected: string;
      githubDisconnect: string;
      githubDevicePrompt: string;
      githubWaiting: string;
      githubCancel: string;
      githubCopilotChecking: string;
      githubCopilotOk: string;
      githubCopilotFail: string;
      githubProfileError: string;
      githubAuthFailed: string;
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
      installed: string;
      available: string;
      noModels: string;
      delete: string;
      deleting: string;
      customLabel: string;
      size: (gb: string) => string;
      pullStatus: (status: string) => string;
    };
  };
  models: {
    title: string;
    installed: string;
    noModels: string;
    loading: string;
    loadingRegistry: string;
    delete: string;
    deleting: string;
    add: string;
    searchPlaceholder: string;
    download: string;
    downloading: string;
    downloaded: string;
    customHint: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    appSubtitle: "Local AI Orchestrator",
    logs: {
      title: "Logs",
      empty: "No log entries yet.",
      clear: "Clear logs",
      autoRefresh: "Auto-refresh",
    },
    nav: {
      chat: "Chat",
      traces: "Traces",
      status: "Status",
      settings: "Settings",
      models: "Models",
      logs: "Logs",
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
      noToken: "Add a GitHub token in Settings to use cloud models",
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
        githubTokenDescription: "Connect your GitHub account to use GitHub Copilot for cloud inference.",
        githubTokenHint: "Generate at github.com/settings/personal-access-tokens/new → Permissions → Copilot Requests",
        githubTokenSaved: "Token saved",
        githubConnect: "Connect with GitHub",
        githubConnected: "Connected to GitHub Copilot",
        githubDisconnect: "Disconnect",
        githubDevicePrompt: "Open the link below and enter the code to authorize Buddy:",
        githubWaiting: "Waiting for authorization…",
        githubCancel: "Cancel",
        githubCopilotChecking: "Checking Copilot access…",
        githubCopilotOk: "Copilot access confirmed",
        githubCopilotFail: "No Copilot access — check your subscription",
        githubProfileError: "Could not load profile",
        githubAuthFailed: "Authorization failed or expired. Please try again.",
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
        label: "Ollama Models",
        description: "Manage models installed locally via Ollama.",
        download: "Download",
        downloading: "Downloading…",
        downloaded: "Downloaded",
        placeholder: "e.g. llama3.2, mistral, phi4",
        installed: "Installed",
        available: "Add a model",
        noModels: "No models installed yet.",
        delete: "Delete",
        deleting: "Deleting…",
        customLabel: "Custom model name",
        size: (gb) => `${gb} GB`,
        pullStatus: (status) => status,
      },
    },
    models: {
      title: "Models",
      installed: "Installed",
      noModels: "No models installed yet.",
      loading: "Loading…",
      loadingRegistry: "Loading from ollama.com…",
      delete: "Delete",
      deleting: "Deleting…",
      add: "Add a model",
      searchPlaceholder: "Search ollama.com or type a custom name…",
      download: "Download",
      downloading: "Downloading…",
      downloaded: "Downloaded",
      customHint: "custom model",
    },
  },
  fr: {
    appSubtitle: "Orchestrateur IA local",
    logs: {
      title: "Journaux",
      empty: "Aucune entrée pour l'instant.",
      clear: "Vider les journaux",
      autoRefresh: "Actualisation auto",
    },
    nav: {
      chat: "Chat",
      traces: "Traces",
      status: "Statut",
      settings: "Paramètres",
      models: "Modèles",
      logs: "Journaux",
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
      noToken: "Ajoutez un token GitHub dans les Paramètres pour utiliser les modèles cloud",
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
        githubTokenDescription: "Connectez votre compte GitHub pour utiliser GitHub Copilot.",
        githubConnect: "Se connecter avec GitHub",
        githubConnected: "Connecté à GitHub Copilot",
        githubDisconnect: "Déconnecter",
        githubDevicePrompt: "Ouvrez le lien ci-dessous et saisissez le code pour autoriser Buddy :",
        githubWaiting: "En attente d'autorisation…",
        githubCancel: "Annuler",
        githubCopilotChecking: "Vérification de l'accès Copilot…",
        githubCopilotOk: "Accès Copilot confirmé",
        githubCopilotFail: "Pas d'accès Copilot — vérifiez votre abonnement",
        githubProfileError: "Impossible de charger le profil",
        githubAuthFailed: "Autorisation échouée ou expirée. Veuillez réessayer.",
        githubTokenHint: "Générer sur github.com/settings/personal-access-tokens/new → Permissions → Copilot Requests",
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
        label: "Modèles Ollama",
        description: "Gérez les modèles installés localement via Ollama.",
        download: "Télécharger",
        downloading: "Téléchargement…",
        downloaded: "Téléchargé",
        placeholder: "ex. llama3.2, mistral, phi4",
        installed: "Installés",
        available: "Ajouter un modèle",
        noModels: "Aucun modèle installé.",
        delete: "Supprimer",
        deleting: "Suppression…",
        customLabel: "Nom de modèle personnalisé",
        size: (gb) => `${gb} Go`,
        pullStatus: (status) => status,
      },
    },
    models: {
      title: "Modèles",
      installed: "Installés",
      noModels: "Aucun modèle installé.",
      loading: "Chargement…",
      loadingRegistry: "Chargement depuis ollama.com…",
      delete: "Supprimer",
      deleting: "Suppression…",
      add: "Ajouter un modèle",
      searchPlaceholder: "Rechercher sur ollama.com ou saisir un nom personnalisé…",
      download: "Télécharger",
      downloading: "Téléchargement…",
      downloaded: "Téléchargé",
      customHint: "modèle personnalisé",
    },
  },
};
