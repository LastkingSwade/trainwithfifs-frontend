import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISCORD_WEBHOOK_URL =
  process.env.DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1547779726746320958/nu4yar-r8aR3c6-P-mm8YeprX5bou1uqej24tEuYhNS5LVusMuBtADVcv1vf1oJp_bum";

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordNotificationPayload {
  title: string;
  description: string;
  fields?: DiscordEmbedField[];
  color?: number;
  url?: string;
}

async function sendDiscordNotification({
  title,
  description,
  fields = [],
  color = 0x00E5FF,
  url = "https://trainwithfifs.com"
}: DiscordNotificationPayload) {
  if (!DISCORD_WEBHOOK_URL || !DISCORD_WEBHOOK_URL.startsWith('http')) {
    return { success: false, error: 'Webhook URL not configured' };
  }

  const payload = {
    username: "FIFS Operations & Command Dispatch",
    avatar_url: "https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa",
    embeds: [{
      title,
      description,
      url,
      color,
      fields: fields.map(f => ({
        name: f.name || "Detail",
        value: String(f.value || "N/A"),
        inline: Boolean(f.inline)
      })),
      footer: {
        text: "Future Initiative Firearm Services • Operational Relay",
        icon_url: "https://lh3.googleusercontent.com/d/1u53IU5ttzcy8t5W4oLlB2H9q2pXaaExa"
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, status: res.status, error: errText };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, fields = [], color = 0x00E5FF, url = "https://trainwithfifs.com" } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required for notification.' }, { status: 400 });
    }

    const result = await sendDiscordNotification({
      title,
      description: description || 'Operational event dispatched from FIFS Platform',
      fields,
      color,
      url
    });

    return NextResponse.json({
      success: true,
      status: 'dispatched',
      result
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
