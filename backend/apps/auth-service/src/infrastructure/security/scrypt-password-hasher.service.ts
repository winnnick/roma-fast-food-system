import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { PasswordHasherPort } from '../../domain/ports/auth.ports';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

interface ScryptOptions {
  N: number;
  r: number;
  p: number;
  maxmem: number;
}

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

@Injectable()
export class ScryptPasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derived = await deriveKey(password, salt, KEY_LENGTH, {
      N: COST,
      r: BLOCK_SIZE,
      p: PARALLELIZATION,
      maxmem: MAX_MEMORY,
    });

    return [
      'scrypt',
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString('base64url'),
      derived.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const parts = encodedHash.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return false;
    }

    const [, costRaw, blockRaw, parallelRaw, saltRaw, hashRaw] = parts;
    const cost = Number(costRaw);
    const blockSize = Number(blockRaw);
    const parallelization = Number(parallelRaw);

    if (![cost, blockSize, parallelization].every(Number.isSafeInteger)) {
      return false;
    }

    try {
      const salt = Buffer.from(saltRaw, 'base64url');
      const expected = Buffer.from(hashRaw, 'base64url');
      const derived = await deriveKey(password, salt, expected.length, {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: MAX_MEMORY,
      });

      return expected.length === derived.length && timingSafeEqual(expected, derived);
    } catch {
      return false;
    }
  }
}
