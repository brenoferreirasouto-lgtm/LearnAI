import { defineConfig, devices } from '@playwright/test'

const port = 4173
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`

// Testes de sistema (ponta a ponta) do Learn AI.
// Por padrão gera o build e sobe `vite preview`; defina E2E_BASE_URL
// para rodar os mesmos testes contra o deploy publicado.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'pt-BR',
    // Com movimento reduzido a splash de abertura é pulada automaticamente.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm preview --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
