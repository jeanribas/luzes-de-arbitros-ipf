import { expect, test } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_URL ?? 'http://localhost:3333';

interface RoomResponse {
  roomId: string;
  adminPin: string;
  joinQRCodes: {
    left: { token: string };
    center: { token: string };
    right: { token: string };
  };
}

test('platform flow: ready -> votes -> release -> clear', async ({ page, context, request }) => {
  const api = await request.newContext({ baseURL: API_BASE_URL });
  const creation = await api.post('/rooms', { data: {} });
  expect(creation.ok()).toBeTruthy();
  const payload = (await creation.json()) as RoomResponse;

  const adminPage = page;
  await adminPage.goto(`/admin?roomId=${payload.roomId}&pin=${payload.adminPin}`);
  await expect(adminPage.getByText('Platform Admin')).toBeVisible();
  await expect(adminPage.getByText('Live')).toBeVisible({ timeout: 10_000 });

  const displayPage = await context.newPage();
  await displayPage.goto(`/display?roomId=${payload.roomId}&pin=${payload.adminPin}`);
  await expect(displayPage.getByText('Referee Lights')).toBeVisible();
  await expect(displayPage.getByText('Live')).toBeVisible({ timeout: 10_000 });

  const leftRef = await context.newPage();
  await leftRef.goto(`/ref/left?roomId=${payload.roomId}&token=${payload.joinQRCodes.left.token}`);
  await expect(leftRef.getByText('Referee Console')).toBeVisible();
  await expect(leftRef.getByText('Live')).toBeVisible({ timeout: 10_000 });

  const centerRef = await context.newPage();
  await centerRef.goto(
    `/ref/center?roomId=${payload.roomId}&token=${payload.joinQRCodes.center.token}`
  );
  await expect(centerRef.getByText('Referee Console')).toBeVisible();
  await expect(centerRef.getByText('Live')).toBeVisible({ timeout: 10_000 });

  const rightRef = await context.newPage();
  await rightRef.goto(
    `/ref/right?roomId=${payload.roomId}&token=${payload.joinQRCodes.right.token}`
  );
  await expect(rightRef.getByText('Referee Console')).toBeVisible();
  await expect(rightRef.getByText('Live')).toBeVisible({ timeout: 10_000 });

  await adminPage.getByRole('button', { name: 'Ready' }).click();

  await leftRef.getByRole('button', { name: 'GOOD LIFT' }).click();
  await centerRef.getByRole('button', { name: 'GOOD LIFT' }).click();
  await rightRef.getByRole('button', { name: 'NO LIFT' }).click();
  await rightRef.getByRole('button', { name: /^1$/ }).click();

  await adminPage.getByRole('button', { name: 'Release' }).click();

  await expect(displayPage.getByText('GOOD')).toBeVisible({ timeout: 5000 });
  await expect(displayPage.getByText('NO LIFT')).toBeVisible();

  await adminPage.getByRole('button', { name: 'Clear' }).click();

  await expect(displayPage.getByText('Decision phase: IDLE', { exact: false })).toBeVisible({ timeout: 5000 });
});
