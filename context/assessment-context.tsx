"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FormValues } from "@/lib/types";
import { EMPTY_DRAFT, clearDraft, loadDraft, saveDraft, type PersistedDraft } from "@/lib/storage";

interface AssessmentContextValue {
  draft: PersistedDraft;
  hydrated: boolean;
  resetId: number;
  setValues: (values: FormValues) => void;
  setProgress: (step: number, maxStep: number) => void;
  markAssessed: (assessedAt: string) => void;
  reset: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

function isPristine(draft: PersistedDraft) {
  return (
    draft.assessedAt == null &&
    draft.step === 1 &&
    draft.maxStep === 1 &&
    JSON.stringify(draft.values) === JSON.stringify(EMPTY_DRAFT.values)
  );
}

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<PersistedDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [resetId, setResetId] = useState(0);

  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isPristine(draft)) {
      clearDraft();
      return;
    }
    saveDraft(draft);
  }, [draft, hydrated]);

  const setValues = useCallback((values: FormValues) => {
    setDraft((current) => ({ ...current, values }));
  }, []);
  const setProgress = useCallback((step: number, maxStep: number) => {
    setDraft((current) => ({
      ...current,
      step,
      maxStep: Math.max(current.maxStep, maxStep, step),
    }));
  }, []);
  const markAssessed = useCallback((assessedAt: string) => {
    setDraft((current) => ({ ...current, assessedAt }));
  }, []);
  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setResetId((current) => current + 1);
  }, []);

  const value = useMemo<AssessmentContextValue>(
    () => ({ draft, hydrated, resetId, setValues, setProgress, markAssessed, reset }),
    [draft, hydrated, markAssessed, reset, resetId, setProgress, setValues],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const value = useContext(AssessmentContext);
  if (!value) throw new Error("useAssessment must be used within AssessmentProvider");
  return value;
}
