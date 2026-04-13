// Analytics stub — wire up a real provider in Phase 2 (e.g. Plausible, PostHog, Vercel Analytics).
// Call these at event boundaries: form submissions, page actions, onboarding steps.

export function trackEvent(
  _name: string,
  _properties?: Record<string, unknown>,
): void {
  // Phase 2: send to analytics provider
}

export function identifyUser(
  _userId: string,
  _traits?: Record<string, unknown>,
): void {
  // Phase 2: associate session with authenticated user
}

export function trackPageView(_path: string): void {
  // Phase 2: record page navigation (if not handled automatically by provider)
}
