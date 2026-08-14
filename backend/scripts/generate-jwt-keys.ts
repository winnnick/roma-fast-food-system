import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const outputDir = resolve(process.cwd(), process.argv[2] ?? '.secrets/dev');
mkdirSync(outputDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

writeFileSync(resolve(outputDir, 'jwt-private.pem'), privateKey, { mode: 0o600 });
writeFileSync(resolve(outputDir, 'jwt-public.pem'), publicKey, { mode: 0o644 });

console.log(`Claves JWT generadas en: ${outputDir}`);
console.log('La clave privada no debe subirse a Git.');
