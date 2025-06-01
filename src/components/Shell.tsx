// src/components/Shell.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShellEntry } from '../types';

const LOCAL_LLM_ENDPOINT = "http://192.168.3.228:1234/v1/chat/completions";
const LOCAL_LLM_MODEL_NAME = "qwen/qwen3-4b"; // Mis à jour selon vos logs LM Studio

const SYSTEM_INSTRUCTION_BASE = `Vous êtes Enigma Shell AI. Vous interagissez avec "enigma-os", un environnement Alpine Linux.
IMPORTANT: Si la sortie d'"enigma-os" que je vous fournis contient "localhost login:", votre TOUTE PREMIÈRE action DOIT ÊTRE de vous connecter. Pour cela, répondez UNIQUEMENT avec l'objet JSON:
{"type": "execute_in_enigma_os", "command": "root"}
Aucun mot de passe n'est requis par défaut pour "root" sur cette image Alpine. Après avoir envoyé "root", attendez la nouvelle sortie de l'OS pour voir l'invite de shell (par exemple, "localhost:~#").

Pour TOUTES les autres commandes à exécuter dans "enigma-os" (APRÈS la connexion réussie), répondez UNIQUEMENT avec un objet JSON au format :
{"type": "execute_in_enigma_os", "command": "votre commande linux ici"}
Exemple: {"type": "execute_in_enigma_os", "command": "ls -la"}

Si la requête de l'utilisateur ne nécessite pas d'action dans "enigma-os", ou si vous interprétez une sortie d'"enigma-os" pour l'utilisateur, répondez en langage naturel.
Soyez concis. L'heure est ${new Date().toISOString()}.
---
`;

interface MessageForAPI {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ShellProps {
  onCommandForEnigmaOS: (command: string) => void;
  enigmaOSOutput: string;
  isEnigmaOSReady: boolean;
}

const Shell: React.FC<ShellProps> = ({ onCommandForEnigmaOS, enigmaOSOutput, isEnigmaOSReady }) => {
  const [input, setInput] = useState<string>("");
  const [history, setHistory] = useState<ShellEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const endOfMessagesRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);
  const [initialOsInteractionDone, setInitialOsInteractionDone] = useState<boolean>(false);

  const addHistoryEntry = useCallback((type: ShellEntry['type'], text: string): string => {
    const entryId = String(Date.now() + Math.random());
    setHistory(prev => [...prev, { id: entryId, type, text, timestamp: new Date().toLocaleTimeString() }]);
    return entryId;
  }, []);

  useEffect(() => {
    if(history.length === 0) {
     addHistoryEntry('system', `Interface Enigma Shell AI. Noyau IA local connecté. Statut Enigma-OS: ${isEnigmaOSReady ? 'Prêt (Invite Login détectée)' : 'Initialisation...'}.`);
    } else {
      setHistory(prev => {
        const lastEntry = prev[prev.length -1];
        if (lastEntry && lastEntry.type === 'system' && lastEntry.text.includes('Statut Enigma-OS:')) {
          return [...prev.slice(0, -1), { ...lastEntry, text: `Interface Enigma Shell AI. Noyau IA local connecté. Statut Enigma-OS: ${isEnigmaOSReady ? 'Prêt (Invite Login détectée)' : 'Initialisation...'}.`}]
        }
        return prev;
      });
    }
  }, [addHistoryEntry, isEnigmaOSReady, history.length]);

  const handleCommand = useCallback(async (commandStr: string, isSystemTriggered: boolean = false) => {
    const command = commandStr.trim();
    if (!command) {
      setIsLoading(false);
      return;
    }

    if (!isSystemTriggered) {
      addHistoryEntry('command', command);
    }
    setInput("");
    setIsLoading(true);

    const recentEnigmaOSOutput = enigmaOSOutput.slice(-2000); 
    console.log("[Shell.tsx] Contexte envoyé au LLM pour la commande '", command, "':", JSON.stringify(recentEnigmaOSOutput));

    const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\nDERNIER INSTANTANÉ DE SORTIE D'ENIGMA-OS (utilisez pour le contexte):\n---\n${recentEnigmaOSOutput}\n---`;

    const messagesForApi: MessageForAPI[] = [
      { role: "system", content: fullSystemInstruction },
      ...history
        .filter(entry => entry.type === 'command' || (entry.type === 'response' && !entry.text.startsWith("LLM (vers enigma-os):")))
        .slice(-6) 
        .map(entry => ({
          role: entry.type === 'command' ? 'user' : 'assistant',
          content: entry.text,
        } as MessageForAPI)),
      { role: "user", content: command },
    ];
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[Shell.tsx] Requête LLM annulée pour cause de timeout (60 secondes).");
      controller.abort();
    }, 60000); // Timeout augmenté à 60 secondes

