import { Env } from "../types";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(env: Env, payload: EmailPayload): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "WOOPLANS <noreply@wooplans.com>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  return response.ok;
}

export function buildPremiumWelcomeEmail(name: string, pin: string, loginUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0;">WOOPLANS PREMIUM</h1>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1a1a2e;">Bienvenue ${name} !</h2>
        <p>Votre abonnement premium est maintenant actif.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-size: 14px;">Votre code PIN</p>
          <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${pin}</p>
        </div>
        <a href="${loginUrl}" style="display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Se connecter
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Gardez ce code confidentiel. Il vous sera demandé pour accéder au catalogue premium.
        </p>
      </div>
    </div>
  `;
}

export function buildRenewalEmail(name: string, expiresAt: string, loginUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0;">WOOPLANS PREMIUM</h1>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1a1a2e;">Renouvellement confirmé !</h2>
        <p>Bonjour ${name},</p>
        <p>Votre abonnement premium a été renouvelé jusqu'au <strong>${expiresAt}</strong>.</p>
        <a href="${loginUrl}" style="display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Accéder au catalogue
        </a>
      </div>
    </div>
  `;
}
