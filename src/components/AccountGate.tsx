import { useEffect, useState } from 'react'
import App from '../App'
import RegistrationForm from './RegistrationForm'
import AdminPanel from './AdminPanel'
import { defaultSiteContent } from '../../shared/site-content'
import { accountRequest, type Usuario } from '../lib/accounts'

export default function AccountGate() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formMode, setFormMode] = useState<'register' | 'login'>('register')
  const [content, setContent] = useState(defaultSiteContent)
  function activate(usuario: Usuario) {
    try { localStorage.removeItem('learnai.session.signed-out.v1') } catch { /* A sessão permanece no servidor. */ }
    setUser(usuario)
  }
  useEffect(() => {
    let active = true
    accountRequest('/api/conteudo').then(data => { if (active && data.conteudo) setContent(data.conteudo) }).catch(() => { /* Os textos padrão continuam disponíveis. */ })
    accountRequest('/api/sessao').then(data => {
      if (active && data.usuario) activate(data.usuario)
    }).catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function signOut(createAnother = false) {
    try {
      await accountRequest('/api/sessao', 'DELETE')
      setFormMode(createAnother ? 'register' : 'login')
      setUser(null); setSuccess(''); setError('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível sair.') }
  }
  if (loading) return <p role="status">Carregando cadastro…</p>
  return <>
    {error && <p role="alert">{error}</p>}
    {user?.perfil === 'admin' ? <AdminPanel user={user} onSignOut={() => signOut()} onSaved={setContent} /> : user ? <App key={user.id} account={user} accountNotice={success} onAccountSignOut={() => signOut()} onCreateAnotherAccount={() => signOut(true)} />
      : <RegistrationForm content={content} initialMode={formMode} onCreated={(usuario, login) => { activate(usuario); setError(''); setSuccess(login ? 'Login realizado com sucesso.' : 'Cadastro realizado com sucesso.') }} />}
  </>
}
