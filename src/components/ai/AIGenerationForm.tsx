/**
 * AIGenerationForm Component
 * Form for generating flashcards using AI from raw text
 */

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FlashcardGrid from "./FlashcardGrid";
import type { AIGenerationFormProps } from "./types";
import type { AIUsageResponse, ApiSuccessResponse, AIGenerateResponse } from "@/types";
import { ValidationConstraints } from "@/types";

export default function AIGenerationForm({ deckId }: AIGenerationFormProps) {
  const [text, setText] = useState("");
  const [maxCardsInput, setMaxCardsInput] = useState<string>(
    ValidationConstraints.aiGeneration.maxCardsDefault.toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AIUsageResponse | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [generatedCards, setGeneratedCards] = useState<AIGenerateResponse | null>(null);

  // Fetch AI usage on component mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch("/api/ai/usage");
        const data: ApiSuccessResponse<AIUsageResponse> = await response.json();

        if (response.ok && data.success) {
          setUsage(data.data);
        }
      } catch {
        // Silently fail - usage display is not critical
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, []);

  // Validation
  const textLength = text.length;
  const isTextValid =
    textLength >= ValidationConstraints.aiGeneration.textMinLength &&
    textLength <= ValidationConstraints.aiGeneration.textMaxLength;

  // Parse maxCards from input string
  const maxCards = parseInt(maxCardsInput) || 0;
  const isMaxCardsValid =
    maxCards >= ValidationConstraints.aiGeneration.maxCardsMin &&
    maxCards <= ValidationConstraints.aiGeneration.maxCardsMax;

  const textError =
    !isTextValid && textLength > 0
      ? textLength < ValidationConstraints.aiGeneration.textMinLength
        ? `Text must be at least ${ValidationConstraints.aiGeneration.textMinLength} characters (currently ${textLength})`
        : `Text must not exceed ${ValidationConstraints.aiGeneration.textMaxLength} characters (currently ${textLength})`
      : null;

  const maxCardsError = !isMaxCardsValid
    ? `Must be between ${ValidationConstraints.aiGeneration.maxCardsMin} and ${ValidationConstraints.aiGeneration.maxCardsMax}`
    : null;

  const hasUsageRemaining = !usage || usage.remaining > 0;
  const canSubmit = isTextValid && isMaxCardsValid && !isLoading && hasUsageRemaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    // Reset previous generated cards before new generation
    setGeneratedCards(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          deck_id: deckId,
          max_cards: maxCards,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate flashcards");
      }

      // Store generated cards to display below the form
      setGeneratedCards(data.data);

      // Scroll to results
      setTimeout(() => {
        document.getElementById("generated-cards")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Usage Alert */}
      {!usageLoading && usage && (
        <Alert variant={usage.remaining === 0 ? "destructive" : "default"}>
          <AlertTitle className="flex items-center gap-2">
            {usage.remaining === 0 ? "⚠️ Daily Limit Reached" : "✨ AI Generation Available"}
          </AlertTitle>
          <AlertDescription>
            {usage.remaining === 0 ? (
              <>
                You&apos;ve used all {usage.daily_limit} of your daily AI generations. Your limit will reset at{" "}
                {new Date(usage.reset_at).toLocaleTimeString()}.
              </>
            ) : (
              <>
                You have <strong>{usage.remaining}</strong> of {usage.daily_limit} AI generations remaining today.
                {usage.used_today > 0 && ` You've used ${usage.used_today} so far.`}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>
            Paste the text you want to convert into flashcards. The AI will analyze it and create relevant questions and
            answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="text">Text to Convert</Label>
              <Textarea
                id="text"
                data-test-id="ai-text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here (minimum 1000 characters)..."
                className="min-h-[200px] max-h-[400px]"
                aria-describedby={textError ? "text-error" : undefined}
                aria-invalid={!!textError}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={textLength > 0 && !isTextValid ? "text-destructive" : "text-muted-foreground"}>
                  {textLength} / {ValidationConstraints.aiGeneration.textMaxLength} characters
                  {textLength < ValidationConstraints.aiGeneration.textMinLength &&
                    ` (${ValidationConstraints.aiGeneration.textMinLength - textLength} more needed)`}
                </span>
              </div>
              {textError && (
                <p id="text-error" className="text-sm text-destructive" role="alert">
                  {textError}
                </p>
              )}
            </div>

            {/* Max Cards Input */}
            <div className="space-y-2">
              <Label htmlFor="maxCards">Maximum Number of Cards</Label>
              <Input
                type="number"
                id="maxCards"
                data-test-id="ai-max-cards-input"
                value={maxCardsInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string (for backspace) or valid numbers
                  if (value === "" || /^\d+$/.test(value)) {
                    setMaxCardsInput(value);
                  }
                }}
                onBlur={() => {
                  // On blur, if empty or invalid, set to default
                  if (
                    maxCardsInput === "" ||
                    parseInt(maxCardsInput) < ValidationConstraints.aiGeneration.maxCardsMin
                  ) {
                    setMaxCardsInput(ValidationConstraints.aiGeneration.maxCardsDefault.toString());
                  }
                }}
                min={ValidationConstraints.aiGeneration.maxCardsMin}
                max={ValidationConstraints.aiGeneration.maxCardsMax}
                aria-describedby={maxCardsError ? "maxCards-error" : "maxCards-help"}
                aria-invalid={!!maxCardsError}
              />
              <p id="maxCards-help" className="text-xs text-muted-foreground">
                The AI will generate up to this many flashcards from your text.
              </p>
              {maxCardsError && (
                <p id="maxCards-error" className="text-sm text-destructive" role="alert">
                  {maxCardsError}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4" role="alert">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={!canSubmit} className="w-full" size="lg" data-test-id="ai-generate-button">
              {isLoading ? (
                <>
                  <span className="mr-2">⏳</span>
                  Generating Flashcards...
                </>
              ) : (
                "Generate Flashcards"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Flashcards Display */}
      {generatedCards && (
        <div id="generated-cards" className="mt-8" data-test-id="generated-cards-container">
          <h2 className="text-2xl font-bold mb-4">Generated Flashcards ({generatedCards.cards_generated})</h2>
          <FlashcardGrid flashcards={generatedCards.flashcards} deckId={deckId} />
        </div>
      )}
    </div>
  );
}
