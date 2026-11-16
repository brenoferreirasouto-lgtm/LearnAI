import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Brand, Icon, ThemeToggle, readTheme } from '../App'
import { validateRegistration } from '../../shared/registration.js'
import { accountRequest, type Usuario } from '../lib/accounts'
import { defaultSiteContent, type SiteContent } from '../../shared/site-content'

export default function RegistrationForm({ onCreated, initialMode = 'register', content = defaultSiteContent }: { onCreated: (user: Usuario, login?: boolean) => void; initialMode?: 'register' | 'login'; content?: SiteContent }) {
  const [perfil, setPerfil] = useState<'usuario' | 'admin'>('usuario')
  const [mode, setMode] = useState(initialMode)
  const [senha, setSenha] = useState('')
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
    const data = validateRegistration({ nome: mode === 'login' ? 'Login' : nome, email })
    if (data.error) { setError(data.error); return }
    if (senha.length < 8 || senha.length > 128) { setError('A senha deve ter entre 8 e 128 caracteres.'); return }
    setError(''); setBusy(true)
    try {
      const result = await accountRequest(mode === 'login' ? '/api/login' : '/api/usuarios', 'POST', { ...data, senha, ...(mode === 'login' ? { perfil } : {}) })
      if (!result.usuario) throw new Error('Não foi possível criar o cadastro.')
      setSenha('')
      onCreated(result.usuario, mode === 'login')
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
      <h1>{content.titulo === defaultSiteContent.titulo ? <>Use IA com mais <span>intenção.</span></> : content.titulo}</h1>
      <p>{content.descricao}</p>
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
      <h2>{mode === 'login' ? 'Entre na sua conta' : content.tituloCadastro}</h2><p>{mode === 'login' ? 'Use seu e-mail e senha para continuar seu percurso.' : content.descricaoCadastro}</p>
      <form noValidate onSubmit={submit}>
        {mode === 'login' && <fieldset className="login-role-selector" disabled={busy}>
          <legend>Entrar como</legend>
          <label><input type="radio" name="perfil" value="usuario" checked={perfil === 'usuario'} onChange={() => { setPerfil('usuario'); setError('') }} /> Usuário</label>
          <label><input type="radio" name="perfil" value="admin" checked={perfil === 'admin'} onChange={() => { setPerfil('admin'); setError('') }} /> Administrador</label>
        </fieldset>}
        {mode === 'register' && <><label htmlFor="learner-name">Como podemos chamar você?</label>
        <input id="learner-name" name="name" autoComplete="name" placeholder="Seu nome" required maxLength={60} value={nome} onChange={e => setNome(e.target.value)} /></>}
        <label htmlFor="learner-email">E-mail</label>
        <input id="learner-email" name="email" type="email" autoComplete="username" placeholder="voce@exemplo.com" required maxLength={120} value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="learner-password">Senha</label>
        <input id="learner-password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Pelo menos 8 caracteres" required minLength={8} maxLength={128} value={senha} onChange={e => setSenha(e.target.value)} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary full-button" disabled={busy} type="submit"><Icon name="arrow" size={17} />{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar meu espaço'}</button>
        <button className="text-action" type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setSenha(''); setError('') }}>{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}</button>
        <button className="text-action" type="button" disabled={busy} onClick={() => { setMode('register'); setNome(''); setEmail(''); setSenha(''); setError(''); document.getElementById('learner-name')?.focus() }}>Criar outro cadastro neste dispositivo</button>
      </form>
      <div className="local-notice"><Icon name="lock" size={16} /><span><strong>Seus dados protegidos.</strong> Sua sessão fica salva por 30 dias ou até você sair. Você pode salvar a senha no gerenciador do navegador.</span></div>
      <div className="welcome-meta">Sem integração com IA ou pagamentos</div>
    </div></section>
  </main>
}
