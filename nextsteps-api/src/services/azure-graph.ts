import { env } from '../config/env.js';

export interface GraphUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  employeeType?: string;
  employeeId?: string;
}

export const fetchGraphProfile = async (accessToken: string): Promise<GraphUserProfile> => {
  const response = await fetch(
    `${env.GraphApiEndpoint}/me?$select=id,displayName,mail,userPrincipalName,jobTitle,department,employeeType,employeeId`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph API validation failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<GraphUserProfile>;
};

export const getEmailFromProfile = (profile: GraphUserProfile): string =>
  (profile.mail || profile.userPrincipalName || '').trim().toLowerCase();
