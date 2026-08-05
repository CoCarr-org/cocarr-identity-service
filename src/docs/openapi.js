module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Cocarr Identity Service',
    version: '0.1.0',
    description: 'Authentication only: identity mapping (Firebase UID <-> platform id), '
      + 'sessions, refresh tokens, password setup/reset and device management. No roles or permissions.',
  },
  servers: [{ url: '/v1' }],
  tags: [{ name: 'Auth' }, { name: 'Identity' }, { name: 'Devices' }, { name: 'Health' }],
  paths: {
    '/health': { get: { tags: ['Health'], summary: 'Liveness + DB + firebase status', responses: { 200: { description: 'ok' } } } },
    '/auth/verify': { post: { tags: ['Auth'], summary: 'Verify Firebase ID token -> identity + session + refresh token', responses: { 201: { description: 'authenticated' } } } },
    '/auth/session/refresh': { post: { tags: ['Auth'], summary: 'Rotate refresh token -> new session token', responses: { 200: { description: 'ok' } } } },
    '/auth/session/revoke': { post: { tags: ['Auth'], summary: 'Revoke a session (logout)', responses: { 200: { description: 'ok' } } } },
    '/auth/password/setup': { post: { tags: ['Auth'], summary: 'Generate password setup link (auth)', responses: { 200: { description: 'ok' } } } },
    '/auth/password/reset': { post: { tags: ['Auth'], summary: 'Generate password reset link (auth)', responses: { 200: { description: 'ok' } } } },
    '/identity/me': { get: { tags: ['Identity'], summary: 'Identity mapping for the caller', responses: { 200: { description: 'ok' } } } },
    '/identity/sessions': { get: { tags: ['Identity'], summary: 'Active sessions for the caller', responses: { 200: { description: 'ok' } } } },
    '/identity/{firebaseUid}': { get: { tags: ['Identity'], summary: 'Mapping lookup by Firebase UID (internal)', responses: { 200: { description: 'ok' } } } },
    '/devices': {
      get: { tags: ['Devices'], summary: 'List my devices', responses: { 200: { description: 'ok' } } },
      post: { tags: ['Devices'], summary: 'Register / touch a device', responses: { 201: { description: 'created' } } },
    },
    '/devices/{deviceId}': { delete: { tags: ['Devices'], summary: 'Revoke a device', responses: { 200: { description: 'ok' } } } },
  },
};
