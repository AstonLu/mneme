import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The launch cover shows before any script, so the lettering is placed in the page itself.
const lettering = {
  name: 'lettering',
  transformIndexHtml: (html) => html.replace(/<!--(slogan|wordmark)-->/g, (_, name) => readFileSync(`src/${name}.svg`, 'utf8')),
}

export default defineConfig({
  plugins: [react(), lettering],
})
