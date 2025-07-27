
# Enigma Shell 🔮

Contrôlez un système d'exploitation Linux complet avec le langage naturel, directement dans votre navigateur.

## 🚀 À propos du projet

**Enigma Shell** est une interface web expérimentale qui vous permet de dialoguer avec un système d'exploitation. Au lieu de taper des commandes shell complexes, vous décrivez simplement ce que vous voulez faire en français.

Ce projet fusionne deux technologies de pointe :

  * **v86 :** Un émulateur x86 écrit en JavaScript qui fait tourner une image complète d'**Alpine Linux** avec son propre noyau et système de fichiers, directement dans votre navigateur.
  * **Ollama :** Un client qui se connecte à votre instance locale d'Ollama pour utiliser des LLMs (comme Llama 3, Mistral, etc.) afin de traduire vos instructions en langage naturel en commandes `bash` exécutables.

Le résultat est une expérience fluide et intuitive où le LLM devient votre ingénieur système personnel, pilotant une VM sous vos yeux.

## ✨ Fonctionnalités

  * **Environnement Linux Complet :** Une véritable VM Alpine Linux virtualisée, pas une simulation.
  * **Contrôle en Langage Naturel :** Donnez des ordres comme "crée un dossier appelé 'projets' et entre dedans" ou "dis-moi la version du noyau".
  * **100% Côté Client :** Toute la logique de l'application tourne dans votre navigateur, assurant réactivité et confidentialité.
  * **LLM Local :** Utilise votre propre instance Ollama, gardant vos données et vos prompts privés.
  * **Interface Réactive :** Développé avec React, TypeScript et Vite pour une expérience utilisateur moderne et performante.

## 🛠️ Stack Technique

  * **Frontend :** React, TypeScript, Vite
  * **Émulation de VM :** [v86](https://github.com/copy/v86)
  * **Interaction LLM :** [ollama-js](https://github.com/ollama/ollama-js) (client officiel)

## ⚙️ Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés et en cours d'exécution sur votre machine :

1.  **Node.js** (v18 ou supérieur)
2.  **Ollama :** [Téléchargez et installez Ollama](https://ollama.com/).
3.  **Un modèle LLM :** Tirez un modèle adapté aux instructions comme qwen3-4b

## ▶️ Installation & Lancement

1.  **Clonez le dépôt :**
    ```bash
    git clone https://github.com/eauchs/enigma-shell.git
    cd enigma-shell
    ```
2.  **Installez les dépendances :**
    ```bash
    npm install
    ```
3.  **Lancez l'application :**
    ```bash
    npm run dev
    ```
4.  Ouvrez votre navigateur à l'adresse indiquée (généralement `http://localhost:5173`).

Assurez-vous que l'application Ollama est bien lancée en arrière-plan avant de démarrer le serveur de développement.

## ✍️ Utilisation

Une fois l'application chargée, la VM Alpine Linux va démarrer. Attendez que le processus de boot soit terminé et que le prompt de login apparaisse.

1.  Utilisez le champ de saisie principal pour écrire votre objectif en langage naturel.
2.  Appuyez sur "Entrée".
3.  Observez le LLM taper et exécuter la commande correspondante dans le terminal de la VM.

## 🛣️ Roadmap (Idées d'évolutions)

Enigma Shell est une base solide. Voici quelques pistes pour le faire passer au niveau supérieur :

  * **Planification Multi-Étapes :** Intégrer un framework comme **CrewAI** (via un backend Python communiquant en WebSocket) pour permettre à une équipe d'agents de poursuivre des objectifs complexes sur plusieurs commandes (ex: "installe un serveur Nginx et déploie ce site web").
  * **Persistance de l'État :** Permettre de sauvegarder l'état du disque de la VM dans le `localStorage` ou `IndexedDB` pour reprendre une session là où vous l'avez laissée.
  * **Téléversement de Fichiers :** Ajouter la possibilité d'uploader des fichiers depuis la machine hôte vers le système de fichiers de la VM.
  * **Choix du Modèle :** Permettre à l'utilisateur de choisir le modèle Ollama à utiliser directement depuis l'interface.

## 📄 Licence

Ce projet est distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus d'informations.
