import { expect, test, type Route } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const EVALUATION_ID = 'evaluation-indicator-table-test';
const SCOPE_ID = 'scope-indicator-table-test';

interface ApiResponse {
  status?: number;
  body: unknown;
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createTestJwt(): string {
  return [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({
      user_id: 'indicator-table-user',
      email: 'indicator-table@test.local',
      full_name: 'Indicator Table Test',
      role: 'admin',
      roles: ['admin'],
    }),
    'signature',
  ].join('.');
}

const AUTH_TOKEN = createTestJwt();

const requirement = {
  id: 'requirement-1',
  scope_id: SCOPE_ID,
  code: 'REQ-1',
  name: 'Requirement with full stats',
  description: 'Requirement used by the focused IndicatorTable behavior test',
  sort_order: 1,
};

const indicators = [
  {
    id: 'indicator-visible',
    requirement_id: requirement.id,
    requirement,
    code: 'IND-VISIBLE',
    name: 'Visible Metric',
    type: 'boolean',
    axis_name: 'Gobernanza',
    is_completed: true,
    destination_value: 100,
    evaluator_value: 100,
    is_verified: false,
  },
  {
    id: 'indicator-hidden-complete',
    requirement_id: requirement.id,
    requirement,
    code: 'IND-HIDDEN-COMPLETE',
    name: 'Hidden Completed Metric',
    type: 'boolean',
    axis_name: 'Gobernanza',
    is_completed: true,
    destination_value: 100,
    evaluator_value: 100,
    is_verified: false,
  },
  {
    id: 'indicator-hidden-pending',
    requirement_id: requirement.id,
    requirement,
    code: 'IND-HIDDEN-PENDING',
    name: 'Hidden Pending Metric',
    type: 'boolean',
    axis_name: 'Gobernanza',
    is_completed: false,
    is_verified: false,
  },
];

function responseFor(pathname: string, searchParams: URLSearchParams): ApiResponse {
  if (pathname === `/api/evaluations/evaluations/${EVALUATION_ID}`) {
    return {
      body: {
        id: EVALUATION_ID,
        destination_id: 'destination-1',
        name: 'IndicatorTable behavior test evaluation',
        type: 'autodiagnostico',
        status: 'en_curso',
        has_external_evaluator: false,
      },
    };
  }

  if (pathname === '/api/evaluations/scopes') {
    return {
      body: [{ id: SCOPE_ID, axis: 'gob', acronym: 'GOB', name: 'Gobernanza', sort_order: 1 }],
    };
  }

  if (pathname === `/api/evaluations/evaluations/${EVALUATION_ID}/scopes/progress`) {
    return {
      body: [{
        scope_id: SCOPE_ID,
        scope_name: 'Gobernanza',
        scope_acronym: 'GOB',
        axis: 'gob',
        total_indicators: indicators.length,
        completed_indicators: 2,
        percentage: 67,
      }],
    };
  }

  if (pathname === '/api/evaluations/requirements' && searchParams.get('scope_id') === SCOPE_ID) {
    return { body: [requirement] };
  }

  if (pathname === '/api/evaluations/actions' && searchParams.get('scope_id') === SCOPE_ID) {
    return { body: [] };
  }

  if (pathname === `/api/evaluations/evaluations/${EVALUATION_ID}/scopes/${SCOPE_ID}/indicators`) {
    return { body: indicators };
  }

  return { status: 404, body: { error: `Unhandled mocked API path: ${pathname}` } };
}

async function fulfillEvaluationsApi(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const response = responseFor(url.pathname, url.searchParams);

  await route.fulfill({
    status: response.status ?? 200,
    contentType: 'application/json',
    body: JSON.stringify(response.body),
  });
}

test.describe('IndicatorTable', () => {
  test('keeps requirement completion counts based on all requirement indicators after search filtering', async ({ page, context }) => {
    await context.addCookies([{ name: 'auto_insight_token', value: AUTH_TOKEN, url: BASE_URL }]);
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, AUTH_TOKEN);

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'indicator-table-user',
            email: 'indicator-table@test.local',
            name: 'Indicator Table Test',
            roles: ['admin'],
          },
        }),
      });
    });
    await page.route('**/api/evaluations/**', fulfillEvaluationsApi);

    await page.goto(`/evaluaciones/${EVALUATION_ID}/ambitos/${SCOPE_ID}`);

    await expect(page.getByText('Visible Metric')).toBeVisible();
    await expect(page.getByText('Hidden Completed Metric')).toBeVisible();
    await expect(page.getByText('Hidden Pending Metric')).toBeVisible();
    await expect(page.getByText('✓ 2/3')).toBeVisible();

    await page.getByPlaceholder('Buscar indicador...').fill('Visible Metric');

    await expect(page.getByText('Visible Metric')).toBeVisible();
    await expect(page.getByText('Hidden Completed Metric')).toBeHidden();
    await expect(page.getByText('Hidden Pending Metric')).toBeHidden();
    await expect(page.getByText('✓ 2/3')).toBeVisible();
    await expect(page.getByText('✓ 1/1')).toHaveCount(0);
  });
});
