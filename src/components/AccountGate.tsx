import { useEffect, useState } from 'react'
import App from '../App'
import RegistrationForm from './RegistrationForm'
import { accountRequest, type Usuario } from '../lib/accounts'
import { createEmptyProgress, readProgress, saveProgress } from '../lib/progress'

export default function AccountGate() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formMode, setFormMode] = useState<'register' | 'login'>('register')
  function activate(usuario: Usuario) {
    const previous = readProgress()
    const progress = previous.profileEmail === usuario.email ? previous : createEmptyProgress()
    saveProgress({ ...progress, profileName: usuario.nome, profileEmail: usuario.email })
    try { localStorage.removeItem('learnai.session.signed-out.v1') } catch { /* A sessão permanece no servidor. */ }
    setUser(usuario)
  }
  useEffect(() => {
    let active = true
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
    {user ? <App key={user.id} account={user} accountNotice={success} onAccountSignOut={() => signOut()} onCreateAnotherAccount={() => signOut(true)} />
      : <RegistrationForm initialMode={formMode} onCreated={(usuario, login) => { activate(usuario); setError(''); setSuccess(login ? 'Login realizado com sucesso.' : 'Cadastro realizado com sucesso.') }} />}
  </>
}
