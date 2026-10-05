// Server-only Discord operational alerts. The webhook URL must come from the
// DISCORD_WEBHOOK_URL environment variable; there is deliberately no fallback.

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export async function sendDiscordAlert(
  title: string,
  description: string,
  fields: DiscordField[] = [],
  color: number = 0x00E5FF
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    console.warn('[FIFS Discord] DISCORD_WEBHOOK_URL is not configured; skipping alert.');
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'FIFS Operations & Command Dispatch',
        // Never let user-supplied text trigger @everyone/@here or role pings
        allowed_mentions: { parse: [] },
        embeds: [{
          title: title.slice(0, 256),
          description: description.slice(0, 4000),
          color,
          fields: fields.slice(0, 25).map(f => ({
            name: String(f.name || 'Detail').slice(0, 256),
            value: String(f.value || 'N/A').slice(0, 1024),
            inline: Boolean(f.inline)
          })),
          footer: { text: 'Future Initiative Firearm Services • Operational Relay' },
          timestamp: new Date().toISOString()
        }]
      })
    });
    if (!res.ok) {
      console.warn(`[FIFS Discord] Webhook responded with HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[FIFS Discord] Alert dispatch failed:', err?.message);
    return false;
  }
}