    try {
      const requestHeaders: HeadersInit = { 'Content-Type': 'application/json' };
      const response = await fetch(LOCAL_LLM_ENDPOINT, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          model: LOCAL_LLM_MODEL_NAME,
          messages: messagesForApi,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ! Statut: ${response.status}` }));
        throw new Error(errorData.error?.message || errorData.message || `La requête a échoué: ${response.status}`);
      }

      const llmResponseData = await response.json();
      let llmRawResponse = llmResponseData.choices?.[0]?.message?.content || "Le LLM n'a pas fourni de réponse valide.";
      console.log("[Shell.tsx] Réponse brute du LLM:", JSON.stringify(llmRawResponse));
      
      const jsonMatch = llmRawResponse.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (jsonMatch) {
        llmRawResponse = jsonMatch[1] || jsonMatch[2];
        console.log("[Shell.tsx] Réponse JSON extraite du LLM:", JSON.stringify(llmRawResponse));
      }

      try {
        const parsedLlmCmd = JSON.parse(llmRawResponse);
        if (parsedLlmCmd.type === "execute_in_enigma_os" && typeof parsedLlmCmd.command === 'string') {
          console.log(`[Shell.tsx] LLM a demandé l'exécution de: "${parsedLlmCmd.command}" dans enigma-os`);
          if (isEnigmaOSReady) { 
            onCommandForEnigmaOS(parsedLlmCmd.command); 
            addHistoryEntry('response', `LLM -> enigma-os: ${parsedLlmCmd.command}`);
          } else {
            addHistoryEntry('response', `LLM (commande pour enigma-os): ${parsedLlmCmd.command} (ERREUR: Enigma-OS n'est pas signalé comme prêt !)`);
          }
        } else {
          addHistoryEntry('response', llmRawResponse); 
        }
      } catch (e) {
        console.log("[Shell.tsx] Réponse du LLM n'est pas un JSON valide ou n'a pas le format attendu. Traitée comme texte brut:", llmRawResponse);
        addHistoryEntry('response', llmRawResponse); 
      }

    } catch (error) {
      clearTimeout(timeoutId);
      const errorMsg = error instanceof Error ? error.message : String(error);
       if (error instanceof Error && error.name === 'AbortError') {
        addHistoryEntry('error', `Erreur LLM: La requête a dépassé le délai d'attente.`);
      } else {
        addHistoryEntry('error', `Erreur LLM: ${errorMsg}`);
      }
      console.error("Erreur d'interaction LLM:", error);
    } finally {
      setIsLoading(false);
    }
  }, [addHistoryEntry, enigmaOSOutput, history, isEnigmaOSReady, onCommandForEnigmaOS]);

  useEffect(() => {
    if (isEnigmaOSReady && !initialOsInteractionDone) {
      const currentOutputNormalized = enigmaOSOutput.toLowerCase(); 
      if (currentOutputNormalized.includes("login:")) { 
        console.log("[Shell.tsx] EnigmaOS prêt ET 'login:' DÉTECTÉ dans enigmaOSOutput. Déclenchement LLM pour connexion.");
        addHistoryEntry('system', "SYSTEM_OBSERVATION: Enigma-OS est à l'invite de connexion. Le LLM va initier la connexion.");
        handleCommand("L'OS enigma-os affiche une invite de connexion. Procédez à la connexion en tant que 'root'.", true);
        setInitialOsInteractionDone(true); 
      } else if (enigmaOSOutput.length > 0 && initialOsInteractionDone === false) { 
        // Ce cas est pour si l'OS est prêt, mais l'invite de login n'est pas la première chose vue.
        // Ou si la détection initiale a été manquée.
        // console.log("[Shell.tsx] EnigmaOS prêt, mais 'login:' pas encore explicitement dans enigmaOSOutput pour le déclenchement LLM. Tentative d'analyse de l'état.");
        // addHistoryEntry('system', "SYSTEM_OBSERVATION: Enigma-OS est prêt. Le LLM va analyser l'état actuel.");
        // handleCommand("Analyse la sortie actuelle de enigma-os et détermine la prochaine action.", true);
        // setInitialOsInteractionDone(true); // Pourrait être redondant si la condition login: est la plus fiable
      }
    }
  }, [isEnigmaOSReady, enigmaOSOutput, initialOsInteractionDone, addHistoryEntry, handleCommand]);

  const scrollToBottom = () => { endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(scrollToBottom, [history]);
  useEffect(() => { if (!isLoading) inputRef.current?.focus(); }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      handleCommand(input);
    }
  };
  
  const ShellPrompt: React.FC = () => ( <span className="text-cyan-400">enigma@shell:<span className="text-purple-400">~</span>${' '}</span> );

  return (
    <div className="w-full h-full bg-black/75 backdrop-blur-sm rounded-lg shadow-xl p-1 flex flex-col font-roboto-mono border-2 neon-border-cyan-500">
      <div className="flex-grow p-4 overflow-y-auto text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {history.map(entry => (
          <div key={entry.id} className="mb-2">
            {entry.type === 'command' && ( <div><ShellPrompt /> <span className="text-white">{entry.text}</span></div> )}
            {entry.type === 'response' && ( <pre className="text-cyan-300 whitespace-pre-wrap">{entry.text}</pre> )}
            {entry.type === 'error' && ( <pre className="text-red-400 whitespace-pre-wrap">{entry.text}</pre> )}
            {entry.type === 'system' && ( <pre className="text-yellow-400 whitespace-pre-wrap">{entry.text}</pre> )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center text-gray-400">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Le LLM réfléchit...
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center p-2 border-t neon-border-cyan-500">
        <ShellPrompt />
        <input
          id="enigmaShellInput" 
          name="enigmaShellInput" 
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-grow bg-transparent text-slate-100 focus:outline-none ml-2"
          placeholder={isEnigmaOSReady ? "Interagir avec le LLM ou commander enigma-os..." : "Enigma-OS en initialisation..."}
          disabled={isLoading || (!isEnigmaOSReady && !initialOsInteractionDone)}
          autoFocus
          aria-label="Shell input"
        />
      </form>
    </div>
  );
};

export default Shell;
