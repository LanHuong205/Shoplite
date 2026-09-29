import { copyFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDirectory = path.join(root, 'public')

await mkdir(publicDirectory, { recursive: true })
await Promise.all(['index.html', 'styles.css', 'script.js'].map((file) =>
  copyFile(path.join(root, file), path.join(publicDirectory, file))
))