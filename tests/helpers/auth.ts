import { Page } from '@playwright/test';

export interface TestUser {
  phone: string;
  password: string;
  id?: string;
}

export async function createTestUser(): Promise<TestUser> {
  // In a real test environment, this would create a user via API
  // For now, return predefined test users
  const users: TestUser[] = [
    { phone: '18874748888', password: '123456' },
    { phone: '19974749999', password: '123456' }
  ];
  
  return users[Math.floor(Math.random() * users.length)];
}

export async function login(page: Page, phone: string, password: string) {
  await page.goto('/login');
  
  // Fill login form
  await page.fill('input[type="tel"]', phone);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL('**/feed');
}