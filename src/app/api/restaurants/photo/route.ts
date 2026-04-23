import { NextRequest, NextResponse } from 'next/server';

/**
 * 음식점 사진 proxy.
 * photoReference만 받아서 서버에서 Google Places Photo API 호출 → 이미지 바이트를 스트림으로 반환.
 * API key는 응답 어디에도 포함되지 않으므로 브라우저에 노출되지 않음.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ref = searchParams.get('ref');
  const widthParam = searchParams.get('w');

  if (!ref) {
    return NextResponse.json(
      { error: 'Missing required query parameter: ref' },
      { status: 400 }
    );
  }

  const maxWidth = (() => {
    const n = widthParam ? Number(widthParam) : 400;
    if (!Number.isFinite(n) || n <= 0 || n > 1600) return 400;
    return Math.floor(n);
  })();

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const upstream = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(ref)}&key=${apiKey}`;

  try {
    const res = await fetch(upstream);

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: 'Upstream photo fetch failed' },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Photo proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 502 }
    );
  }
}
