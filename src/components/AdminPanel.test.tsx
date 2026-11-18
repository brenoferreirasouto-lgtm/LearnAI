import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import AdminPanel from './AdminPanel'
import { defaultSiteContent } from '../../shared/site-content'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('carrega textos, edita e salva as alterações na API administrativa', async () => {
  const saved = vi.fn()
  const fetch = vi.fn().mockImplementation(async (_path, options) => ({ ok: true, json: async () => ({ conteudo: options.method === 'PUT' ? JSON.parse(options.body) : defaultSiteContent }) }))
  vi.stubGlobal('fetch', fetch)
  render(<AdminPanel user={{ id: 1, nome: 'Admin', email: 'admin@example.com', criado_em: '', perfil: 'admin' }} onSignOut={vi.fn()} onSaved={saved} />)
  fireEvent.change(await screen.findByLabelText('Título principal'), { target: { value: 'Aprenda IA hoje' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect((await screen.findByRole('status')).textContent).toContain('Alterações salvas')
  expect(saved).toHaveBeenCalledWith({ ...defaultSiteContent, titulo: 'Aprenda IA hoje' })
  expect(fetch).toHaveBeenLastCalledWith('/api/admin/conteudo', expect.objectContaining({ method: 'PUT' }))
})
