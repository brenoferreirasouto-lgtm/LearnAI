import { useEffect, useRef, useState } from 'react'
import App from '../App'
import RegistrationForm from './RegistrationForm'
import AdminPanel from './AdminPanel'
import { defaultSiteContent } from '../../shared/site-content'
import { accountRequest, type Usuario } from '../lib/accounts'

const sessionChangeKey = 'learnai.session.changed.v1'

function notifySessionChange() {
  try { localStorage.setItem(sessionChangeKey, crypto.randomUUID()) } catch { /* A sessão é gerenciada pelo servidor. */ }
}

export default function AccountGate() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formMode, setFormMode] = useState<'register' | 'login'>('register')
  const [content, setContent] = useState(defaultSiteContent)
  const sessionRequest = useRef(0)

  function activate(usuario: Usuario) {
    sessionRequest.current++
    setUser(usuario)
    setLoading(false)
    notifySessionChange()
  }
  useEffect(() => {
    let active = true
    accountRequest('/api/conteudo').then(data => { if (active && data.conteudo) setContent(data.conteudo) }).catch(() => { /* Os textos padrão continuam disponíveis. */ })
    function refreshSession() {
      const request = ++sessionRequest.current
      const isCurrent = () => active && request === sessionRequest.current
      setLoading(true)
      accountRequest('/api/sessao').then(data => {
        if (isCurrent()) {
          setUser(data.usuario)
          setSuccess('')
          setError('')
        }
      }).catch(err => {
        if (isCurrent()) {
          setUser(null)
          setError(err.message)
        }
      }).finally(() => { if (isCurrent()) setLoading(false) })
    }
    function onStorage(event: StorageEvent) {
      if (event.key === sessionChangeKey && event.storageArea === localStorage) refreshSession()
    }
    window.addEventListener('storage', onStorage)
    refreshSession()
    return () => {
      active = false
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  async function signOut(createAnother = false) {
    try {
      await accountRequest('/api/sessao', 'DELETE')
      setFormMode(createAnother ? 'register' : 'login')
      sessionRequest.current++
      setUser(null); setSuccess(''); setError(''); setLoading(false)
      notifySessionChange()
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível sair.') }
  }
  if (loading) return <p role="status">Carregando cadastro…</p>
  return <>
    {error && <p role="alert">{error}</p>}
    {user?.perfil === 'admin' ? <AdminPanel user={user} onSignOut={() => signOut()} onSaved={setContent} /> : user ? <App key={user.id} account={user} accountNotice={success} onAccountSignOut={() => signOut()} onCreateAnotherAccount={() => signOut(true)} />
      : <RegistrationForm content={content} initialMode={formMode} onCreated={(usuario, login) => { activate(usuario); setError(''); setSuccess(login ? 'Login realizado com sucesso.' : 'Cadastro realizado com sucesso.') }} />}
  </>
}
