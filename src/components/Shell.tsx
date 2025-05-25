// src/components/Shell.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShellEntry } from '../types';

// REMPLACEZ CES VALEURS PAR VOTRE CONFIGURATION RÉELLE
const LOCAL_LLM_ENDPOINT = "http://localhost:1234/v1/chat/completions";
const LOCAL_LLM_MODEL_NAME = "qwen/qwen3-4b"; // Ex: "google/gemma-2b-it" ou ce que vous utilisez
// const LOCAL_LLM_API_KEY = "VOTRE_CLE_API_LOCALE_SI_NECESSAIRE";

const SYSTEM_INSTRUCTION_BASE = `Vous êtes Enigma Shell AI. Vous pouvez interagir avec un environnement Alpine Linux virtualisé appelé "enigma-os".
Pour exécuter une commande dans "enigma-os", répondez UNIQUEMENT avec un objet JSON au format :
{"type": "execute_in_enigma_os", "command": "votre commande linux ici"}
Par exemple, pour lister les fichiers, répondez avec : {"type": "execute_in_enigma_os", "command": "ls -la"}
La sortie d'"enigma-os" vous sera fournie lors des interactions suivantes.
En fonction de cette sortie, vous pourrez décider d'émettre une autre commande ou de répondre à l'utilisateur en langage naturel.
Si la requête de l'utilisateur ne nécessite pas "enigma-os", ou si vous interprétez une sortie d'"enigma-os" pour l'utilisateur, répondez en langage naturel.
Gardez vos réponses en langage naturel concises et de style terminal si approprié.
L'heure actuelle est ${new Date().toISOString()}.
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
  const lastEnigmaOSOutputProcessedLength = useRef<number>(0);

  const addHistoryEntry = useCallback((type: ShellEntry['type'], text: string): string => {
    const entryId = String(Date.now() + Math.random());
    console.log(`Shell.tsx: addHistoryEntry - Type: ${type}, Texte: ${text.substring(0,100)}...`);
    setHistory(prev => [...prev, { id: entryId, type, text, timestamp: new Date().toLocaleTimeString() }]);
    return entryId;
  }, []);

  useEffect(() => {
    console.log("Shell.tsx: isEnigmaOSReady prop reçue:", isEnigmaOSReady);
    addHistoryEntry('system', `Interface Enigma Shell AI. Noyau IA local connecté. Statut Enigma-OS: ${isEnigmaOSReady ? 'Prêt' : 'Initialisation...'}.`);
  }, [addHistoryEntry, isEnigmaOSReady]);
  
  const scrollToBottom = () => { endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(scrollToBottom, [history]);
  useEffect(() => { if (!isLoading && inputRef.current) inputRef.current.focus(); }, [isLoading]);

  useEffect(() => {
    // Optionnel: afficher la nouvelle sortie d'enigma-os dans l'historique du Shell si vous le souhaitez,
    // mais elle est principalement destinée au contexte LLM et au panneau EnigmaOSTerminal.
    // Pour éviter la duplication, nous nous concentrons sur son envoi au LLM.
    // console.log("Shell.tsx: enigmaOSOutput a changé, longueur:", enigmaOSOutput.length);
  }, [enigmaOSOutput]);


  const handleCommand = async (commandStr: string) => {
    const command = commandStr.trim();
    if (!command) return;

    addHistoryEntry('command', command);
    setInput("");
    setIsLoading(true);
    console.log("Shell.tsx: handleCommand - Commande utilisateur:", command);

    // Prendre seulement la nouvelle partie de la sortie d'enigma-os ou une fenêtre glissante
    const currentOutputLength = enigmaOSOutput.length;
    const newOutputSlice = enigmaOSOutput.slice(lastEnigmaOSOutputProcessedLength.current);
    // Pour le contexte, on pourrait envoyer les N derniers caractères ou seulement le nouveau diff.
    // Envoyer les N derniers caractères est plus simple pour le LLM.
    const enigmaOSContext = enigmaOSOutput.slice(-2000); // Les 2000 derniers caractères pour le contexte

    console.log(`Shell.tsx: handleCommand - Longueur sortie enigma-os actuelle: ${currentOutputLength}, Précédente: ${lastEnigmaOSOutputProcessedLength.current}`);
    console.log("Shell.tsx: handleCommand - Contexte enigma-os pour LLM (derniers 2000 caractères):", enigmaOSContext.substring(0,200) + "...");
    
    const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\nDERNIER INSTANTANÉ DE SORTIE D'ENIGMA-OS (utilisez pour le contexte):\n---\n${enigmaOSContext}\n---`;

    const messagesForApi: MessageForAPI[] = [
      { role: "system", content: fullSystemInstruction },
      ...history
        .filter(entry => entry.type === 'command' || entry.type === 'response') // Filtrer pour ne pas inclure system/error
        .map(entry => ({
          role: entry.type === 'command' ? 'user' : 'assistant',
          content: entry.text,
        } as MessageForAPI)),
      { role: "user", content: command },
    ];
    console.log("Shell.tsx: handleCommand - Messages envoyés à l'API LLM:", messagesForApi);

    try {
      const requestHeaders: HeadersInit = { 'Content-Type': 'application/json' };
      // if (LOCAL_LLM_API_KEY) { requestHeaders['Authorization'] = `Bearer ${LOCAL_LLM_API_KEY}`; }

      const response = await fetch(LOCAL_LLM_ENDPOINT, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          model: LOCAL_LLM_MODEL_NAME,
          messages: messagesForApi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erreur HTTP ! Statut: ${response.status}` }));
        console.error("Shell.tsx: handleCommand - Erreur réponse LLM:", errorData);
        throw new Error(errorData.error?.message || errorData.message || `La requête a échoué: ${response.status}`);
      }

      const llmResponseData = await response.json();
      console.log("Shell.tsx: handleCommand - Réponse brute LLM:", llmResponseData);
      let llmRawResponse = llmResponseData.choices?.[0]?.message?.content || "Le LLM n'a pas fourni de réponse valide.";
      console.log("Shell.tsx: handleCommand - Contenu de la réponse LLM:", llmRawResponse);
      
      const jsonMatch = llmRawResponse.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
      if (jsonMatch) {
        llmRawResponse = jsonMatch[1] || jsonMatch[2];
        console.log("Shell.tsx: handleCommand - Réponse LLM après extraction du bloc JSON:", llmRawResponse);
      }

      try {
        const parsedLlmCmd = JSON.parse(llmRawResponse);
        if (parsedLlmCmd.type === "execute_in_enigma_os" && typeof parsedLlmCmd.command === 'string') {
          console.log("Shell.tsx: handleCommand - LLM demande exécution dans enigma-os:", parsedLlmCmd.command);
          if (isEnigmaOSReady) {
            onCommandForEnigmaOS(parsedLlmCmd.command);
            addHistoryEntry('response', `LLM -> enigma-os: ${parsedLlmCmd.command}`);
          } else {
            addHistoryEntry('response', `LLM (vers enigma-os): ${parsedLlmCmd.command} (Enigma-OS non prêt)`);
          }
        } else {
          console.log("Shell.tsx: handleCommand - Réponse LLM en langage naturel (ou JSON non reconnu).");
          addHistoryEntry('response', llmRawResponse);
        }
      } catch (e) {
        console.log("Shell.tsx: handleCommand - Réponse LLM en langage naturel (parsing JSON échoué).");
        addHistoryEntry('response', llmRawResponse);
      }
      // Mettre à jour la référence de la longueur de la sortie traitée APRES que le LLM ait eu la chance de la voir.
      lastEnigmaOSOutputProcessedLength.current = currentOutputLength;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addHistoryEntry('error', `Erreur LLM: ${errorMsg}`);
      console.error("Erreur d'interaction LLM:", error);
    } finally {
      setIsLoading(false);
      console.log("Shell.tsx: handleCommand - Fin");
    }
  };

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
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-grow bg-transparent text-slate-100 focus:outline-none ml-2"
          placeholder={isEnigmaOSReady ? "Interagir avec le LLM ou commander enigma-os..." : "Enigma-OS en initialisation..."}
          disabled={isLoading || !isEnigmaOSReady}
          autoFocus
          aria-label="Shell input"
        />
      </form>
    </div>
  );
};

export default Shell;