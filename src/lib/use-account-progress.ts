import { useEffect, useRef, useState } from 'react'
import {
  accountProgressKey, persistAccountProgress, persistPromptDraftField,
  promptDraftStoragePrefix, readAccountProgress, withProgressLock,
  type ProgressAccount, type ProgressChange,
} from './account-progress'
import { editPromptDraft, type PromptDraftValue } from './prompt-draft'
import type { PromptDraft } from './progress'

export function useAccountProgress(account: ProgressAccount) {
  const [progress, setProgress] = useState(() => readAccountProgress(account))
  const [storageWarning, setStorageWarning] = useState(false)
  const pending = useRef<ProgressChange[]>([])
  const lastSaved = useRef(progress)
  const mounted = useRef(false)

  function persist(locked: boolean) {
    const result = persistAccountProgress(account, pending.current, lastSaved.current, locked)
    lastSaved.current = result.saved ? result.progress : result.base
    if (result.saved) pending.current = []
    if (mounted.current) {
      setProgress(result.progress)
      setStorageWarning(!result.saved)
    }
  }

  useEffect(() => {
    mounted.current = true
    let active = true
    withProgressLock(locked => { if (active) persist(locked) })

    function sync(event: StorageEvent) {
      if (event.storageArea !== localStorage) return
      if (event.key !== null && event.key !== accountProgressKey(account.id) &&
        !event.key.startsWith(promptDraftStoragePrefix(account.id))) return
      withProgressLock(locked => {
        if (!active) return
        if (pending.current.length) {
          persist(locked)
        } else {
          lastSaved.current = readAccountProgress(account)
          setProgress(lastSaved.current)
        }
      })
    }
    window.addEventListener('storage', sync)
    return () => {
      active = false
      mounted.current = false
      window.removeEventListener('storage', sync)
    }
  }, [account])

  function updateProgress(change: ProgressChange) {
    pending.current.push(change)
    withProgressLock(persist)
  }

  function updateDraft(field: keyof PromptDraft, value: PromptDraftValue) {
    const revision = progress.promptDraftRevision
    setProgress(editPromptDraft(field, value, revision))
    withProgressLock(() => {
      const result = persistPromptDraftField(account, field, value, revision)
      lastSaved.current = result.progress
      if (mounted.current) {
        setProgress(pending.current.reduce((current, change) => change(current), result.progress))
        setStorageWarning(!result.saved)
      }
    })
  }

  return { progress, updateProgress, updateDraft, storageWarning }
}
