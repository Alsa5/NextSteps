import { describe, expect, it, vi } from 'vitest';
import { resolveUserRole } from '../src/services/role-resolver.js';
import type { RoleMappingRepository } from '../src/repositories/role-mapping-repository.js';

const createMockMappings = (
  overrides: Partial<RoleMappingRepository> = {},
): RoleMappingRepository => ({
  findByEmail: vi.fn().mockResolvedValue(null),
  findAll: vi.fn().mockResolvedValue([
    {
      _id: '1',
      type: 'designation',
      value: 'manager',
      role: 'manager',
      keywords: ['manager', 'delivery manager'],
      createdAt: new Date().toISOString(),
    },
    {
      _id: '2',
      type: 'designation',
      value: 'trainer',
      role: 'trainer',
      keywords: ['trainer', 'instructor'],
      createdAt: new Date().toISOString(),
    },
  ]),
  seedDefaults: vi.fn(),
  ...overrides,
});

describe('resolveUserRole', () => {
  it('uses explicit email mapping when present', async () => {
    const mappings = createMockMappings({
      findByEmail: vi.fn().mockResolvedValue({
        _id: 'x',
        type: 'email',
        value: 'lead@hexaware.com',
        role: 'ld',
        createdAt: new Date().toISOString(),
      }),
    });

    const role = await resolveUserRole(
      { email: 'lead@hexaware.com', jobTitle: 'Trainer' },
      mappings,
    );

    expect(role).toBe('ld');
  });

  it('maps designation keywords from job title', async () => {
    const role = await resolveUserRole(
      { email: 'someone@hexaware.com', jobTitle: 'Delivery Manager' },
      createMockMappings(),
    );

    expect(role).toBe('manager');
  });

  it('defaults gmail users to maverick', async () => {
    const role = await resolveUserRole(
      { email: 'priya.sharma@gmail.com' },
      createMockMappings(),
    );

    expect(role).toBe('maverick');
  });
});
