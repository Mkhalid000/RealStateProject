import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import * as fs from 'fs';
import * as admin from 'firebase-admin';
import {PrismaService} from '../prisma/prisma.service';

/**
 * Sends Firebase Cloud Messaging (FCM) push notifications to a user's
 * registered devices. Initialises lazily from the FIREBASE_SERVICE_ACCOUNT
 * env var (the full service-account JSON, as a string). If that env var is
 * absent the service silently no-ops, so the app keeps working without push
 * configured.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger('PushService');
  private enabled = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const creds = this.loadCreds();
    if (!creds) {
      this.logger.warn(
        'No Firebase credentials (FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_SERVICE_ACCOUNT) — push disabled.',
      );
      return;
    }
    try {
      if (!admin.apps.length) {
        admin.initializeApp({credential: admin.credential.cert(creds)});
      }
      this.enabled = true;
      this.logger.log('Firebase push initialised.');
    } catch (e) {
      this.logger.error(`Failed to init Firebase: ${(e as Error).message}`);
    }
  }

  /**
   * Load the service account from (in order):
   *  1. FIREBASE_SERVICE_ACCOUNT_PATH — path to the downloaded JSON file (best).
   *  2. FIREBASE_SERVICE_ACCOUNT       — raw JSON, or base64-encoded JSON.
   */
  private loadCreds(): admin.ServiceAccount | null {
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (path) {
      try {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
      } catch (e) {
        this.logger.error(`Can't read service account file: ${(e as Error).message}`);
        return null;
      }
    }

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      return null;
    }
    // Try plain JSON, then base64-encoded JSON (avoids .env newline/quote issues).
    for (const candidate of [raw, safeBase64Decode(raw)]) {
      if (!candidate) continue;
      try {
        return JSON.parse(candidate);
      } catch {
        // try next
      }
    }
    this.logger.error(
      'FIREBASE_SERVICE_ACCOUNT is not valid JSON. Prefer FIREBASE_SERVICE_ACCOUNT_PATH (a file path).',
    );
    return null;
  }

  /** Send a notification to every device the user has registered. */
  async sendToUser(
    userId: string,
    notif: {title: string; body: string},
    data: Record<string, string> = {},
  ) {
    if (!this.enabled) {
      return;
    }
    let tokens: {token: string}[] = [];
    try {
      tokens = await this.prisma.deviceToken.findMany({where: {userId}});
    } catch (e) {
      // Table may not exist yet (migration pending) — never break notify().
      this.logger.warn(`device token lookup failed: ${(e as Error).message}`);
      return;
    }
    if (!tokens.length) {
      return;
    }
    const message: admin.messaging.MulticastMessage = {
      tokens: tokens.map(t => t.token),
      notification: {title: notif.title, body: notif.body},
      data,
      android: {
        priority: 'high',
        notification: {
          icon: 'ic_launcher_round', // white-on-transparent drawable in mipmap
          color: '#F2A65A',          // AUREVIA gold
        },
      },
    };
    try {
      const res = await admin.messaging().sendEachForMulticast(message);
      // Prune tokens FCM reports as invalid/unregistered.
      const stale: string[] = [];
      res.responses.forEach((r, i) => {
        const code = r.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          stale.push(tokens[i].token);
        }
      });
      if (stale.length) {
        await this.prisma.deviceToken.deleteMany({where: {token: {in: stale}}});
      }
    } catch (e) {
      this.logger.error(`Push send failed: ${(e as Error).message}`);
    }
  }
}

function safeBase64Decode(s: string): string | null {
  try {
    const out = Buffer.from(s, 'base64').toString('utf8');
    return out.trim().startsWith('{') ? out : null;
  } catch {
    return null;
  }
}
