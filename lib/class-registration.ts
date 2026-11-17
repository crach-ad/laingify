// WSR-4E permits new students to join even when its saved class setting
// predates open registration. Other classes retain their configured policy.
export function allowsSelfRegistration(klass: { classCode?: string; minAuthTier: number }) {
  return klass.minAuthTier === 0 || klass.classCode === "WSR-4E";
}
