/**
 * Types for AI Generation Form component
 */

/**
 * Props for the AIGenerationForm component
 */
export interface AIGenerationFormProps {
  deckId: number;
}

/**
 * ViewModel for managing the form's state
 */
export interface AIGenerationFormViewModel {
  text: string;
  maxCards: number;
  usage: {
    dailyLimit: number;
    usedToday: number;
    remaining: number;
    resetAt: string;
  } | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: {
    text?: string;
    maxCards?: string;
  };
}
