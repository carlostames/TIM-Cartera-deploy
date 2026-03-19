import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { generateMagicLink, verifyMagicLink } from "./auth";
import cookieParser from "cookie-parser";

/**
 * Registers Magic Link authentication HTTP routes.
 * 
 * POST /api/auth/magic-link  → Send magic link email
 * GET  /api/auth/verify       → Verify token from email link
 * POST /api/auth/logout       → Clear session cookie
 */
export function registerAuthRoutes(app: Express) {
  // Ensure cookie parser is available
  app.use(cookieParser());

  /**
   * POST /api/auth/magic-link
   * Body: { email: string }
   * Sends a magic link email to the given address.
   */
  app.post("/api/auth/magic-link", async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: "Email es requerido" });
      return;
    }

    const result = await generateMagicLink(email);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  });

  /**
   * GET /api/auth/verify?token=xxx
   * Verifies the magic link token and sets session cookie.
   */
  app.get("/api/auth/verify", async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).send("Token es requerido");
      return;
    }

    const result = await verifyMagicLink(token);

    if (result.success && result.sessionToken) {
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, result.sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      // Redirect to main app
      res.redirect(302, "/");
    } else {
      // Show error page
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error de Acceso</title></head>
        <body style="font-family: Arial; text-align: center; padding: 60px;">
          <h2>⚠️ ${result.message || 'Error de verificación'}</h2>
          <p><a href="/">Volver al inicio</a></p>
        </body>
        </html>
      `);
    }
  });

  /**
   * POST /api/auth/logout
   * Clears the session cookie.
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}
