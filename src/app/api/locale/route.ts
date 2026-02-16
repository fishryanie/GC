import { isAppLocale } from 'i18n/config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { locale?: unknown } | null;
  const locale = typeof payload?.locale === 'string' ? payload.locale : '';

  if (!isAppLocale(locale)) {
    return NextResponse.json({ ok: false, message: 'Invalid locale.' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}
