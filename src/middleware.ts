import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'team';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'your-secure-password';

export function middleware(request: NextRequest) {
  // Skip auth for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Market Intelligence Team Access"',
      },
    });
  }

  const [type, credentials] = authHeader.split(' ');
  
  if (type !== 'Basic') {
    return new NextResponse('Invalid authentication type', { status: 401 });
  }

  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
  
  if (username === BASIC_AUTH_USER && password === BASIC_AUTH_PASSWORD) {
    return NextResponse.next();
  }

  return new NextResponse('Invalid credentials', { status: 401 });
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
