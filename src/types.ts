
export enum AppPhase {
  CALCULATOR_NORMAL,
  CALCULATOR_UNLOCK_PROMPT,
  LLM_CHALLENGE_PROMPT,
  LLM_CHALLENGE_SOLVE,
  SHELL_ACTIVE,
}

export interface CalculatorHistoryEntry {
  expression: string;
  result: string;
}

export interface ShellEntry {
  id: string;
  type: 'command' | 'response' | 'error' | 'system';
  text: string;
  timestamp: string;
}

export interface MathProblem {
  question: string;
  answer: number;
}
