import type { CookieSerializeOptions } from 'cookie'

// Page Routes
export const ROUTE_HOME = '/'
export const ROUTE_AUTH = '/auth'
export const ROUTE_PROFILE = '/profile'

// API Routes
export const API_AUTH = '/api/auth'

// Default payload/responses
export const RESP_USER_GUEST = {
  guest: true
}

// 3rd Party Website/App URIs

export const COOKIE_NAME = 'sb:token'
export const COOKIE_OPTIONS: CookieSerializeOptions = {
  maxAge: 60 * 60 * 24 * 7,
  domain: '',
  path: '/',
  sameSite: 'lax',
  httpOnly: true
}

// sveltekit-ory-starter

export const config = {
	auth: {
		publicUrl: import.meta.env.VITE_KRATOS_PUBLIC_URL || 'http://127.0.0.1:4433',
		adminUrl: import.meta.env.VITE_KRATOS_ADMIN_URL || 'http://127.0.0.1:4434'
	}
};
