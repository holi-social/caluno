'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Plus, X } from 'lucide-react';
import { RULE_LOCATIONS, RULE_TRIGGER_TYPES } from '@/lib/trigger-options';

type Rule = { id: string; trigger: string; location: string };

function makeRule(): Rule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    trigger: 'join',
    location: 'current',
  };
}

export function AppliedToSection({
  onChange,
  hasError,
}: {
  appliedTo: string[];
  onChange: (next: string[]) => void;
  hasError: boolean;
}) {
  const [rules, setRules] = useState<Rule[]>(() => [makeRule()]);

  // Sync the default rule to parent on mount so save validation passes.
  useEffect(() => {
    onChange(rules.map((r) => `${r.trigger}:${r.location}`));
    // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
  }, []);

  function commit(next: Rule[]) {
    setRules(next);
    onChange(next.map((r) => `${r.trigger}:${r.location}`));
  }

  function addRule() {
    commit([...rules, makeRule()]);
  }

  function updateRule(id: string, updates: Partial<Rule>) {
    commit(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function removeRule(id: string) {
    if (rules.length <= 1) return;
    commit(rules.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Anwendungsregeln</h2>
      <p className="text-muted-foreground mt-6 text-sm font-semibold uppercase tracking-wider">
        Freiwillige müssen ausfüllen, wenn:
      </p>
      <div className="mt-4 space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-1">
            <Select
              value={rule.trigger}
              onValueChange={(v) => updateRule(rule.id, { trigger: v })}
            >
              <SelectTrigger size="default" className="h-10 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TRIGGER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground px-1 text-sm">bei</span>
            <Select
              value={rule.location}
              onValueChange={(v) => updateRule(rule.id, { location: v })}
            >
              <SelectTrigger size="default" className="h-10 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_LOCATIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-10 shrink-0"
              onClick={() => removeRule(rule.id)}
              disabled={rules.length <= 1}
              aria-label="Regel entfernen"
              title="Regel entfernen"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="md" className="mt-4" onClick={addRule}>
        <Plus className="mr-1.5 size-4" />
        Regel hinzufügen
      </Button>
      {hasError && (
        <p className="text-destructive mt-1.5 text-sm">
          Bitte fügen Sie mindestens eine Regel hinzu.
        </p>
      )}
    </div>
  );
}
