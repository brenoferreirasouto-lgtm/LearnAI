import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Brand, Icon, ThemeToggle, readTheme } from '../App'
import { validateRegistration } from '../../shared/registration.js'
import { accountRequest, type Usuario } from '../lib/accounts'

export default function RegistrationForm({ onCreated }: { onCreated: (user: Usuario) => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('learnai.theme.v1', theme) } catch { /* O tema permanece aplicado nesta visita. */ }
  }, [theme])
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
  return <main className="welcome-page" style={{
    '--welcome-background-image': `url("${import.meta.env.BASE_URL}assets/learnai-hero-desktop.png")`,
  } as CSSProperties}>
    <section className="welcome-story">
      <Brand />
      <div className="welcome-copy">
      <span className="eyebrow eyebrow-light">Aprender. Praticar. Criar.</span>
      <h1>Use IA com mais <span>intenção.</span></h1>
      <p>Uma jornada prática para fazer perguntas melhores, avaliar respostas com cuidado e transformar conhecimento em projetos seus.</p>
      <div className="welcome-principles">
        <span><Icon name="shield" size={17} /> Pensamento crítico</span>
        <span><Icon name="light" size={17} /> Autoria humana</span>
      </div>
    </div>
    <div className="story-foot">APRENDIZAGEM APLICADA <span>•</span> IA RESPONSÁVEL</div>
    </section>
    <section className="welcome-form-wrap">
      <ThemeToggle theme={theme} onToggle={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} />
      <div className="welcome-form">
      <span className="step-label">SEU ESPAÇO DE APRENDIZAGEM</span>
      <h2>Comece por aqui</h2><p>Cadastre seu nome e e-mail para começar.</p>
      <form noValidate onSubmit={submit}>
        <label htmlFor="learner-name">Como podemos chamar você?</label>
        <input id="learner-name" autoComplete="name" placeholder="Seu nome" required maxLength={60} value={nome} onChange={e => setNome(e.target.value)} />
        <label htmlFor="learner-email">E-mail</label>
        <input id="learner-email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required maxLength={120} value={email} onChange={e => setEmail(e.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary full-button" disabled={busy} type="submit"><Icon name="arrow" size={17} />{busy ? 'Cadastrando…' : 'Criar meu espaço'}</button>
        <button className="text-action" type="button" disabled={busy} onClick={() => { setNome(''); setEmail(''); setError(''); document.getElementById('learner-name')?.focus() }}>Criar outro cadastro neste dispositivo</button>
      </form>
      <div className="local-notice"><Icon name="lock" size={16} /><span><strong>Cadastro sem senha.</strong> Seu nome e e-mail ficam salvos no servidor.</span></div>
      <div className="welcome-meta">Sem integração com IA ou pagamentos</div>
    </div></section>
  </main>
}
