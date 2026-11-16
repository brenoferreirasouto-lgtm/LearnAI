import { useEffect, useState, type FormEvent } from 'react'
import { Brand, ThemeToggle, readTheme } from '../App'
import { accountRequest, type Usuario } from '../lib/accounts'
import { defaultSiteContent, type SiteContent } from '../../shared/site-content'

export default function AdminPanel({ user, onSignOut, onSaved }: { user: Usuario; onSignOut: () => void; onSaved: (content: SiteContent) => void }) {
  const [content, setContent] = useState(defaultSiteContent)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    let active = true
    accountRequest('/api/conteudo').then(data => { if (active && data.conteudo) setContent(data.conteudo) })
      .catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('learnai.theme.v1', theme) } catch { /* Tema aplicado nesta visita. */ }
  }, [theme])
  async function save(event: FormEvent) {
    event.preventDefault()
    if (busy || loading) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const data = await accountRequest('/api/admin/conteudo', 'PUT', content)
      if (!data.conteudo) throw new Error('Não foi possível salvar o conteúdo.')
      setContent(data.conteudo); onSaved(data.conteudo)
      setSuccess('Alterações salvas. Os textos já estão disponíveis no site.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }
  const fields: { key: keyof SiteContent; label: string; max: number }[] = [
    { key: 'titulo', label: 'Título principal', max: 100 },
    { key: 'descricao', label: 'Descrição principal', max: 1000 },
    { key: 'tituloCadastro', label: 'Título do cadastro', max: 100 },
    { key: 'descricaoCadastro', label: 'Descrição do cadastro', max: 1000 },
  ]
  return <main className="admin-page">
    <header className="admin-header"><Brand /><ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} /><button className="button button-secondary" onClick={onSignOut}>Sair da administração</button></header>
    <div className="page-title"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Painel do administrador</h1><p>Olá, {user.nome}. Edite os textos da tela inicial do Learn AI.</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {success && <p role="status">{success}</p>}
    {loading ? <p role="status">Carregando conteúdo…</p> : <section className="content-panel admin-editor">
      <h2>Textos do site</h2><p>Ao salvar, as alterações ficam no banco e aparecem na tela de cadastro para todos os visitantes.</p>
      <form onSubmit={save}>
        {fields.map(field => <div key={field.key}><label htmlFor={`admin-${field.key}`}>{field.label}</label>
          <textarea id={`admin-${field.key}`} required maxLength={field.max} rows={field.max === 100 ? 2 : 4} value={content[field.key]} onChange={e => { setContent(current => ({ ...current, [field.key]: e.target.value })); setSuccess('') }} />
        </div>)}
        <button className="button button-primary" disabled={busy} type="submit">{busy ? 'Salvando…' : 'Salvar alterações'}</button>
      </form>
    </section>}
  </main>
}
