// src/App.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { AppPhase, MathProblem } from './types';
import Calculator from './components/Calculator';
import Shell from './components/Shell';
import EnigmaOSTerminal from './components/EnigmaOSTerminal';

const LOCAL_LLM_ENDPOINT_ENIGMA = "http://localhost:1234/v1/chat/completions"; 
const LOCAL_LLM_MODEL_NAME_ENIGMA = "qwen/qwen3-4b"; // Ou qwen/qwen3-4b

const App: React.FC = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>(AppPhase.CALCULATOR_NORMAL);
  const [currentMathProblem, setCurrentMathProblem] = useState<MathProblem | null>(null);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [isLoadingEnigma, setIsLoadingEnigma] = useState<boolean>(false);

  const [commandForEnigmaOS, setCommandForEnigmaOS] = useState<string | null>(null);
  const [enigmaOSOutputHistory, setEnigmaOSOutputHistory] = useState<string>(""); 
  const [isEnigmaOSReady, setIsEnigmaOSReady] = useState<boolean>(false);

  const handleEmulatorReady = useCallback(() => {
    console.log("[App.tsx] handleEmulatorReady A ÉTÉ APPELÉE ! isEnigmaOSReady sera true.");
    setIsEnigmaOSReady(true);
  }, []);

  const handleEnigmaOSOutput = useCallback((outputChunk: string) => {
    console.log("[App.tsx] handleEnigmaOSOutput Reçu:", JSON.stringify(outputChunk));
    setEnigmaOSOutputHistory(prev => prev + outputChunk); 
  }, []);

  useEffect(() => {
    if (enigmaOSOutputHistory) {
        console.log("[App.tsx] enigmaOSOutputHistory mis à jour, derniers 150 chars:", JSON.stringify(enigmaOSOutputHistory.slice(-150)));
    }
  }, [enigmaOSOutputHistory]);

  const handleSetCommandForEnigmaOS = useCallback((command: string) => {
    console.log(`[App.tsx] Appel de setCommandForEnigmaOS avec: "${command}"`);
    setCommandForEnigmaOS(command);
  }, []);

  useEffect(() => {
    if (commandForEnigmaOS !== null) {
      console.log(`[App.tsx] L'état commandForEnigmaOS est maintenant: "${commandForEnigmaOS}"`);
    }
  }, [commandForEnigmaOS]);


  const handleCommandSentToOS = useCallback(() => {
    console.log("[App.tsx] handleCommandSentToOS appelé. Réinitialisation de commandForEnigmaOS.");
    setCommandForEnigmaOS(null); 
  }, []);

  const fetchLlmEnigma = useCallback(async (): Promise<MathProblem | null> => {
    setIsLoadingEnigma(true);
    setAccessMessage("Génération du challenge IA..."); 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.warn("[App.tsx] Requête énigme LLM annulée pour cause de timeout.");
        controller.abort();
    }, 60000); 

    try {
      const requestHeaders: HeadersInit = { 'Content-Type': 'application/json' };
      const enigmaPrompt = `Vous êtes une IA qui génère une énigme très compliquée courte et intelligente dont la réponse est un nombre unique dans ce programme : I. Outils Mathématiques Fondamentaux :

Logique, Ensembles et Raisonnement : Logique élémentaire (assertions, connecteurs, quantificateurs), vocabulaire des ensembles (opérations, produit cartésien), raisonnement par récurrence.
Nombres Réels : Intervalles, valeur absolue, partie entière, puissances, racines, identités remarquables, inégalités, majorant/minorant, borne supérieure/inférieure.
Trigonométrie : Fonctions cos, sin, tan (définitions, périodicité, symétries, formules d'addition/duplication), résolution d'équations trigonométriques simples, notations et définitions arccos, arcsin, arctan.
Nombres Complexes : Forme algébrique (parties réelle/imaginaire, conjugué, module, inégalité triangulaire), formes trigonométrique et exponentielle (formules d'Euler, arguments), résolution d'équations du second degré à coefficients réels, résolution de x 
2
 =a avec a∈C.
Méthodes de Calcul : Notations ∑ et ∏ (linéarité, changements d'indices, sommes télescopiques, sommes doubles), factorielle, sommes usuelles (géométrique, premiers entiers et carrés), coefficients binomiaux (définition, triangle de Pascal, formule du binôme).
Vocabulaire des Applications (Fonctions) : Application, image directe, composition, injection, surjection, bijection, application réciproque.
Dénombrement (Ensembles Finis) : Cardinal (union, produit cartésien), p-uplets (avec/sans répétition), permutations, p-combinaisons.
II. Analyse :

Suites Réelles :
Généralités : Suites arithmétiques, géométriques, arithmético-géométriques, suites récurrentes linéaires d'ordre 2 (u 
n+2
​
 =au 
n+1
​
 +bu 
n
​
 ).
Convergence : Limite (finie/infinie), opérations sur les limites, théorème d'encadrement, théorème de la limite monotone, suites adjacentes.
Comportement : Étude de suites u 
n+1
​
 =f(u 
n
​
 ) (cas simples avec f monotone), croissances comparées (factorielle, puissance, géométrique), suites équivalentes (notation, opérations, application aux limites).
Fonctions Réelles d'une Variable Réelle :
Généralités et Fonctions Usuelles : Ensemble de définition, graphe (transformations), parité, périodicité, monotonie, fonctions affines, puissances, racine carrée, exponentielle, logarithme népérien, x↦a 
x
 , x↦log(x), fonctions circulaires, partie entière, valeur absolue.
Limites et Continuité : Limite en un point/infini (définition avec ϵ présentée, mais technicité non exigée), opérations, théorème d'encadrement, continuité en un point/sur un intervalle, théorème des valeurs intermédiaires, théorème de la bijection (pour f continue et strictement monotone), fonction arctangente (définition, graphe).
Dérivation : Nombre dérivé, fonction dérivée, opérations, dérivée d'une composée, dérivée de la fonction réciproque (arctan), théorème de Rolle, théorème des accroissements finis, caractérisation des fonctions monotones par le signe de la dérivée, recherche d'extremums, fonctions de classe C 
n
 .
Intégration (sur un segment) : Sommes de Riemann (convergence admise pour C 
0
 ), propriétés de l'intégrale, théorème fondamental de l'analyse (lien primitive/intégrale), intégration par parties, changement de variable (simple ou indiqué).
Développements Limités (DL) : Notation o(x 
n
 ), DL en 0 (unicité), opérations (somme, produit, composition simple, primitivation), formule de Taylor-Young (admise), DL usuels en 0 (exp, cos, sin, 1/(1+x), ln(1+x), (1+x) 
α
 ) – limités à l'ordre 3 pour les calculs. Applications (équivalents, limites, étude locale).
Fonctions Réelles de Deux Variables Réelles (Notions de base) : Fonctions partielles, dérivées partielles premières, gradient, dérivation de t↦f(x(t),y(t)), points critiques, dérivées partielles secondes, théorème de Schwarz (admis).
III. Algèbre Linéaire (Principalement sur K 
n
  avec K=R ou C) :

Systèmes Linéaires : Équations linéaires, opérations élémentaires, algorithme du pivot de Gauss, rang, résolution.
Matrices : Définitions (types de matrices), opérations (somme, produit par un scalaire, produit matriciel), transposée, matrices carrées inversibles (inverse, notamment pour les matrices 2x2 via déterminant), rang d'une matrice.
Espace Vectoriel K 
n
  : Combinaisons linéaires, sous-espaces vectoriels (engendré par une famille), familles libres/liées, bases, coordonnées, dimension. Base canonique.
Applications Linéaires (de K 
p
  dans K 
n
 ) : Définition, noyau, image, opérations (somme, composition), matrice d'une application linéaire dans des bases, rang, théorème du rang (démonstration non exigible).
IV. Probabilités (Sur Univers Finis) :

Concepts de Base : Espace probabilisé (univers fini Ω, événements), système complet d'événements, probabilité (propriétés, formule des probabilités totales), équiprobabilité.
Conditionnement et Indépendance : Probabilité conditionnelle (formule des probabilités composées), formule de Bayes, indépendance de deux événements, événements mutuellement indépendants.
Variables Aléatoires Finies : Définition, loi de probabilité, fonction de répartition (représentations graphiques), espérance (linéarité non démontrée mais utilisée, théorème de transfert admis), variance (formule de König-Huygens), écart-type.
Lois Usuelles (sur univers fini) : Loi certaine, uniforme sur {1,…,n} (espérance), de Bernoulli, binomiale (espérance, variance). Indépendance de variables aléatoires.
V. Géométrie (Support intuitif – Questions conceptuelles) :

Vecteurs du plan et de l'espace (opérations, colinéarité, coplanarité).
Droites et plans (équations paramétriques/cartésiennes).
Produit scalaire (définition, orthogonalité, expression en base orthonormée).
Projection orthogonale (point sur droite/plan).
.
          Fournissez l'énigme et sa réponse numérique.
          Formatez votre réponse comme un objet JSON avec deux clés : "question" (string) et "answer" (number).
          Exemple : {"question": "Je suis un nombre. Si vous me multipliez par x^n et soustrayez le developpement limité de sin en n , vous obtenez m. Quel nombre suis-je ?", "answer": 0}`;

          const response = await fetch(LOCAL_LLM_ENDPOINT_ENIGMA, { 
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({
              model: LOCAL_LLM_MODEL_NAME_ENIGMA, 
              messages: [{ role: "user", content: enigmaPrompt }],
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.error?.message || errorData.message || `La requête pour l'énigme a échoué: ${response.status}`);
          }
          const data = await response.json();
          let enigmaContent = data.choices?.[0]?.message?.content;
          if (!enigmaContent) {
            throw new Error("Le LLM n'a pas retourné de contenu pour l'énigme.");
          }
          const jsonMatch = enigmaContent.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
          if (jsonMatch) {
            enigmaContent = jsonMatch[1] || jsonMatch[2];
          }
          const parsedEnigma = JSON.parse(enigmaContent);
          if (typeof parsedEnigma.question === 'string' && typeof parsedEnigma.answer === 'number') {
            return { question: parsedEnigma.question, answer: parsedEnigma.answer };
          } else {
            throw new Error("La réponse du LLM pour l'énigme n'est pas au format attendu (JSON avec 'question' (string) et 'answer' (number)).");
          }
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("Échec de la récupération de l'énigme LLM:", error);
          const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
          if (error instanceof Error && error.name === 'AbortError') {
            setAccessMessage(`Erreur de génération du challenge IA: Timeout. Retour au challenge standard.`);
          } else {
            setAccessMessage(`Erreur de génération du challenge IA: ${errorMsg}. Retour au challenge standard.`);
          }
          await new Promise(resolve => setTimeout(resolve, 1500)); 
          return null;
        } finally {
          setIsLoadingEnigma(false);
        }
      }, []);
      
      const generateFallbackMathProblem = useCallback((): MathProblem => {
        const operations = ['+', '-', '*'];
        const num1 = Math.floor(Math.random() * 9) + 1; 
        const num2 = Math.floor(Math.random() * 9) + 1;
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let question = `${num1} ${operation} ${num2}`;
        let answer: number;
        switch (operation) {
          case '+': answer = num1 + num2; break;
          case '-': 
            if (num1 < num2) { question = `${num2} ${operation} ${num1}`; answer = num2 - num1; }
            else { answer = num1 - num2; }
            break;
          case '*': answer = num1 * num2; break;
          default:  answer = num1 + num2; question = `${num1} + ${num2}`; 
        }
        return { question, answer };
      }, []);

      const handleUnlockSuccess = useCallback(async () => {
        setAccessMessage("CODE PI/EULER ACCEPTÉ. INITIATION DU CHALLENGE IA...");
        setAppPhase(AppPhase.LLM_CHALLENGE_PROMPT);
        let problem = await fetchLlmEnigma();
        if (!problem) { 
            setAccessMessage("Échec de la génération du challenge IA. Utilisation d'un challenge standard.");
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            problem = generateFallbackMathProblem();
        }
        setCurrentMathProblem(problem);
        setTimeout(() => {
          setAccessMessage(`CHALLENGE: Résolvez ${problem?.question || "Chargement..."}`);
          setAppPhase(AppPhase.LLM_CHALLENGE_SOLVE);
        }, 500); 
      }, [fetchLlmEnigma, generateFallbackMathProblem]);

      const handleLlmChallengeSolved = useCallback(() => {
        setAccessMessage("CHALLENGE RÉUSSI. ACCÈS À ENIGMA SHELL & OS...");
        setTimeout(() => {
          setAppPhase(AppPhase.SHELL_ACTIVE);
          setAccessMessage(null);
        }, 2000);
      }, []);

      const handleLlmChallengeFailed = useCallback(() => {
        setAccessMessage("CHALLENGE ÉCHOUÉ. RETOUR À LA CALCULATRICE.");
        setCurrentMathProblem(null);
        setTimeout(() => {
          setAppPhase(AppPhase.CALCULATOR_NORMAL);
          setAccessMessage(null);
        }, 2000);
      }, []);
      
      useEffect(() => {
        if (appPhase === AppPhase.CALCULATOR_NORMAL && !accessMessage && !isLoadingEnigma) {
            setAccessMessage("Entrez un calcul ou la séquence de déverrouillage (PI.JJ ou E.JJ)");
        }
      }, [appPhase, accessMessage, isLoadingEnigma]);

      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-orbitron selection:bg-emerald-500 selection:text-slate-900">
          <header className="mb-8 text-center">
            <h1 className="text-5xl font-bold neon-text-green">ENIGMA SHELL</h1>
            {appPhase !== AppPhase.SHELL_ACTIVE && (
              <p className="text-slate-400 text-lg mt-2">
                {accessMessage || "En attente d'entrée..."}
              </p>
            )}
          </header>

          {appPhase !== AppPhase.SHELL_ACTIVE && (
            <Calculator
              currentPhase={appPhase}
              mathProblem={currentMathProblem}
              onUnlockSuccess={handleUnlockSuccess}
              onLlmChallengeSolved={handleLlmChallengeSolved}
              onLlmChallengeFailed={handleLlmChallengeFailed}
            />
          )}

          {appPhase === AppPhase.SHELL_ACTIVE && (
            <div style={{ display: 'flex', flexDirection: 'row', width: '95vw', maxWidth: '1800px', height: 'calc(100vh - 150px)', gap: '15px' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Shell
                  onCommandForEnigmaOS={handleSetCommandForEnigmaOS} // MODIFIÉ ICI
                  enigmaOSOutput={enigmaOSOutputHistory}
                  isEnigmaOSReady={isEnigmaOSReady}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0, height: '100%' }}> 
                <EnigmaOSTerminal
                  onOutput={handleEnigmaOSOutput}
                  commandToRun={commandForEnigmaOS}
                  onCommandSent={handleCommandSentToOS}
                  onEmulatorReady={handleEmulatorReady}
                />
              </div>
            </div>
          )}
        </div>
      );
    };

    export default App;
    