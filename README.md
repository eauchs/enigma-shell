# Enigma Shell

Bienvenue dans Enigma Shell, une interface de calculatrice qui dissimule un puissant shell simulé, offrant un accès à un environnement Alpine Linux virtualisé. Ce projet sert de preuve de concept pour une expérience utilisateur unique, combinant une façade simple avec des fonctionnalités avancées accessibles via des séquences spécifiques et des challenges IA.

## Aperçu

Enigma Shell démarre comme une application de calculatrice standard. Pour déverrouiller les fonctionnalités avancées, l'utilisateur doit entrer une séquence de déverrouillage basée sur les constantes mathématiques π (Pi) ou e (nombre d'Euler) combinées avec le jour actuel. Une fois déverrouillée, l'application présente un challenge mathématique généré par une IA locale. La réussite de ce challenge donne accès à un shell interactif connecté à une instance virtualisée d'Alpine Linux (surnommée "enigma-os").

L'interface du shell permet à l'utilisateur d'interagir avec une IA locale pour formuler des commandes à exécuter dans "enigma-os", ou pour obtenir des réponses en langage naturel.

## Fonctionnalités

* **Calculatrice :** Interface de calculatrice fonctionnelle avec opérations de base et historique des 5 derniers calculs.
* **Séquence de Déverrouillage :** Mécanisme de déverrouillage basé sur Pi ou E et la date actuelle (JJ) pour accéder aux fonctionnalités avancées. Séquence : `3.1415926535JJ` ou `2.7182818284JJ`.
* **Challenge IA :** Un problème mathématique est généré par un LLM local après le déverrouillage.
* **Enigma OS Terminal :** Un terminal virtualisé exécutant Alpine Linux via `v86`.
* **Shell IA :** Une interface de type shell où l'utilisateur peut dialoguer avec un LLM local qui peut, à son tour, exécuter des commandes dans "enigma-os".

## Prérequis

* Node.js (pour le développement et l'exécution locale)
* npm (ou yarn/pnpm)
* Un LLM local compatible avec l'API OpenAI et accessible via le endpoint spécifié dans `src/components/Shell.tsx` (par défaut : `http://localhost:1234/v1/chat/completions`).

## Installation et Lancement Local

1.  **Clonez le dépôt :**
    ```bash
    git clone [https://github.com/eauchs/enigma-shell.git](https://github.com/eauchs/enigma-shell.git) 
    # Remplacez par l'URL correcte de VOTRE dépôt si elle est différente
    cd enigma-shell
    ```

2.  **Installez les dépendances :**
    ```bash
    npm install
    ```
   

3.  **Obtenez les fichiers de l'émulateur v86 :**
    Ce projet utilise `v86` pour l'émulation. Les fichiers suivants sont nécessaires et doivent être placés dans le dossier `public/` :
    * `public/v86/libv86.js`
    * `public/v86/v86.wasm`
    * `public/v86/seabios.bin`
    * `public/v86/vgabios.bin`
    * `public/images/alpine-minimal.iso` (ou l'ISO de votre choix, ajustez la configuration dans `src/components/EnigmaOSTerminal.tsx` en conséquence).

    *Vous pouvez généralement trouver les fichiers `v86.wasm`, `seabios.bin`, et `vgabios.bin` dans les dépôts ou les builds du projet v86. `libv86.js` est également fourni par le projet v86.*
    *Pour l'image ISO d'Alpine Linux, téléchargez-la depuis le site officiel d'Alpine Linux (utilisez une version minimale ou standard pour x86).*

4.  **Configurez votre clé API Gemini (si nécessaire pour une fonctionnalité future) :**
    Le fichier `README.md` original mentionne une clé API Gemini. Si vous prévoyez d'utiliser des services Gemini directement, assurez-vous de configurer `GEMINI_API_KEY` dans un fichier `.env.local` à la racine du projet :
    ```
    GEMINI_API_KEY=VOTRE_CLE_API_GEMINI
    ```
    Le `vite.config.ts` est configuré pour charger cette variable.
    *Note : L'interaction actuelle du shell utilise un endpoint LLM local (`http://localhost:1234/v1/`) et ne semble pas utiliser directement la clé Gemini pour cette partie.*

5.  **Lancez l'application en mode développement :**
    ```bash
    npm run dev
    ```
   
    L'application devrait être accessible sur `http://localhost:5173` (ou un port similaire).

## Structure du Projet (Partielle)

/public
/v86/                   # Fichiers de l'émulateur v86
libv86.js
v86.wasm
seabios.bin
vgabios.bin
/images/                # Images ISO pour l'émulateur
alpine-minimal.iso
/src
/components/            # Composants React UI
Calculator.tsx        # Interface de la calculatrice
EnigmaOSTerminal.tsx  # Terminal pour l'OS virtualisé
Shell.tsx             # Interface du shell IA
App.tsx                 # Composant principal de l'application
index.tsx               # Point d'entrée React
types.ts                # Définitions TypeScript
vite.config.ts            # Configuration de Vite
tsconfig.json             # Configuration TypeScript
package.json              # Dépendances et scripts Npm
README.md                 # Ce fichier



## Personnalisation du LLM

L'interaction avec le LLM pour le challenge IA et le shell IA est configurée dans :
* `src/App.tsx` (pour la génération du challenge IA)
* `src/components/Shell.tsx` (pour les commandes du shell)

Par défaut, ils utilisent :
* Endpoint: `http://localhost:1234/v1/chat/completions`
* Modèle (pour le shell): `qwen/qwen3-4b` (configurable dans `Shell.tsx`)
* Modèle (pour le challenge): `qwen/qwen3-4b` (configurable dans `App.tsx`)

Adaptez ces constantes si vous utilisez un autre modèle ou endpoint pour votre LLM local.

## Notes de Développement

* L'état de l'application (`AppPhase`) gère la transition entre la calculatrice, le challenge et le shell actif.
* La communication avec `enigma-os` se fait via des envois série simulés par `v86`.
* Le style utilise Tailwind CSS et des polices spécifiques (`Orbitron`, `Roboto Mono`) pour une ambiance "néon" et futuriste.

## TODO / Améliorations Possibles

* Améliorer la robustesse de la détection de l'état "prêt" d'EnigmaOS.
* Ajouter une gestion plus fine des erreurs de communication avec le LLM.
* Permettre la configuration du LLM (endpoint, modèle) via une interface ou des variables d'environnement.
* Ajouter des tests.
* Optimiser la gestion des fichiers volumineux (ex: téléchargement à la demande au lieu de les inclure dans `public/`).

---

N'hésitez pas à contribuer ou à signaler des problèmes !
