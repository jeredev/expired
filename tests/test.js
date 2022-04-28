import { expect, test } from '@playwright/test';

test('profile page has expected h1', async ({ page }) => {
	await page.goto('/profile');
	expect(await page.textContent('h1')).toBe('Profile');
});
