// src/lib/discord_notifications.ts
// Authoritative Server-Side Discord Dispatch Service for Future Initiative Firearm Services

export const DISCORD_WEBHOOK_URL = 
  process.env.DISCORD_WEBHOOK_URL || 
  "https://discord.com/api/webhooks/1547779726746320958/nu4yar-r8aR3c6-P-mm8YeprX5bou1uqej24tEuYhNS5LVusMuBtADVcv1vf1oJp_bum";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordNotificationPayload {
  title: string;
  description: string;
  fields?: DiscordEmbedField[];
  color?: number;
  url?: string;
  footerText?: string;
}

/**
 * Dispatches an operational notification to Discord asynchronously.
 * Server-side execution ensures UI redirects (e.g. Stripe checkout) never cancel the alert.
 */
export async function sendDiscordNotification({
  title,
  description,
  fields = [],
  color = 0x00E5FF,
  url = "https://trainwithfifs.com",
  footerText = "Future Initiative Firearm Services • Operational Relay"
}: DiscordNotificationPayload): Promise<{ success: boolean; status?: number; error?: string }> {
  const webhookUrl = DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    console.warn('[FIFS Discord] Webhook URL not configured, skipping notification.');
    return { success: false, error: 'Webhook URL not configured' };
  }

  const payload = {
    username: "FIFS Operations & Command Dispatch",
    avatar_url: "https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa",
    embeds: [{
      title: title,
      description: description,
      url: url,
      color: color,
      fields: fields.map(f => ({
        name: f.name || "Detail",
        value: String(f.value || "N/A"),
        inline: Boolean(f.inline)
      })),
      footer: {
        text: footerText,
        icon_url: "https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa"
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[FIFS Discord] Webhook response ${res.status}: ${errText}`);
      return { success: false, status: res.status, error: errText };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    console.error('[FIFS Discord Error]:', err.message);
    return { success: false, error: err.message };
  }
}
