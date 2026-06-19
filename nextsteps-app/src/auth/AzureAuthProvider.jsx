import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { InteractionStatus, PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react'
import { msalConfig, loginRequest, tokenRequest } from '../config/azure-auth-config'
import {
  clearAppToken,
  exchangeSsoForAppToken,
  fetchCurrentUser,
  fetchGraphPhoto,
  fetchGraphProfile,
  getAppToken,
  setAppToken,
} from '../config/api-client'
import { cacheProfilePhoto, getCachedProfilePhoto, resolveProfilePhotoUrl } from '../utils/userDisplay'
import toast from 'react-hot-toast'

const msalInstance = new PublicClientApplication(msalConfig)

const AzureAuthContext = createContext(null)

const hasPendingMsalInteraction = () => {
  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.includes('msal.interaction.status')) return true
    }
  } catch {
    /* private mode */
  }
  return false
}

const AzureAuthProviderInner = ({ children, onAuthenticated }) => {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [account, setAccount] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const onAuthenticatedRef = useRef(onAuthenticated)
  const loginInFlightRef = useRef(false)
  const bootstrapDoneRef = useRef(false)

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated
  }, [onAuthenticated])

  const activeHomeAccountId = accounts[0]?.homeAccountId ?? null

  useEffect(() => {
    if (!activeHomeAccountId) {
      setAccount(null)
      return
    }
    setAccount(accounts[0] ?? null)
  }, [activeHomeAccountId, accounts])

  const completeSso = useCallback(
    async (authResult) => {
      const [profile, photoDataUrl] = await Promise.all([
        fetchGraphProfile(authResult.accessToken),
        fetchGraphPhoto(authResult.accessToken),
      ])
      const { user, token } = await exchangeSsoForAppToken(authResult.accessToken, profile)
      setAppToken(token)
      const enriched = {
        ...user,
        employeeId: profile.employeeId || user.hexId || null,
        graphPhotoUrl: photoDataUrl,
      }
      cacheProfilePhoto(resolveProfilePhotoUrl({ graphPhotoUrl: photoDataUrl, email: user.email }))
      onAuthenticatedRef.current?.(enriched)
      return enriched
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        await instance.initialize()

        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('logout') === 'true') {
          return
        }

        const redirectResult = await instance.handleRedirectPromise()
        if (redirectResult) {
          await completeSso(redirectResult)
          return
        }

        const existingToken = getAppToken()
        if (existingToken) {
          const user = await fetchCurrentUser()
          if (cancelled) return
          if (user) {
            let graphPhotoUrl = getCachedProfilePhoto()

            const msalAccount = instance.getAllAccounts()[0]
            if (msalAccount) {
              try {
                const tokenResponse = await instance.acquireTokenSilent({
                  account: msalAccount,
                  scopes: tokenRequest.scopes,
                })
                const photoDataUrl = await fetchGraphPhoto(tokenResponse.accessToken)
                if (photoDataUrl) {
                  graphPhotoUrl = photoDataUrl
                  cacheProfilePhoto(photoDataUrl)
                }
              } catch {
                /* keep cached or email-based photo */
              }
            } else if (!graphPhotoUrl) {
              const emailPhoto = resolveProfilePhotoUrl({ email: user.email })
              if (emailPhoto) cacheProfilePhoto(emailPhoto)
            }

            onAuthenticatedRef.current?.({
              ...user,
              graphPhotoUrl: graphPhotoUrl || null,
            })
          } else {
            clearAppToken()
          }
        }
      } catch (error) {
        if (cancelled) return
        console.error('[SSO] bootstrap failed', error)
        clearAppToken()
        toast.error(error.message || 'Sign-in failed')
      } finally {
        if (!cancelled) {
          bootstrapDoneRef.current = true
          setIsBootstrapping(false)
        }
      }
    }

    bootstrap()

    const safetyTimer = window.setTimeout(() => {
      setIsBootstrapping(false)
    }, 4000)

    return () => {
      cancelled = true
      window.clearTimeout(safetyTimer)
    }
  }, [instance, completeSso])

  const login = async () => {
    if (loginInFlightRef.current) {
      return
    }

    if (inProgress !== InteractionStatus.None || hasPendingMsalInteraction()) {
      const err = new Error('Sign-in is already in progress. Wait a moment, or refresh and try again.')
      err.errorCode = 'interaction_in_progress'
      throw err
    }

    loginInFlightRef.current = true

    try {
      await instance.initialize()

      // MSAL requires redirect handling to finish before any new interactive call
      await instance.handleRedirectPromise()

      if (!bootstrapDoneRef.current) {
        await new Promise((resolve) => {
          const check = () => {
            if (bootstrapDoneRef.current) {
              resolve()
              return
            }
            window.setTimeout(check, 50)
          }
          check()
        })
      }

      await instance.loginRedirect(loginRequest)
    } catch (error) {
      loginInFlightRef.current = false

      if (error?.errorCode === 'interaction_in_progress') {
        try {
          const keysToRemove = []
          for (let i = 0; i < sessionStorage.length; i += 1) {
            const key = sessionStorage.key(i)
            if (key?.startsWith('msal.')) keysToRemove.push(key)
          }
          keysToRemove.forEach((key) => sessionStorage.removeItem(key))
        } catch {
          /* ignore */
        }
      }

      const message =
        error?.errorCode === 'interaction_in_progress'
          ? 'Microsoft sign-in was already in progress — cleared. Click SSO once more.'
          : error?.message || 'Microsoft sign-in failed'
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    clearAppToken()
    onAuthenticated?.(null)

    try {
      await instance.initialize()
      await instance.logoutRedirect({
        account: account || undefined,
        postLogoutRedirectUri: `${window.location.origin}/auth/callback?logout=true`,
      })
    } catch {
      window.location.href = '/'
    }
  }

  const getAccessToken = useCallback(async () => {
    if (!account) return null

    try {
      await instance.initialize()
      const response = await instance.acquireTokenSilent({
        account,
        scopes: tokenRequest.scopes,
      })
      return response.accessToken
    } catch {
      await instance.acquireTokenRedirect({ scopes: tokenRequest.scopes })
      return null
    }
  }, [account, instance])

  return (
    <AzureAuthContext.Provider
      value={{
        account,
        isAuthenticated,
        isBootstrapping,
        login,
        logout,
        getAccessToken,
        completeSso,
      }}
    >
      {children}
    </AzureAuthContext.Provider>
  )
}

export const AzureAuthProvider = ({ children, onAuthenticated }) => (
  <MsalProvider instance={msalInstance}>
    <AzureAuthProviderInner onAuthenticated={onAuthenticated}>{children}</AzureAuthProviderInner>
  </MsalProvider>
)

export const useAzureAuth = () => {
  const context = useContext(AzureAuthContext)
  if (!context) {
    throw new Error('useAzureAuth must be used within AzureAuthProvider')
  }
  return context
}
