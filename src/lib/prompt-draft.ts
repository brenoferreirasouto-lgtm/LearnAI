import { createEmptyProgress, type Progress, type PromptDraft } from './progress'

export type PromptDraftValue = string | ((draft: PromptDraft) => string)

export function editPromptDraft(
  field: keyof PromptDraft,
  value: PromptDraftValue,
  revision: Progress['promptDraftRevision'],
): (current: Progress) => Progress {
  return current => {
    if (current.promptDraftRevision !== revision) return current

    const draft = current.promptDraft
    return {
      ...current,
      promptDraft: { ...draft, [field]: typeof value === 'string' ? value : value(draft) },
    }
  }
}

export function resetProgress(current: Progress, revision: string): Progress {
  return {
    ...createEmptyProgress(),
    profileName: current.profileName,
    profileEmail: current.profileEmail,
    promptDraftRevision: revision,
  }
}
