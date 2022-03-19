import crypto from 'crypto';

export function randomString(size: number): string {
   return crypto.randomBytes(size).toString(`hex`);
}