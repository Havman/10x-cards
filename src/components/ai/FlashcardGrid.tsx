/**
 * FlashcardGrid Component
 * Displays generated AI flashcards in a 3-column grid with selection and actions
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AIGeneratedFlashcard } from "@/types";

interface FlashcardGridProps {
  flashcards: AIGeneratedFlashcard[];
  deckId: number;
  onCardsChange?: (cards: AIGeneratedFlashcard[]) => void;
}

export default function FlashcardGrid({ flashcards, deckId, onCardsChange }: FlashcardGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedFront, setEditedFront] = useState("");
  const [editedBack, setEditedBack] = useState("");
  const [cards, setCards] = useState<AIGeneratedFlashcard[]>(flashcards);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Reset cards when flashcards prop changes (new generation)
  useEffect(() => {
    setCards(flashcards);
    setSelectedIds(new Set());
    setEditingId(null);
  }, [flashcards]);

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cards.map((card) => card.id)));
    }
  };

  const handleEdit = (id: number) => {
    const card = cards.find((c) => c.id === id);
    if (card) {
      setEditingId(id);
      setEditedFront(card.front);
      setEditedBack(card.back);
    }
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;

    const updatedCards = cards.map((card) =>
      card.id === editingId ? { ...card, front: editedFront, back: editedBack } : card
    );
    setCards(updatedCards);
    onCardsChange?.(updatedCards);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedFront("");
    setEditedBack("");
  };

  const handleAccept = async (id: number) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    // Add to saving state
    setSavingIds((prev) => new Set(prev).add(id));
    setError(null);

    try {
      // Save to database
      const response = await fetch("/api/flashcards/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deck_id: deckId,
          front: card.front,
          back: card.back,
          source: "ai",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save flashcard");
      }

      // Remove from drafts on success
      const updatedCards = cards.filter((c) => c.id !== id);
      setCards(updatedCards);
      onCardsChange?.(updatedCards);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcard");
    } finally {
      // Remove from saving state
      setSavingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleReject = (id: number) => {
    const updatedCards = cards.filter((card) => card.id !== id);
    setCards(updatedCards);
    onCardsChange?.(updatedCards);
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleBulkAccept = async () => {
    const selectedCards = cards.filter((card) => selectedIds.has(card.id));
    if (selectedCards.length === 0) return;

    // Add all selected to saving state
    setSavingIds(new Set(selectedIds));
    setError(null);

    try {
      // Save all selected cards to database
      const savePromises = selectedCards.map((card) =>
        fetch("/api/flashcards/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deck_id: deckId,
            front: card.front,
            back: card.back,
            source: "ai",
          }),
        }).then((res) => res.json())
      );

      const results = await Promise.all(savePromises);

      // Check if any failed
      const failedCount = results.filter((result) => !result.success).length;
      if (failedCount > 0) {
        throw new Error(`Failed to save ${failedCount} flashcard(s)`);
      }

      // Remove all selected cards from drafts on success
      const updatedCards = cards.filter((card) => !selectedIds.has(card.id));
      setCards(updatedCards);
      onCardsChange?.(updatedCards);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcards");
    } finally {
      setSavingIds(new Set());
    }
  };

  const handleBulkReject = () => {
    const updatedCards = cards.filter((card) => !selectedIds.has(card.id));
    setCards(updatedCards);
    onCardsChange?.(updatedCards);
    setSelectedIds(new Set());
  };

  // Don't render anything if there are no cards left
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.size === cards.length && cards.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300"
            aria-label="Select all flashcards"
          />
          <span className="text-sm font-medium">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
          </span>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkAccept} disabled={savingIds.size > 0}>
              {savingIds.size > 0 ? "Saving..." : `Accept Selected (${selectedIds.size})`}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkReject} disabled={savingIds.size > 0}>
              Reject Selected ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const isEditing = editingId === card.id;

          return (
            <Card key={card.id} className="relative">
              <CardContent className="p-4">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(card.id)}
                    onChange={() => toggleSelection(card.id)}
                    className="h-4 w-4 rounded border-gray-300"
                    aria-label={`Select flashcard ${card.id}`}
                    disabled={isEditing}
                  />
                </div>

                {/* Card Content */}
                {isEditing ? (
                  <div className="space-y-4 mt-6">
                    {/* Edit Front */}
                    <div className="space-y-2">
                      <Label htmlFor={`front-${card.id}`}>Front</Label>
                      <Textarea
                        id={`front-${card.id}`}
                        value={editedFront}
                        onChange={(e) => setEditedFront(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Edit Back */}
                    <div className="space-y-2">
                      <Label htmlFor={`back-${card.id}`}>Back</Label>
                      <Textarea
                        id={`back-${card.id}`}
                        value={editedBack}
                        onChange={(e) => setEditedBack(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-6">
                    {/* Front */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Front</div>
                      <p className="text-sm">{card.front}</p>
                    </div>

                    {/* Back */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">Back</div>
                      <p className="text-sm">{card.back}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(card.id)}
                        disabled={savingIds.has(card.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAccept(card.id)}
                        disabled={savingIds.has(card.id)}
                      >
                        {savingIds.has(card.id) ? "Saving..." : "Accept"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReject(card.id)}
                        disabled={savingIds.has(card.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
