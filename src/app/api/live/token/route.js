import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { channelName, role = 'subscriber', account } = body;

    if (!channelName) {
      return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
    }

    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId) {
      return NextResponse.json(
        {
          error: 'agora_not_configured',
          message: 'Falta configurar NEXT_PUBLIC_AGORA_APP_ID en las variables de entorno (.env.local)',
        },
        { status: 503 }
      );
    }

    const userAccount = account ? String(account) : 'anon_' + Math.random().toString(36).slice(2, 8);
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Token válido por 2 horas (7200 segundos)
    const expirationTimeInSeconds = 7200;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    let token = null;

    if (appCertificate) {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        appId,
        appCertificate,
        channelName,
        userAccount,
        rtcRole,
        expirationTimeInSeconds,
        privilegeExpiredTs
      );
    }

    return NextResponse.json({
      success: true,
      token,
      appId,
      channelName,
      account: userAccount,
      role,
    });
  } catch (err) {
    console.error('[Agora Token Error]', err);
    return NextResponse.json({ error: err.message || 'Error generating token' }, { status: 500 });
  }
}
