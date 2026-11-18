export function validateRegistration(input) {
  const nome = typeof input?.nome === 'string' ? input.nome.trim() : ''
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (!nome || nome.length > 60) return { error: 'Informe seu nome (até 60 caracteres).' }
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: 'Informe um e-mail válido.' }
  return { nome, email }
}
