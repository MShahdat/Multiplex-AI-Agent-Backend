import crypto from 'crypto'
import config from '../config/index.js'


const KEY = crypto.createHash('sha256').update(config.encryption_key).digest();


export const encryptApiKey = (key: string) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([c.update(key, 'utf8'), c.final()]);

  return {
    encryptKey: enc.toString('hex'),
    iv: iv.toString('hex'),
    authTag: c.getAuthTag().toString('hex')
  }
}


export const decryptionKey = (e: string, ivH: string, tagH: string) => {
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivH, 'hex'))
  d.setAuthTag(Buffer.from(tagH, 'hex'));

  return Buffer.concat([d.update(Buffer.from(e, 'hex')), d.final()]).toString('utf8')
}


