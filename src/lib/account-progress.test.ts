import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  accountProgressKey, persistAccountProgress, readAccountProgress,
  type ProgressAccount, type ProgressChange,
} from './account-progress'
import { archiveStorageKey, createEmptyProgress, storageKey } from './progress'

const ana = { id: 1, nome: 'Ana', email: 'ana@example.com' }
const bruno = { id: 2, nome: 'Bruno', email: 'bruno@example.com' }
const key = accountProgressKey(ana.id)
const snapshot = (account: ProgressAccount, xp: number) => JSON.stringify({
  ...createEmptyProgress(), profileName: account.nome, profileEmail: account.email, xp,
})

function migrate(account = ana, changes: readonly ProgressChange[] = [], locked = true) {
  return persistAccountProgress(account, changes, readAccountProgress(account), locked)
}

function archived(records: Record<string, string>) {
  localStorage.setItem(archiveStorageKey, JSON.stringify(records))
}

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('progresso individual e migração', () => {
  it('migra o ativo da conta e restaura o arquivo da outra em alternâncias repetidas', () => {
    localStorage.setItem(storageKey, snapshot(ana, 25))
    archived({ [bruno.email]: snapshot(bruno, 50) })

    const accountOrder = [ana, bruno, ana, bruno]
    expect(accountOrder.map(account => migrate(account).progress.xp)).toEqual([25, 50, 25, 50])
    expect(localStorage.getItem(key)).toBe(snapshot(ana, 25))
    expect(localStorage.getItem(accountProgressKey(bruno.id))).toBe(snapshot(bruno, 50))
    expect(localStorage.getItem(storageKey)).toBeNull()
    expect(localStorage.getItem(archiveStorageKey)).toBe('{}')
    expect(readAccountProgress({ ...ana, email: 'novo@example.com' }).xp).toBe(25)
  })

  it('prioriza o ativo correspondente e preserva uma cópia divergente no arquivo', () => {
    localStorage.setItem(storageKey, snapshot(ana, 25))
    archived({ [ana.email]: snapshot(ana, 10) })

    expect(migrate().progress.xp).toBe(25)
    expect(migrate().progress.xp).toBe(25)
    expect(localStorage.getItem(storageKey)).toBeNull()
    expect(localStorage.getItem(archiveStorageKey)).toBe(JSON.stringify({ [ana.email]: snapshot(ana, 10) }))
  })

  it('prioriza o registro individual existente e preserva os legados divergentes', () => {
    localStorage.setItem(key, snapshot(ana, 90))
    localStorage.setItem(storageKey, snapshot(ana, 25))
    archived({ [ana.email]: snapshot(ana, 50) })

    expect(migrate().progress.xp).toBe(90)
    expect(localStorage.getItem(storageKey)).toBe(snapshot(ana, 25))
    expect(localStorage.getItem(archiveStorageKey)).toBe(JSON.stringify({ [ana.email]: snapshot(ana, 50) }))
  })

  it('preserva o ativo sem titular, o arquivo com metadados incompatíveis e outras contas', () => {
    const unknown = snapshot({ ...ana, email: '' }, 25)
    localStorage.setItem(storageKey, unknown)
    const archive = { [ana.email]: snapshot(bruno, 50), [bruno.email]: snapshot(bruno, 70) }
    archived(archive)

    expect(migrate().progress.xp).toBe(0)
    expect(localStorage.getItem(storageKey)).toBe(unknown)
    expect(localStorage.getItem(archiveStorageKey)).toBe(JSON.stringify(archive))
  })

  it.each(['error', 'unconfirmed'])('preserva as origens com destino %s e retoma sem duplicar', mode => {
    const legacy = snapshot(ana, 25)
    localStorage.setItem(storageKey, legacy)
    archived({ [ana.email]: legacy, [bruno.email]: snapshot(bruno, 50) })
    const write = Storage.prototype.setItem
    const failed = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, k, value) {
      if (k !== key) return write.call(this, k, value)
      if (mode === 'error') throw new Error('Falha na gravação')
    })

    expect(migrate().saved).toBe(false)
    expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem(storageKey)).toBe(legacy)
    expect(JSON.parse(localStorage.getItem(archiveStorageKey)!)[ana.email]).toBe(legacy)
    failed.mockRestore()

    expect(migrate().saved).toBe(true)
    expect(migrate().progress.xp).toBe(25)
    expect(localStorage.getItem(key)).toBe(legacy)
    expect(localStorage.getItem(storageKey)).toBeNull()
    expect(JSON.parse(localStorage.getItem(archiveStorageKey)!)).toEqual({ [bruno.email]: snapshot(bruno, 50) })
  })

  it('retoma a limpeza após interrupção entre a gravação e a remoção do ativo', () => {
    const legacy = snapshot(ana, 25)
    localStorage.setItem(storageKey, legacy)
    const failed = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Limpeza indisponível')
    })

    expect(migrate().saved).toBe(true)
    expect(localStorage.getItem(key)).toBe(legacy)
    expect(localStorage.getItem(storageKey)).toBe(legacy)
    failed.mockRestore()
    expect(migrate().saved).toBe(true)
    expect(localStorage.getItem(storageKey)).toBeNull()
    expect(migrate().progress.xp).toBe(25)
  })

  it('retoma a limpeza do arquivo e preserva as outras entradas', () => {
    const legacy = snapshot(ana, 25)
    const other = snapshot(bruno, 50)
    archived({ [ana.email]: legacy, [bruno.email]: other })
    const write = Storage.prototype.setItem
    const failed = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(this: Storage, k, value) {
      if (k === archiveStorageKey) throw new Error('Alteração do arquivo indisponível')
      write.call(this, k, value)
    })

    expect(migrate().saved).toBe(true)
    expect(localStorage.getItem(key)).toBe(legacy)
    expect(JSON.parse(localStorage.getItem(archiveStorageKey)!)).toEqual({ [ana.email]: legacy, [bruno.email]: other })
    failed.mockRestore()
    expect(migrate().saved).toBe(true)
    expect(JSON.parse(localStorage.getItem(archiveStorageKey)!)).toEqual({ [bruno.email]: other })
  })

  it('mantém as origens quando a aba não consegue coordenar a limpeza', () => {
    localStorage.setItem(storageKey, snapshot(ana, 25))
    archived({ [ana.email]: snapshot(ana, 25) })
    expect(migrate(ana, [], false).progress.xp).toBe(25)
    expect(localStorage.getItem(storageKey)).toBe(snapshot(ana, 25))
    expect(JSON.parse(localStorage.getItem(archiveStorageKey)!)[ana.email]).toBe(snapshot(ana, 25))
  })

  it('reaplica uma atualização não persistida sobre a última atividade gravada', () => {
    localStorage.setItem(key, snapshot(ana, 25))
    const addFirst: ProgressChange = progress => ({
      ...progress, completedLessons: [...progress.completedLessons, 'generative-ai'],
    })
    const addSecond: ProgressChange = progress => ({
      ...progress, completedLessons: [...progress.completedLessons, 'prompting'],
    })
    const failed = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Sem espaço') })
    expect(migrate(ana, [addFirst]).saved).toBe(false)
    failed.mockRestore()
    expect(migrate(ana, [addSecond]).saved).toBe(true)
    expect(migrate(ana, [addFirst]).progress.completedLessons).toEqual(['prompting', 'generative-ai'])
  })
})
