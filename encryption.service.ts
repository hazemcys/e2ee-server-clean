import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseEncryptionService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.DATABASE_ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  private generateEncryptionKey(): string {
    // Generate a 32-byte (256-bit) encryption key
    return crypto.randomBytes(32).toString('hex');
  }

  async encryptDatabase(dbPath: string): Promise<void> {
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found: ${dbPath}`);
    }

    const encryptedPath = `${dbPath}.encrypted`;
    const data = fs.readFileSync(dbPath);
    
    // Create cipher
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    
    // Encrypt data
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Save encrypted file with IV prepended
    const finalData = Buffer.concat([iv, encrypted]);
    fs.writeFileSync(encryptedPath, finalData);
    
    console.log(`Database encrypted: ${encryptedPath}`);
  }

  async decryptDatabase(encryptedPath: string, outputPath: string): Promise<void> {
    if (!fs.existsSync(encryptedPath)) {
      throw new Error(`Encrypted database file not found: ${encryptedPath}`);
    }

    const data = fs.readFileSync(encryptedPath);
    
    // Extract IV and encrypted data
    const iv = data.slice(0, 16);
    const encryptedData = data.slice(16);
    
    // Create decipher
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    
    // Decrypt data
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Save decrypted file
    fs.writeFileSync(outputPath, decrypted);
    
    console.log(`Database decrypted: ${outputPath}`);
  }

  getEncryptionKey(): string {
    return this.encryptionKey;
  }

  async initializeEncryptedDatabase(): Promise<void> {
    const dbPath = './prisma/dev.db';
    const encryptedPath = './prisma/dev.db.encrypted';
    
    if (fs.existsSync(dbPath) && !fs.existsSync(encryptedPath)) {
      console.log('Encrypting existing database...');
      await this.encryptDatabase(dbPath);
      
      // Backup original and use encrypted version
      fs.renameSync(dbPath, `${dbPath}.backup`);
      console.log('Original database backed up');
    }
  }
}
