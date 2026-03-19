import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from './env';
import { getDb } from '../db';
import { magicLinks, users } from '../../drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';
import { isEmailDomainAllowed } from '../domainValidator';
import type { Request } from 'express';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';

/**
 * Magic Link Authentication Module
 * 
 * Flow:
 * 1. User enters email → generateMagicLink() creates token + sends email
 * 2. User clicks link → verifyMagicLink() validates token + creates session
 * 3. Subsequent requests → authenticateRequest() verifies JWT cookie
 */

// ============ Magic Link Generation ============

export async function generateMagicLink(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Validate domain
  if (!isEmailDomainAllowed(normalizedEmail) && normalizedEmail !== ENV.adminEmail?.toLowerCase()) {
    return { 
      success: false, 
      message: `El dominio @${normalizedEmail.split('@')[1]} no está autorizado` 
    };
  }

  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store magic link
  await db.insert(magicLinks).values({
    email: normalizedEmail,
    token,
    expiresAt,
  });

  // Send email with magic link
  const magicLinkUrl = `${ENV.appUrl}/api/auth/verify?token=${token}`;
  
  try {
    await sendMagicLinkEmail(normalizedEmail, magicLinkUrl);
  } catch (error) {
    console.error('[Auth] Failed to send magic link email:', error);
    return { success: false, message: 'Error al enviar el correo. Intenta de nuevo.' };
  }

  return { success: true, message: 'Enlace de acceso enviado a tu correo' };
}

// ============ Magic Link Verification ============

export async function verifyMagicLink(token: string): Promise<{ 
  success: boolean; 
  sessionToken?: string; 
  message?: string 
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  // Find valid (unused, not expired) magic link
  const result = await db
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.token, token),
        gt(magicLinks.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return { success: false, message: 'Enlace inválido o expirado' };
  }

  const link = result[0];

  // Check if already used
  if (link.usedAt) {
    return { success: false, message: 'Este enlace ya fue utilizado' };
  }

  // Mark as used
  await db
    .update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, link.id));

  // Upsert user
  const { upsertUser, getUserByEmail } = await import('../db');
  
  await upsertUser({
    email: link.email,
    loginMethod: 'magic_link',
    lastSignedIn: new Date(),
  });

  const user = await getUserByEmail(link.email);
  if (!user) {
    return { success: false, message: 'Error al crear usuario' };
  }

  // Create JWT session token
  const sessionToken = jwt.sign(
    { userId: user.id, email: user.email },
    ENV.jwtSecret,
    { expiresIn: '30d' }
  );

  return { success: true, sessionToken };
}

// ============ Request Authentication ============

export async function authenticateRequest(req: Request): Promise<{
  id: number;
  email: string;
  name: string | null;
  role: string;
  permisos: string[] | null;
  formatoMoneda: string;
  activo: boolean;
} | null> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as { userId: number; email: string };
    
    const { getUserByEmail } = await import('../db');
    const user = await getUserByEmail(decoded.email);
    
    if (!user || !user.activo) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permisos: user.permisos,
      formatoMoneda: user.formatoMoneda,
      activo: user.activo,
    };
  } catch {
    return null;
  }
}

// ============ Email Sending ============

async function sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
  if (!ENV.resendApiKey) {
    // In development, just log the link
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  MAGIC LINK (dev mode - no email sent)   ║`);
    console.log(`║  Email: ${email}`);
    console.log(`║  Link: ${magicLinkUrl}`);
    console.log(`╚══════════════════════════════════════════╝\n`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TIM Cartera <noreply@leasingtim.mx>',
      to: [email],
      subject: 'Acceso a TIM Cartera',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">TIM Cartera - Acceso al Sistema</h2>
          <p>Haz clic en el siguiente enlace para acceder al sistema:</p>
          <a href="${magicLinkUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #0f4c75; 
                    color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Acceder al Sistema
          </a>
          <p style="color: #666; font-size: 14px;">
            Este enlace expira en 15 minutos y solo puede usarse una vez.
          </p>
          <p style="color: #999; font-size: 12px;">
            Si no solicitaste este acceso, puedes ignorar este correo.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }
}
