import { useEffect, useRef, useState } from 'react'
import {
  accountProgressKey, persistAccountProgress, readAccountProgress, withProgressLock,
  type ProgressAccount, type ProgressChange,
} from './account-progress'

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
      if (event.storageArea !== localStorage || (event.key !== null && event.key !== accountProgressKey(account.id))) return
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

  return { progress, updateProgress, storageWarning }
}
