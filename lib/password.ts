import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const SALT_LEN = 16;
const KEY_LEN = 64;

/** Хеширование пароля для хранения (scrypt). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const key = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

/** Проверка пароля против сохранённого хеша. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const key = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const storedKey = Buffer.from(keyHex, 'hex');
  if (key.length !== storedKey.length) return false;
  return timingSafeEqual(key, storedKey);
}
