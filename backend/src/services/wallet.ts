import { ethers } from "ethers";
import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

function getMasterEncryptionKey(): string {
  if (!process.env.MASTER_ENCRYPTION_KEY) {
    throw new Error(
      "MASTER_ENCRYPTION_KEY não configurada. Configure a variável de ambiente MASTER_ENCRYPTION_KEY "
    );
  }
  return process.env.MASTER_ENCRYPTION_KEY;
}

const MASTER_ENCRYPTION_KEY = getMasterEncryptionKey();

export function generateWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

function deriveMasterKey(salt: Buffer): Buffer {
  if (!MASTER_ENCRYPTION_KEY) {
    throw new Error("MASTER_ENCRYPTION_KEY não configurada");
  }
  return crypto.pbkdf2Sync(
    MASTER_ENCRYPTION_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
}

export function encryptPrivateKey(
  privateKey: string,
  password: string,
  salt: Buffer
): { encrypted: string; iv: string; authTag: string } {
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function encryptPrivateKeyWithMaster(
  privateKey: string,
  salt: Buffer
): { encrypted: string; iv: string; authTag: string } {
  if (!MASTER_ENCRYPTION_KEY) {
    throw new Error("MASTER_ENCRYPTION_KEY não configurada");
  }

  const key = deriveMasterKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptPrivateKey(
  encryptedData: string,
  password: string,
  salt: Buffer,
  iv: string,
  authTag: string
): string {
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function decryptPrivateKeyWithMaster(
  encryptedData: string,
  salt: Buffer,
  iv: string,
  authTag: string
): string {
  if (!MASTER_ENCRYPTION_KEY) {
    throw new Error("MASTER_ENCRYPTION_KEY não configurada");
  }

  const key = deriveMasterKey(salt);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export async function getOrCreateUserWallet(
  email: string,
  password: string
): Promise<{
  userId: string;
  address: string;
}> {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    const externalId = crypto.randomUUID();
    const { address, privateKey } = generateWallet();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const { encrypted, iv, authTag } = encryptPrivateKey(
      privateKey,
      password,
      salt
    );
    const encryptedKey = `${encrypted}:${iv}:${authTag}`;

    let backupData: { privateKeyBackup: string; backupSalt: string } | null =
      null;
    if (MASTER_ENCRYPTION_KEY) {
      try {
        const backupSalt = crypto.randomBytes(SALT_LENGTH);
        const {
          encrypted: backupEncrypted,
          iv: backupIv,
          authTag: backupAuthTag,
        } = encryptPrivateKeyWithMaster(privateKey, backupSalt);
        const backupEncryptedKey = `${backupEncrypted}:${backupIv}:${backupAuthTag}`;

        backupData = {
          privateKeyBackup: backupEncryptedKey,
          backupSalt: backupSalt.toString("hex"),
        };
      } catch (error) {
        console.warn(
          "Aviso: Não foi possível criar backup com chave mestra:",
          error
        );
      }
    }

    user = await prisma.user.create({
      data: {
        externalId: externalId,
        email,
        password: passwordHash,
        walletAddress: address,
        privateKey: encryptedKey,
        salt: salt.toString("hex"),
        ...(backupData || {}),
      },
    });
  }

  return {
    userId: user.id,
    address: user.walletAddress || "",
  };
}

export async function getUserPrivateKey(
  userId: string,
  password: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const [encrypted, iv, authTag] = user.privateKey.split(":");
  const salt = Buffer.from(user.salt, "hex");

  return decryptPrivateKey(encrypted, password, salt, iv, authTag);
}
