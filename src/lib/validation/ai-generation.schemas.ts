import { z } from "zod";

import { ValidationConstraints } from "../../types";

/**
 * Validation schema for AI flashcard generation request
 */
export const AIGenerateRequestSchema = z.object({
  text: z
    .string()
    .min(
      ValidationConstraints.aiGeneration.textMinLength,
      `Text must be at least ${ValidationConstraints.aiGeneration.textMinLength} characters`
    )
    .max(
      ValidationConstraints.aiGeneration.textMaxLength,
      `Text must not exceed ${ValidationConstraints.aiGeneration.textMaxLength} characters`
    )
    .trim(),
  deck_id: z.number().int().positive("Deck ID must be a positive integer"),
  max_cards: z
    .number()
    .int()
    .min(
      ValidationConstraints.aiGeneration.maxCardsMin,
      `Must generate at least ${ValidationConstraints.aiGeneration.maxCardsMin} card`
    )
    .max(
      ValidationConstraints.aiGeneration.maxCardsMax,
      `Cannot generate more than ${ValidationConstraints.aiGeneration.maxCardsMax} cards`
    )
    .default(ValidationConstraints.aiGeneration.maxCardsDefault)
    .optional(),
});

export type AIGenerateRequestInput = z.infer<typeof AIGenerateRequestSchema>;
