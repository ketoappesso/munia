// SMS verification store - shared between API route and auth provider
// In production, use Redis or database with expiration
export const smsCodeStore = new Map<string, { code: string; expiry: number; attempts: number }>();

// Verify SMS code
export function verifySmsCode(phoneNumber: string, code: string): boolean {
  const storedData = smsCodeStore.get(phoneNumber);
  
  if (!storedData) {
    console.log('[SMS Verify] No code found for phone:', phoneNumber);
    return false;
  }
  
  if (storedData.expiry < Date.now()) {
    console.log('[SMS Verify] Code expired for phone:', phoneNumber);
    smsCodeStore.delete(phoneNumber);
    return false;
  }
  
  if (storedData.code !== code) {
    console.log('[SMS Verify] Invalid code for phone:', phoneNumber);
    return false;
  }
  
  // Code is valid - remove it to prevent reuse
  smsCodeStore.delete(phoneNumber);
  console.log('[SMS Verify] Code verified successfully for phone:', phoneNumber);
  return true;
}

// Clean up expired codes periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of smsCodeStore.entries()) {
      if (data.expiry < now) {
        smsCodeStore.delete(phone);
      }
    }
  }, 60000); // Clean every minute
}