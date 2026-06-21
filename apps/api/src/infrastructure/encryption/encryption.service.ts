import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * AES-256-GCM encrypt/decrypt para ai_messages.content (FD-DB-06, FD-SEC-02).
 * Clave maestra: 32 bytes en hex (idealmente recuperada de AWS KMS, no de env vars
 * en producción — ver encryption.config.ts. En S1 se deja el contrato listo;
 * AIModule lo consume a partir de S5b).
 *
 * Formato de almacenamiento: content = base64(ciphertext), content_iv = hex(iv) + ':' + hex(authTag)
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private key!: Buffer;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const hexKey = this.configService.get<string>('encryption.key');
    if (!hexKey || hexKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY debe ser de 32 bytes en hex (64 caracteres). Generar con: openssl rand -hex 32');
    }
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(plaintext: string): { content: string; contentIv: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(EncryptionService.ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      content: encrypted.toString('base64'),
      contentIv: `${iv.toString('hex')}:${authTag.toString('hex')}`,
    };
  }

  decrypt(content: string, contentIv: string): string {
    const [ivHex, authTagHex] = contentIv.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(EncryptionService.ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(content, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
