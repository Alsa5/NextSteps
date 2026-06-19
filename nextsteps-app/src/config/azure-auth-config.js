const clientId = import.meta.env.VITE_AZURE_CLIENT_ID
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID

function resolveRedirectUri() {
  // Same as Sanctuary: runtime origin + /auth/callback (works on any dev port)
  return `${window.location.origin}/auth/callback`
}

const redirectUri = resolveRedirectUri()

if (!clientId || !tenantId) {
  console.error('Missing Azure AD configuration!')
  console.error('Set VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID in your .env file')
}

export const msalConfig = {
  auth: {
    clientId: clientId || 'dummy-client-id',
    authority: `https://login.microsoftonline.com/${tenantId || 'common'}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
}

export const tokenRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
}

export const graphMeSelect =
  'id,displayName,mail,userPrincipalName,jobTitle,department,employeeType'
