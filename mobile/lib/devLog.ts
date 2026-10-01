// Timestamped console.log that only runs in dev builds, used to trace the app's
// startup sequence (fonts, session read, JSON seed, redirects) when diagnosing a stuck
// splash screen or a blank first screen.
export function devLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log(`[pozo ${new Date().toISOString()}]`, ...args);
  }
}
