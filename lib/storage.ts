import { EMPTY_FORM } from "./validation";
import type { FormValues } from "./types";

export const STORAGE_KEY = "ai-automation-scorecard:v1";

export interface PersistedDraft {
  version: 1;
  values: FormValues;
  step: number;
  maxStep: number;
  assessedAt: string | null;
}

export const EMPTY_DRAFT: PersistedDraft = {
  version: 1,
  values: EMPTY_FORM,
  step: 1,
  maxStep: 1,
  assessedAt: null,
};

function isFormValues(value: unknown): value is FormValues {
  if (!value || typeof value !== "object") return false;
  return Object.keys(EMPTY_FORM).every((key) => typeof (value as FormValues)[key as keyof FormValues] === "string");
}

export function loadDraft(): PersistedDraft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
    if (parsed.version !== 1 || !isFormValues(parsed.values)) return EMPTY_DRAFT;
    return {
      version: 1,
      values: { ...EMPTY_FORM, ...parsed.values },
      step: clampStep(parsed.step),
      maxStep: clampStep(parsed.maxStep),
      assessedAt: typeof parsed.assessedAt === "string" ? parsed.assessedAt : null,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function saveDraft(draft: PersistedDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function clampStep(value: unknown): number {
  const step = typeof value === "number" ? value : 1;
  if (step < 1 || step > 4) return 1;
  return step;
}
