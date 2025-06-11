Sujet : Tutoriel d'installation du projet Enigma-Shell

Salut,

Voici la procédure complète pour installer et lancer le projet "Enigma-Shell" sur ton ordinateur Windows. Suis bien les étapes dans l'ordre.

Phase 1 : Installation des Outils (à ne faire qu'une fois)
Si c'est la première fois que tu fais ça, tu dois installer deux outils indispensables.

1. Git
C'est le logiciel qui permet de télécharger le code source du projet.

Va sur https://git-scm.com/download/win.
Télécharge et exécute l'installeur.
Laisse toutes les options par défaut en cliquant sur "Next" à chaque étape.
2. Node.js (avec npm)
C'est ce qui permet de faire fonctionner le projet et d'installer ses composants.

Va sur https://nodejs.org/.
Télécharge la version LTS (c'est la plus stable).
Exécute l'installeur et laisse toutes les options par défaut.
Phase 2 : Installation du Projet "Enigma-Shell"
Maintenant que les outils sont prêts, voici comment installer le projet.

1. Ouvre un terminal

Clique sur le menu Démarrer de Windows.
Tape PowerShell et ouvre l'application "Windows PowerShell". C'est une fenêtre avec un fond bleu ou noir où tu taperas des commandes.
2. Télécharge (clone) le projet

Dans le terminal, tape la commande suivante et appuie sur Entrée. Cela va créer un dossier enigma-shell avec tout le code dedans.
Bash

git clone https://github.com/eauchs/enigma-shell.git
3. Va dans le dossier du projet

Maintenant, tu dois "entrer" dans le dossier qui vient d'être créé. Tape la commande :
Bash

cd enigma-shell
4. Installe les dépendances du projet

Le projet a besoin de plusieurs "briques" logicielles pour fonctionner. Cette commande les télécharge et les installe automatiquement. Ça peut prendre quelques minutes.
Bash

npm install
5. Lance le projet

Une fois l'installation terminée, tape la dernière commande pour démarrer le projet :
Bash

npm run dev
6. Vois le résultat

Le terminal va afficher du texte et devrait te donner une adresse locale, qui est normalement : http://localhost:5173/.
Ouvre ton navigateur web (Chrome, Firefox...) et copie-colle cette adresse. Le projet enigma-shell devrait s'afficher.
En résumé, les 4 commandes à taper sont :
Bash

git clone https://github.com/eauchs/enigma-shell.git
cd enigma-shell
npm install
npm run dev
