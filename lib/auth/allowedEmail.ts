export function isAllowedSignupEmail(email: string, allowedEmail: string): boolean {
  if (!allowedEmail) return false;
  return email.trim().toLowerCase() === allowedEmail.trim().toLowerCase();
}
