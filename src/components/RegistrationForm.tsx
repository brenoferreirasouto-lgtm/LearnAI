import { useState, type FormEvent } from 'react'
import { validateRegistration } from '../../shared/registration.js'
import { accountRequest, type Usuario } from '../lib/accounts'

export default function RegistrationForm({ onCreated }: { onCreated: (user: Usuario) => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const data = validateRegistration({ nome, email })
    if (data.error) { setError(data.error); return }
    setError(''); setBusy(true)
    try {
      const result = await accountRequest('/api/usuarios', 'POST', data)
      if (!result.usuario) throw new Error('Não foi possível criar o cadastro.')
      onCreated(result.usuario)
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível cadastrar.') }
    finally { setBusy(false) }
  }
  return <main className="welcome-page">
    <section className="welcome-story"><div className="welcome-copy">
      <span className="eyebrow">LEARN AI</span>
      <h1>Use IA com mais <span>intenção.</span></h1>
      <p>Aprenda, pratique e crie seu próprio percurso.</p>
    </div></section>
    <section className="welcome-form-wrap"><div className="welcome-form">
      <h2>Comece por aqui</h2><p>Cadastre seu nome e e-mail para começar.</p>
      <form noValidate onSubmit={submit}>
        <label htmlFor="learner-name">Como podemos chamar você?</label>
        <input id="learner-name" autoComplete="name" required maxLength={60} value={nome} onChange={e => setNome(e.target.value)} />
        <label htmlFor="learner-email">E-mail</label>
        <input id="learner-email" type="email" autoComplete="email" required maxLength={120} value={email} onChange={e => setEmail(e.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary full-button" disabled={busy} type="submit">{busy ? 'Cadastrando…' : 'Criar meu espaço'}</button>
        <button className="text-action" type="button" disabled={busy} onClick={() => { setNome(''); setEmail(''); setError(''); document.getElementById('learner-name')?.focus() }}>Criar outro cadastro neste dispositivo</button>
      </form>
      <p className="local-notice">Seu nome e e-mail ficam salvos no servidor. Cadastro sem senha.</p>
    </div></section>
  </main>
}
