// src/components/EnigmaOSTerminal.tsx
import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    V86Starter: any; 
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
  const [isV86LibReady, setIsV86LibReady] = useState(false);
  const [emulatorStatus, setEmulatorStatus] = useState<string>('Vérification de la librairie V86...');

  useEffect(() => {
    const EmulatorClass = window.V86Starter || window.V86;
    if (EmulatorClass) {
      setEmulatorStatus('Librairie V86 (libv86.js) détectée. Prêt pour initialisation.');
      setIsV86LibReady(true);
    } else {
      const errorMsg = "Erreur: V86Starter ou V86 (de libv86.js) non trouvé sur window. Vérifiez son chargement dans index.html.\n";
      onOutput(errorMsg);
      setEmulatorStatus(errorMsg);
      console.error(errorMsg);
    }
  }, [onOutput]);

  useEffect(() => {
    if (!isV86LibReady || !screenContainerRef.current || emulatorRef.current) {
      if (isV86LibReady && !screenContainerRef.current) {
        setEmulatorStatus("Attente du conteneur d'écran DOM...");
      }
      return;
    }
    
    setEmulatorStatus('Préparation de l\'initialisation de V86...');

    const initTimeoutId = setTimeout(() => {
      if (!screenContainerRef.current) {
        const errorMsg = "Erreur critique: screenContainerRef.current est devenu null avant l'initialisation de V86.\n";
        onOutput(errorMsg);
        setEmulatorStatus(errorMsg);
        console.error(errorMsg);
        return;
      }

      setEmulatorStatus('Initialisation de V86...');
      try {
        const EmulatorClass = window.V86Starter || window.V86;
        if (!EmulatorClass) {
            throw new Error("V86Starter ou V86 n'est pas disponible sur window.");
        }

        const emulator = new EmulatorClass({
          wasm_path: '/v86/v86.wasm', 
          memory_size: 256 * 1024 * 1024,
          vga_memory_size: 8 * 1024 * 1024,
          screen_container: screenContainerRef.current,
          bios: { url: '/v86/seabios.bin' },
          vga_bios: { url: '/v86/vgabios.bin' },
          cdrom: { url: '/images/alpine-minimal.iso' },
          autostart: true,
          disable_keyboard: false,
          disable_mouse: true,
          // uart_output_all: true, // Laissez commenté pour le moment, ou testez avec si 'serial0-output-byte' ne fonctionne toujours pas
        });
        
        emulatorRef.current = emulator;
        console.log('[EnigmaOSTerminal] Instance V86 créée:', emulatorRef.current);

        let lineBuffer = "";
        let readyNotified = false;

        emulator.add_listener('emulator-started', () => {
          console.log('[EnigmaOSTerminal] ÉVÉNEMENT "emulator-started" DÉCLENCHÉ !');
        });

        emulator.add_listener('serial0-output-byte', (byte: number) => { 
          const char = String.fromCharCode(byte); 
          // console.log('[EnigmaOSTerminal] Byte brut reçu (converti en char):', JSON.stringify(char), 'Code ASCII:', byte);

          if (char === '\r') { 
            return; 
          }

          if (char === '\n') { 
            // console.log('[EnigmaOSTerminal] Ligne brute (avant onOutput):', JSON.stringify(lineBuffer));
            onOutput(lineBuffer + '\n'); 
            lineBuffer = ""; 
          } else {
            lineBuffer += char; 
          }
          
          if (!readyNotified) {
            const trimmedLine = lineBuffer.trim().toLowerCase(); 
            const alpineLoginPrompt = "login:";
            
            if (trimmedLine.includes(alpineLoginPrompt)) { 
              console.log('[EnigmaOSTerminal] !!! CONDITION "READY" POTENTIELLEMENT REMPLIE !!! Ligne buffer actuelle normalisée:', JSON.stringify(trimmedLine));
              // Envoyez la ligne contenant "login:" immédiatement pour que App.tsx et Shell.tsx l'aient.
              // Surtout si l'invite n'est pas terminée par un \n par l'OS lui-même.
              if (lineBuffer.trim().toLowerCase().endsWith("login:") || lineBuffer.trim().toLowerCase().endsWith("login: ")) {
                 console.log('[EnigmaOSTerminal] Envoi forcé de la ligne de login via onOutput:', JSON.stringify(lineBuffer + '\n'));
                 onOutput(lineBuffer + '\n'); // Forcer l'envoi de la ligne de login
                 // lineBuffer = ""; // Optionnel: réinitialiser si cette ligne ne doit pas être ré-envoyée au prochain \n
              }

              if (emulatorRef.current) { 
                onEmulatorReady();
                readyNotified = true; 
                setEmulatorStatus('OS émulé prêt.');
                console.log('[EnigmaOSTerminal] Statut changé pour "OS émulé prêt."');
              }
            }
          }
        });
        console.log('[EnigmaOSTerminal] Listener "serial0-output-byte" (et "emulator-started") ajouté.');
        
      } catch (error) {
        const errorMsg = `Erreur d'initialisation de V86: ${error instanceof Error ? error.message : String(error)}\n`;
        onOutput(errorMsg);
        setEmulatorStatus(errorMsg);
        console.error("V86 Initialization Error:", error);
      }
    }, 200);

    return () => clearTimeout(initTimeoutId);

  }, [isV86LibReady, onOutput, onEmulatorReady]);

  useEffect(() => {
    return () => {
      if (emulatorRef.current) {
        try {
          emulatorRef.current.destroy(); 
        } catch (e) {
          console.warn("Erreur lors de la destruction de l'émulateur V86:", e);
        }
        emulatorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (commandToRun && emulatorRef.current && 
        // Vérifier typeof emulatorRef.current.is_running d'abord
        typeof emulatorRef.current.is_running === 'function' && 
        emulatorRef.current.is_running() && // S'assurer qu'il est en cours d'exécution
        typeof emulatorRef.current.serial0_send === 'function') { // MODIFIÉ ICI: serial_send -> serial0_send
      console.log(`[EnigmaOSTerminal] Reçu commandToRun: "${commandToRun}". Envoi à V86 via serial0_send.`);
      emulatorRef.current.serial0_send(commandToRun + '\n'); // MODIFIÉ ICI
      onCommandSent();
    } else if (commandToRun) {
        console.warn(`[EnigmaOSTerminal] Reçu commandToRun: "${commandToRun}", MAIS les conditions pour serial0_send ne sont pas remplies.`, {
            hasEmulator: !!emulatorRef.current,
            // Logguer l'existence de serial_send ET serial0_send pour le diagnostic
            hasSerialSendFunction: typeof emulatorRef.current?.serial_send === 'function',
            hasSerial0SendFunction: typeof emulatorRef.current?.serial0_send === 'function',
            isRunning: typeof emulatorRef.current?.is_running === 'function' ? emulatorRef.current?.is_running() : 'is_running non défini',
        });
    }
  }, [commandToRun, onCommandSent]);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D1117', border: '1px solid #30363d', borderRadius: '6px' }}>
      <div style={{ padding: '5px 10px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', color: '#c9d1d9', fontSize: '0.8em' }}>
        Statut enigma-os: <span style={{ color: emulatorStatus === 'OS émulé prêt.' ? 'lightgreen' : (emulatorStatus.startsWith('Erreur') ? 'red' : 'orange') }}>{emulatorStatus}</span>
      </div>
      
      <div ref={screenContainerRef} style={{ flexGrow: 1, backgroundColor: '#010409', overflow: 'hidden', position: 'relative' }}>
        <div id="screen" style={{ width: '100%', height: '100%', fontFamily: 'monospace', whiteSpace: 'pre' }}></div>
        <canvas id="vga" style={{ width: '100%', height: '100%', objectFit: 'contain' }}></canvas>
        
        {!emulatorRef.current && isV86LibReady && <p style={{color: 'gray', padding: '10px', position: 'absolute', top: 0, left: 0}}>En attente de l'initialisation de v86...</p>}
      </div>
    </div>
  );
};

export default EnigmaOSTerminal;
