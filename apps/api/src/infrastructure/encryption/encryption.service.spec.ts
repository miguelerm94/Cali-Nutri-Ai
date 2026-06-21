import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService (FD-DB-06 — AES-256-GCM)', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: { get: () => '0'.repeat(64) }, // clave de prueba de 32 bytes en hex
        },
      ],
    }).compile();

    service = moduleRef.get(EncryptionService);
    service.onModuleInit();
  });

  it('encripta y desencripta el mismo texto correctamente (roundtrip)', () => {
    const plaintext = 'Hice 8 dominadas hoy, ¿cómo me fue?';
    const { content, contentIv } = service.encrypt(plaintext);

    expect(content).not.toEqual(plaintext);
    expect(service.decrypt(content, contentIv)).toEqual(plaintext);
  });

  it('genera un IV distinto en cada llamada (no determinista)', () => {
    const a = service.encrypt('mismo texto');
    const b = service.encrypt('mismo texto');
    expect(a.contentIv).not.toEqual(b.contentIv);
  });

  it('lanza error si el authTag fue alterado (detección de manipulación)', () => {
    const { content, contentIv } = service.encrypt('contenido sensible');
    const [ivHex] = contentIv.split(':');
    const tamperedIv = `${ivHex}:${'0'.repeat(32)}`;
    expect(() => service.decrypt(content, tamperedIv)).toThrow();
  });
});
