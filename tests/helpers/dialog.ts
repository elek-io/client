import { expect, type Page } from '@playwright/test';

/**
 * Confirm an open shadcn Dialog / AlertDialog by clicking its confirm button.
 * Scoped to the open dialog so the confirm button is not confused with the
 * trigger that opened it (their labels often differ, e.g. "Delete Collection"
 * vs "Yes, delete this Collection").
 */
export async function confirmDialog(
  page: Page,
  confirmName: string
): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: confirmName }).click();
}

/** Dismiss an open dialog with the Escape key. */
export async function dismissDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}
