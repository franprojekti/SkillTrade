"use client";

import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Skill } from "@/types/database";

interface SkillSelectorProps {
  allSkills: Skill[];
  selectedSkillIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  maxSelected?: number;
  onSuggest?: (name: string) => Promise<{ skill?: Skill; error?: string }>;
  disabledSkillIds?: string[];
}

export function SkillSelector({
  allSkills,
  selectedSkillIds,
  onChange,
  placeholder = "Type a skill and press Enter...",
  maxSelected = 10,
  onSuggest,
  disabledSkillIds = [],
}: SkillSelectorProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSkills = allSkills.filter((s) => selectedSkillIds.includes(s.id));
  const atMax = selectedSkillIds.length >= maxSelected;

  function removeSkill(id: string) {
    onChange(selectedSkillIds.filter((s) => s !== id));
  }

  async function handleAdd() {
    const name = input.trim();
    if (!name || loading || atMax) return;

    setError(null);

    // Check for exact match in existing skills
    const existing = allSkills.find(
      (s) =>
        s.canonical_name.toLowerCase() === name.toLowerCase() ||
        s.aliases.some((a) => a.toLowerCase() === name.toLowerCase())
    );

    if (existing) {
      if (disabledSkillIds.includes(existing.id)) {
        setError("This skill is already in your other list.");
        return;
      }
      if (!selectedSkillIds.includes(existing.id)) {
        onChange([...selectedSkillIds, existing.id]);
      }
      setInput("");
      inputRef.current?.focus();
      return;
    }

    // No match — suggest new skill
    if (!onSuggest) return;
    setLoading(true);
    const result = await onSuggest(name);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.skill) {
      onChange([...selectedSkillIds, result.skill.id]);
      setInput("");
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="space-y-3">
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill.id}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-1 text-sm"
            >
              {skill.canonical_name}
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Remove ${skill.canonical_name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {!atMax && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleAdd}
            disabled={!input.trim() || loading}
            aria-label="Add skill"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {atMax && (
        <p className="text-xs text-muted-foreground">
          Maximum of {maxSelected} skills selected.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedSkillIds.length}/{maxSelected} — press Enter or click + to add
      </p>
    </div>
  );
}
