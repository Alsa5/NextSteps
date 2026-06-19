import type { RoleMappingRepository } from '../repositories/role-mapping-repository.js';
import type { UserRole } from '../types/auth.js';

export interface RoleResolutionInput {
  email: string;
  jobTitle?: string;
  designation?: string;
  department?: string;
}

const normalize = (value: string): string => value.trim().toLowerCase();

const DEFAULT_DESIGNATION_RULES: Array<{ keywords: string[]; role: UserRole }> = [
  {
    keywords: [
      'learning and development',
      'learning & development',
      'l&d',
      'ld executive',
      'talent development',
      'training manager',
      'academy',
      'campus hiring',
      'maverick program',
    ],
    role: 'ld',
  },
  {
    keywords: [
      'delivery manager',
      'project manager',
      'engagement manager',
      'account manager',
      'practice manager',
      'people manager',
      'resource manager',
    ],
    role: 'manager',
  },
  {
    keywords: ['trainer', 'faculty', 'instructor', 'coach', 'training specialist'],
    role: 'trainer',
  },
  {
    keywords: ['maverick', 'trainee', 'graduate engineer', 'associate trainee', 'intern'],
    role: 'maverick',
  },
];

const matchDesignation = (designationText: string): UserRole | null => {
  for (const rule of DEFAULT_DESIGNATION_RULES) {
    if (rule.keywords.some((keyword) => designationText.includes(normalize(keyword)))) {
      return rule.role;
    }
  }
  return null;
};

/**
 * Resolve NextSteps role from DB mappings, then designation/jobTitle keywords, then email domain.
 */
export const resolveUserRole = async (
  input: RoleResolutionInput,
  roleMappings: RoleMappingRepository,
): Promise<UserRole> => {
  const email = normalize(input.email);

  const emailMapping = await roleMappings.findByEmail(email);
  if (emailMapping) {
    return emailMapping.role;
  }

  const designationText = normalize(
    input.designation || input.jobTitle || input.department || '',
  );

  if (designationText) {
    const mappings = await roleMappings.findAll();
    const designationMappings = mappings.filter((m) => m.type === 'designation');

    for (const mapping of designationMappings) {
      const keywords = mapping.keywords ?? [mapping.value];
      if (keywords.some((keyword) => designationText.includes(normalize(keyword)))) {
        return mapping.role;
      }
    }

    const defaultMatch = matchDesignation(designationText);
    if (defaultMatch) {
      return defaultMatch;
    }
  }

  if (email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')) {
    return 'maverick';
  }

  if (email.endsWith('@hexaware.com')) {
    return 'maverick';
  }

  return 'trainer';
};
