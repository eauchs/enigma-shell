// src/components/EnigmaOSTerminal.tsx
import React, { useEffect, useRef, useState } from 'react';

// Déclare globalement window.V86 pour TypeScript
declare global {
  interface Window {
    V86: any;
  }
}

interface EnigmaOSTerminalProps {
  onOutput: (output: string) => void;
  commandToRun: string | null;
  onCommandSent: () => void;
  onEmulatorReady: () => void;
}

const EnigmaOSTerminal: React.FC<EnigmaOSTerminalProps> = ({
  onOutput,
  commandToRun,
  onCommandSent,
  onEmulatorReady,
}) => {
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const emulatorRef = useRef<any>(null);
  const [isLibLoaded, setIsLibLoaded] = useState(false);
  const [emulatorStatus, setEmulatorStatus] = useState<string>('Chargement libv86...');

  // 1. Charger dynamiquement libv86.js
  useEffect(() => {
    if (window.V86) {
      setIsLibLoaded(true);
      setEmulatorStatus('Librairie v86 (déjà chargée).');
      return;
    }
    const script = document.createElement('script');
    script.src = '/v86/libv86.js'; // Assurez-vous que ce chemin est correct
    script.async = true;
    script.onload = () => {
      setIsLibLoaded(true);
      setEmulatorStatus('Librairie v86 chargée.');
    };
    script.onerror = () => {
      const errorMsg = "Erreur: Impossible de charger libv86.js\n";
      onOutput(errorMsg);
      setEmulatorStatus(errorMsg);
      console.error(errorMsg);
    };
    document.body.appendChild(script);

    return () => {
      // Optionnel: nettoyer le script si le composant est démonté avant le chargement
      // document.body.removeChild(script);
    };
  }, [onOutput]);

  // 2. Initialiser l'émulateur
  useEffect(() => {
    if (!isLibLoaded || !screenContainerRef.current || emulatorRef.current) {
      if (isLibLoaded && !screenContainerRef.current) {
        setEmulatorStatus("Attente du conteneur d'écran DOM...");
      }
      return;
    }

    if (!window.V86) {
      // Cette condition pourrait être redondante si isLibLoaded est fiable,
      // mais c'est une double vérification.
      if (isLibLoaded) {
        const errorMsg = "Erreur: V86 non trouvé sur window après chargement de libv86.js.\n";
        onOutput(errorMsg);
        setEmulatorStatus(errorMsg);
        console.error(errorMsg);
      }
      return;
    }
    
    setEmulatorStatus('Préparation de l\'initialisation de v86...');

    // Léger délai pour s'assurer que le DOM est stable, bien que screenContainerRef.current soit déjà vérifié.
    const initTimeoutId = setTimeout(() => {
      if (!screenContainerRef.current) {
        // Cette vérification est cruciale car screenContainerRef.current pourrait devenir null
        // si le composant est démonté rapidement après le début de ce useEffect.
        const errorMsg = "Erreur critique: screenContainerRef.current est devenu null avant l'initialisation de V86.\n";
        onOutput(errorMsg);
        setEmulatorStatus(errorMsg);
        console.error(errorMsg);
        return;
      }

      setEmulatorStatus('Initialisation de v86...');
      try {
        const emulator = new window.V86({
          wasm_path: '/v86/v86.wasm', // Assurez-vous que ce chemin est correct
          memory_size: 256 * 1024 * 1024, // 256MB
          vga_memory_size: 8 * 1024 * 1024,
          screen_container: screenContainerRef.current,
          bios: { url: '/v86/seabios.bin' }, // Assurez-vous que ce chemin est correct
          vga_bios: { url: '/v86/vgabios.bin' }, // Assurez-vous que ce chemin est correct
          cdrom: { url: '/images/alpine-minimal.iso' }, // Chemin vers votre image ISO
          // Pourrait être nécessaire si la sortie n'arrive pas sur serial0 par défaut :
          // cmdline: "console=ttyS0", 
          autostart: true,
          disable_keyboard: true, // Important pour contrôler via serial_send
          disable_mouse: true,    // Important pour contrôler via serial_send
          uart_output_all: true,  // Crucial pour obtenir la sortie
        });
        emulatorRef.current = emulator;

        let lineBuffer = "";
        let readyNotified = false;

        emulator.add_listener('serial0-output-char', (char: string) => {
          // LOG POUR VOIR CHAQUE CARACTÈRE BRUT REÇU
          console.log(`EnigmaOSTerminal RAW CHAR: '${JSON.stringify(char)}' (code: ${char.charCodeAt(0)})`);

          if (char === '\r') {
            // Optionnel: log si vous voulez voir les CR
            // console.log("EnigmaOSTerminal: Caractère Retour Chariot (CR) reçu et ignoré.");
            return; // Ignorer les retours chariot seuls si vous gérez les nouvelles lignes avec \n
          }

          if (char === '\n') {
            const currentLine = lineBuffer; // Sauvegarder avant de réinitialiser
            onOutput(currentLine + '\n'); // Envoyer la ligne complète
            console.log("EnigmaOSTerminal (serial0-output): Ligne complète reçue:", JSON.stringify(currentLine));

            // Tenter de détecter l'invite de login ou un shell prêt
            if (!readyNotified && (currentLine.includes('login:') || currentLine.includes('#') || currentLine.includes('$'))) {
              console.log("EnigmaOSTerminal: Condition 'prêt' REMPLIE pour la ligne:", JSON.stringify(currentLine));
              if (emulatorRef.current) { // Vérifier à nouveau si l'émulateur existe toujours
                onEmulatorReady(); // Indiquer que l'OS est prêt
                readyNotified = true;
                setEmulatorStatus('Alpine Linux prêt.');
              }
            } else if (!readyNotified) {
              // Optionnel: log pour les lignes qui ne matchent pas
              // console.log("EnigmaOSTerminal: Condition 'prêt' NON remplie pour la ligne:", JSON.stringify(currentLine));
            }
            lineBuffer = ""; // Réinitialiser le buffer pour la prochaine ligne
          } else {
            lineBuffer += char; // Ajouter le caractère au buffer
          }
        });
        
      } catch (error) {
        const errorMsg = `Erreur d'initialisation de V86: ${error}\n`;
        onOutput(errorMsg);
        setEmulatorStatus(errorMsg);
        console.error("V86 Initialization Error:", error);
      }
    }, 200); // Le délai de 200ms peut être ajusté ou retiré si non nécessaire

    return () => clearTimeout(initTimeoutId); // Nettoyer le timeout

  }, [isLibLoaded, onOutput, onEmulatorReady]); // Dépendances du useEffect d'initialisation

  // Nettoyage de l'émulateur lors du démontage du composant
  useEffect(() => {
    return () => {
      if (emulatorRef.current) {
        try {
          emulatorRef.current.destroy();
        } catch (e) {
          console.warn("Erreur lors de la destruction de l'émulateur V86:", e);
        }
        emulatorRef.current = null;
        setEmulatorStatus("Émulateur détruit.");
      }
    };
  }, []);

  // Envoyer une commande à l'émulateur
  useEffect(() => {
    if (commandToRun && emulatorRef.current && typeof emulatorRef.current.serial_send === 'function') {
      // Vérifier si l'émulateur est en cours d'exécution avant d'envoyer
      if (emulatorRef.current.is_running && emulatorRef.current.is_running()) {
        emulatorRef.current.serial_send(commandToRun + '\n');
        onCommandSent(); // Confirmer que la commande a été envoyée (tentée)
      } else {
        // console.warn("EnigmaOSTerminal: Tentative d'envoyer une commande, mais l'émulateur n'est pas en cours d'exécution.");
        // Gérer le cas où la commande arrive avant que l'émulateur soit prêt à la recevoir (ex: la mettre en file d'attente)
        // Pour l'instant, on ne fait rien si l'OS n'est pas "prêt" (détecté par onEmulatorReady)
      }
    } else if (commandToRun) {
      // console.warn("EnigmaOSTerminal: Tentative d'envoyer une commande mais l'émulateur ou serial_send n'est pas prêt.");
    }
  }, [commandToRun, onCommandSent]); // Dépendance à commandToRun

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#0D1117', // Correspond à bg-slate-900 (approximativement)
      border: '1px solid #30363d', // Correspond à border-slate-700 (approximativement)
      borderRadius: '6px' 
    }}>
      {/* Barre de statut */}
      <div style={{ 
        padding: '5px 10px', 
        backgroundColor: '#161b22', // Correspond à bg-slate-800 (approximativement)
        borderBottom: '1px solid #30363d', 
        color: '#c9d1d9', // Correspond à text-slate-300 (approximativement)
        fontSize: '0.8em',
        fontFamily: 'sans-serif' // Ou une police système standard
      }}>
        Statut enigma-os: <span style={{ 
          color: emulatorStatus === 'Alpine Linux prêt.' ? 'lightgreen' : (emulatorStatus.startsWith('Erreur') ? 'red' : 'orange') 
        }}>{emulatorStatus}</span>
      </div>

      {/* Conteneur de l'écran de l'émulateur */}
      <div 
        ref={screenContainerRef} 
        style={{ 
          flexGrow: 1, 
          backgroundColor: '#010409', // Fond très sombre pour l'écran
          overflow: 'hidden', 
          position: 'relative' 
        }}
      >
        {/* libv86.js s'attend à trouver un canvas et un div (pour le mode texte)
          à l'intérieur du screen_container. Ils peuvent être cachés initialement
          ou stylisés selon les besoins de v86.
        */}
        <canvas style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}></canvas> {/* 'block' par défaut pour v86 */}
        <div style={{ width: '100%', height: '100%', fontFamily: 'monospace', whiteSpace: 'pre', display: 'none' }}></div> {/* 'none' si non utilisé activement */}
        
        {/* Indicateur de chargement simple si l'émulateur n'est pas encore là mais que la lib est chargée */}
        {!emulatorRef.current && isLibLoaded && 
          <p style={{
            color: 'gray', 
            padding: '10px', 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontFamily: 'sans-serif'
          }}>
            Initialisation de l'émulateur v86...
          </p>
        }
      </div>
    </div>
  );
};

export default EnigmaOSTerminal;