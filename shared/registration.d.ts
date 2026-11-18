export function validateRegistration(input: unknown): { error: string; nome?: never; email?: never } | { nome: string; email: string; error?: never }
