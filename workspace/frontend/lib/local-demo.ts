export function isLocalDemoEnabled() {
  return process.env.NODE_ENV === 'development'
    && process.env.NEXT_PUBLIC_BALNE_LOCAL_DEMO_LOGIN === 'true';
}
