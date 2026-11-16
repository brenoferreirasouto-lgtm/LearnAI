import { openDatabase } from './database.js'
import { createApi } from './routes.js'

export function registrationApi() {
  const configure = (server) => {
    const store = openDatabase()
    server.middlewares.use(createApi(store))
    server.httpServer?.once('close', () => store.db.close())
  }
  return { name: 'learnai-registration-api', configureServer: configure, configurePreviewServer: configure }
}
