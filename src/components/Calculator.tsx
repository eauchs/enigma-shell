
import React, { useState, useEffect, useCallback } from 'react';
import { AppPhase, CalculatorHistoryEntry, MathProblem } from '../types';

interface CalculatorProps {
  currentPhase: AppPhase;
  mathProblem: MathProblem | null;
  onUnlockSuccess: () => void;
  onLlmChallengeSolved: () => void;
  onLlmChallengeFailed: () => void;
}

const PI_BASE = "3.1415926535";
const E_BASE = "2.7182818284";

const Calculator: React.FC<CalculatorProps> = ({
  currentPhase,
  mathProblem,
  onUnlockSuccess,
  onLlmChallengeSolved,
  onLlmChallengeFailed,
}) => {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [history, setHistory] = useState<CalculatorHistoryEntry[]>([]);
  const [isMaxDigits, setIsMaxDigits] = useState<boolean>(false);

  const MAX_DISPLAY_DIGITS = 15; // For PI/E + DD

  const inputDigit = (digit: string) => {
    if (isMaxDigits && !waitingForOperand) return;
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? digit : displayValue + digit);
    }
    if ((displayValue + digit).length >= MAX_DISPLAY_DIGITS) {
        setIsMaxDigits(true);
    } else {
        setIsMaxDigits(false);
    }
  };

  const inputDecimal = () => {
    if (isMaxDigits && !waitingForOperand) return;
    if (waitingForOperand) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes(".")) {
      setDisplayValue(displayValue + ".");
    }
     if ((displayValue + ".").length >= MAX_DISPLAY_DIGITS) {
        setIsMaxDigits(true);
    } else {
        setIsMaxDigits(false);
    }
  };

  const clearDisplay = useCallback(() => {
    setDisplayValue("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setIsMaxDigits(false);
    if (currentPhase === AppPhase.LLM_CHALLENGE_SOLVE) {
        // Don't clear history or trigger fail on AC during challenge solve if not intended.
        // Or, could trigger onLlmChallengeFailed here if AC means giving up.
        // For now, just clears input for re-attempt.
    }
  }, [currentPhase]);
  
  const clearAll = useCallback(() => {
    clearDisplay();
    setHistory([]);
     if (currentPhase !== AppPhase.CALCULATOR_NORMAL && currentPhase !== AppPhase.CALCULATOR_UNLOCK_PROMPT) {
        onLlmChallengeFailed(); // Reset if AC is hit during challenge
    }
  }, [clearDisplay, currentPhase, onLlmChallengeFailed]);


  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (previousValue === null) {
      setPreviousValue(String(inputValue));
    } else if (operator) {
      const prevValue = parseFloat(previousValue);
      const result = calculate(prevValue, inputValue, operator);
      setDisplayValue(String(result));
      setPreviousValue(String(result));
       // Add to history only for normal calculator operations
      if (currentPhase === AppPhase.CALCULATOR_NORMAL || currentPhase === AppPhase.CALCULATOR_UNLOCK_PROMPT) {
        setHistory(prevHist => [...prevHist, { expression: `${prevValue} ${operator} ${inputValue}`, result: String(result) }].slice(-5)); // Keep last 5
      }
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
    setIsMaxDigits(false);
  };

  const calculate = (prevValue: number, currentValue: number, op: string): number => {
    switch (op) {
      case "+": return prevValue + currentValue;
      case "-": return prevValue - currentValue;
      case "*": return prevValue * currentValue;
      case "/": return currentValue === 0 ? Infinity : prevValue / currentValue; // Handle division by zero
      default: return currentValue;
    }
  };

  const handleEquals = () => {
    // Check for unlock sequence first if in normal/unlock_prompt phase
    if (currentPhase === AppPhase.CALCULATOR_NORMAL || currentPhase === AppPhase.CALCULATOR_UNLOCK_PROMPT) {
      const day = new Date().getDate();
      const dayString = day < 10 ? "0" + day : String(day);
      const unlockCodePi = PI_BASE + dayString;
      const unlockCodeE = E_BASE + dayString;

      if (displayValue === unlockCodePi || displayValue === unlockCodeE) {
        onUnlockSuccess();
        clearDisplay(); // Clear display after successful unlock
        return;
      }
    }
    
    // Handle LLM Challenge
    if (currentPhase === AppPhase.LLM_CHALLENGE_SOLVE && mathProblem) {
      const userAnswer = parseFloat(displayValue);
      if (!isNaN(userAnswer) && userAnswer === mathProblem.answer) {
        onLlmChallengeSolved();
      } else {
        onLlmChallengeFailed();
      }
      clearDisplay();
      return;
    }

    // Normal calculation
    if (operator && previousValue !== null) {
      const currentValue = parseFloat(displayValue);
      const prevValue = parseFloat(previousValue);
      const result = calculate(prevValue, currentValue, operator);
      
      const resultStr = String(result === Infinity ? "Error: Div by 0" : result);
      setDisplayValue(resultStr);
      setHistory(prevHist => [...prevHist, { expression: `${prevValue} ${operator} ${currentValue}`, result: resultStr }].slice(-5));

      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true); // Ready for new calculation or further ops on result
      setIsMaxDigits(String(result).length >= MAX_DISPLAY_DIGITS);
    }
  };
  
  useEffect(() => {
    if (currentPhase === AppPhase.CALCULATOR_NORMAL || currentPhase === AppPhase.CALCULATOR_UNLOCK_PROMPT) {
      clearDisplay();
    }
  }, [currentPhase, clearDisplay]);


  const buttons = [
    { id: "clear", label: "AC", action: clearAll, style: "col-span-2 bg-red-500 hover:bg-red-600 neon-border-red-500 shadow-red-500/50" },
    { id: "divide", label: "/", action: () => performOperation("/"), style: "bg-orange-500 hover:bg-orange-600 neon-border-orange-500 shadow-orange-500/50" },
    { id: "multiply", label: "*", action: () => performOperation("*"), style: "bg-orange-500 hover:bg-orange-600 neon-border-orange-500 shadow-orange-500/50" },
    { id: "seven", label: "7", action: () => inputDigit("7") }, { id: "eight", label: "8", action: () => inputDigit("8") },
    { id: "nine", label: "9", action: () => inputDigit("9") },
    { id: "subtract", label: "-", action: () => performOperation("-"), style: "bg-orange-500 hover:bg-orange-600 neon-border-orange-500 shadow-orange-500/50" },
    { id: "four", label: "4", action: () => inputDigit("4") }, { id: "five", label: "5", action: () => inputDigit("5") },
    { id: "six", label: "6", action: () => inputDigit("6") },
    { id: "add", label: "+", action: () => performOperation("+"), style: "bg-orange-500 hover:bg-orange-600 neon-border-orange-500 shadow-orange-500/50" },
    { id: "one", label: "1", action: () => inputDigit("1") }, { id: "two", label: "2", action: () => inputDigit("2") },
    { id: "three", label: "3", action: () => inputDigit("3") },
    { id: "equals", label: "=", action: handleEquals, style: "row-span-2 bg-green-600 hover:bg-green-700 neon-border-green-600 shadow-green-600/50" },
    { id: "zero", label: "0", action: () => inputDigit("0"), style: "col-span-2" },
    { id: "decimal", label: ".", action: inputDecimal },
  ];
  
  const buttonBaseStyle = "text-2xl font-bold rounded-lg p-4 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  const digitButtonStyle = `${buttonBaseStyle} bg-slate-700 hover:bg-slate-600 text-emerald-300 neon-border-green button-active-glow-green focus:ring-emerald-400 shadow-md shadow-emerald-500/30`;
  const operatorButtonStyleBase = `${buttonBaseStyle} text-slate-900 focus:ring-yellow-400 shadow-md`;


  return (
    <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl p-6 neon-box-shadow-green border-2 neon-border-green">
      {/* Display */}
      <div className="bg-black/70 text-right p-4 rounded-lg mb-4 border-2 neon-border-green">
        <div className="text-gray-400 text-sm h-6 overflow-hidden">
          {operator && previousValue !== null ? `${previousValue} ${operator}` : (isMaxDigits ? "Max Digits" : "\u00A0")}
        </div>
        <div className="text-4xl neon-text-green font-roboto-mono break-all h-12">
          {displayValue}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 grid-rows-5 gap-2">
        {buttons.map(btn => (
          <button
            key={btn.id}
            onClick={btn.action}
            className={`${btn.style?.includes("bg-") ? operatorButtonStyleBase : digitButtonStyle} ${btn.style || ""}`}
            disabled={(currentPhase === AppPhase.LLM_CHALLENGE_PROMPT || currentPhase === AppPhase.CALCULATOR_UNLOCK_PROMPT)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* History */}
       {(currentPhase === AppPhase.CALCULATOR_NORMAL || currentPhase === AppPhase.CALCULATOR_UNLOCK_PROMPT) && history.length > 0 && (
        <div className="mt-6 pt-4 border-t-2 neon-border-green">
          <h3 className="text-lg text-emerald-400 mb-2 neon-text-green">History:</h3>
          <ul className="text-sm text-slate-300 space-y-1 max-h-24 overflow-y-auto font-roboto-mono">
            {history.map((item, index) => (
              <li key={index} className="truncate">{item.expression} = {item.result}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Calculator;
