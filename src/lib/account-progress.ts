import {
  archiveStorageKey, createEmptyProgress, decodeProgress, saveProgress, storageKey,
  emptyPromptDraft, type Progress, type PromptDraft,
} from './progress'
import { editPromptDraft, type PromptDraftValue } from './prompt-draft'

export type ProgressAccount = { id: number; nome: string; email: string }
export type ProgressChange = (current: Progress) => Progress

export function accountProgressKey(id: number) {
  return `learnai.progress.account.v1.${id}`
}

const draftFields = Object.keys(emptyPromptDraft) as (keyof PromptDraft)[]

export function promptDraftStoragePrefix(accountId: number) {
  return accountProgressKey(accountId) + '.draft.'
}

function draftFieldKey(accountId: number, revision: string | undefined, field: keyof PromptDraft) {
  return promptDraftStoragePrefix(accountId) + (revision ?? 'legacy') + '.' + field
}

function withStoredDraft(storage: Storage, account: ProgressAccount, progress: Progress): Progress {
  const promptDraft = { ...progress.promptDraft }
  for (const field of draftFields) {
    const value = storage.getItem(draftFieldKey(account.id, progress.promptDraftRevision, field))
    if (value !== null) promptDraft[field] = value
  }
  return { ...progress, promptDraft }
}

export function persistPromptDraftField(
  account: ProgressAccount,
  field: keyof PromptDraft,
  value: PromptDraftValue,
  revision: Progress['promptDraftRevision'],
) {
  const progress = readAccountProgress(account)
  try {
    const storage = window.localStorage
    const raw = storage.getItem(accountProgressKey(account.id))
    if (!decodeProgress(raw)) return { progress, saved: false }
    const next = editPromptDraft(field, value, revision)(progress)
    if (next === progress) return { progress, saved: true }
    storage.setItem(draftFieldKey(account.id, revision, field), next.promptDraft[field])
    return { progress: next, saved: true }
  } catch {
    return { progress, saved: false }
  }
}

function owner(progress: Progress, account: ProgressAccount): Progress {
  return { ...progress, profileName: account.nome, profileEmail: account.email }
}

function readArchive(raw: string | null): Record<string, unknown> {
  try {
    const data: unknown = JSON.parse(raw ?? '{}')
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>
    }
  } catch {
    // An unreadable archive stays in storage.
  }
  return {}
}

function readSources(storage: Storage, account: ProgressAccount) {
  const email = account.email.trim().toLowerCase()
  const activeRaw = storage.getItem(storageKey)
  const archiveRaw = storage.getItem(archiveStorageKey)
  const archive = readArchive(archiveRaw)
  const archivedRaw = Object.prototype.hasOwnProperty.call(archive, email) ? archive[email] : null
  const active = decodeProgress(activeRaw)
  const archived = typeof archivedRaw === 'string' ? decodeProgress(archivedRaw) : null

  return {
    active: email !== '' && active?.profileEmail === email ? active : null,
    archived: email !== '' && archived?.profileEmail === email ? archived : null,
    activeRaw, archiveRaw, archive, email,
  }
}

export function readAccountProgress(account: ProgressAccount): Progress {
  try {
    const storage = window.localStorage
    const raw = storage.getItem(accountProgressKey(account.id))
    const current = decodeProgress(raw)
    if (current) return withStoredDraft(storage, account, owner(current, account))
    if (raw !== null) return owner(createEmptyProgress(), account)
    const { active, archived } = readSources(storage, account)
    return owner(active ?? archived ?? createEmptyProgress(), account)
  } catch {
    return owner(createEmptyProgress(), account)
  }
}

function cleanMigratedSources(
  storage: Storage,
  account: ProgressAccount,
  sources: ReturnType<typeof readSources>,
  confirmed: string,
) {
  const equivalent = (progress: Progress | null) =>
    progress !== null && JSON.stringify(owner(progress, account)) === confirmed

  try {
    if (equivalent(sources.active) && storage.getItem(storageKey) === sources.activeRaw) {
      storage.removeItem(storageKey)
    }
  } catch {
    // The destination was verified. The active source can be cleaned on a later retry.
  }
  try {
    if (equivalent(sources.archived) && storage.getItem(archiveStorageKey) === sources.archiveRaw) {
      delete sources.archive[sources.email]
      storage.setItem(archiveStorageKey, JSON.stringify(sources.archive))
    }
  } catch {
    // The destination was verified. Keep the archived copy until cleanup can be retried.
  }
}

export function withProgressLock(run: (locked: boolean) => void) {
  if (!navigator.locks) {
    run(false)
    return
  }
  let acquired = false
  void navigator.locks.request('learnai-progress', () => {
    acquired = true
    run(true)
  }).catch(() => {
    if (!acquired) run(false)
  })
}

/** Run inside the progress lock. Without a lock, retain shared legacy records. */
export function persistAccountProgress(
  account: ProgressAccount,
  changes: readonly ProgressChange[],
  fallback: Progress,
  locked: boolean,
): { base: Progress; progress: Progress; saved: boolean } {
  let base = fallback
  let progress = fallback
  try {
    const storage = window.localStorage
    const key = accountProgressKey(account.id)
    const raw = storage.getItem(key)
    const current = decodeProgress(raw)
    const sources = raw === null || locked ? readSources(storage, account) : null
    base = owner(current ?? sources?.active ?? sources?.archived ?? createEmptyProgress(), account)
    progress = changes.reduce((value, change) => change(value), base)

    // An unreadable individual record stays available for recovery.
    if (raw !== null && !current) return { base, progress, saved: false }

    const confirmed = JSON.stringify(base)
    if (raw === null && (!saveProgress(base, key) || storage.getItem(key) !== confirmed)) {
      return { base, progress, saved: false }
    }
    if (locked && sources && (raw === null || current)) {
      cleanMigratedSources(storage, account, sources, confirmed)
    }

    const saved = changes.length === 0 || saveProgress(progress, key)
    if (saved && base.promptDraftRevision !== progress.promptDraftRevision) {
      for (const field of draftFields) {
        try {
          storage.removeItem(draftFieldKey(account.id, base.promptDraftRevision, field))
        } catch {
          // The new revision makes the old field inaccessible even if cleanup fails.
        }
      }
    }
    return {
      base: withStoredDraft(storage, account, base),
      progress: withStoredDraft(storage, account, progress),
      saved,
    }
  } catch {
    return { base, progress: changes.reduce((value, change) => change(value), base), saved: false }
  }
}
