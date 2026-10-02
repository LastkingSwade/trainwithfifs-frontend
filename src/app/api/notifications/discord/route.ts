import { NextResponse } from 'next/server';
import { sendDiscordNotification, DiscordEmbedField } from '@/lib/discord_notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, fields = [], color = 0x00E5FF, url = "https://trainwithfifs.com" } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required for notification.' }, { status: 400 });
    }

    // Fire Discord notification asynchronously
    const result = await sendDiscordNotification({
      title,
      description: description || 'Operational event dispatched from FIFS Platform',
      fields: fields as DiscordEmbedField[],
      color,
      url
    });

    return NextResponse.json({
      success: true,
      status: 'dispatched',
      result
    });
  } catch (err: any) {
    console.error('[API Discord Route Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
