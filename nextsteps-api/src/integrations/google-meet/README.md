# Google Meet integration (ALSAA-20)

Stub-mode Google Meet client and OAuth configuration for P4 session intelligence.
Live API calls and token persistence are implemented in ALSAA-21.

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | Live mode | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Live mode | — | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3001/api/v1/integrations/google-meet/oauth/callback` | OAuth redirect |
| `GOOGLE_MEET_WORKSPACE_DOMAIN` | No | — | Workspace domain hint (`hd` param) until HR/DevOps confirms Q3 |
| `GOOGLE_MEET_STUB_MODE` | No | `true` when credentials absent | Return fixture transcripts |
| `GOOGLE_OAUTH_SCOPES` | No | `meetings.space.readonly` | Comma-separated OAuth scopes |

## Default OAuth scopes

- `https://www.googleapis.com/auth/meetings.space.readonly` — read conference records and transcripts

Add `https://www.googleapis.com/auth/drive.readonly` via `GOOGLE_OAUTH_SCOPES` if transcript artifacts are stored in Drive.

## Usage

```typescript
import { GoogleMeetClient, loadGoogleMeetOAuthConfig } from './integrations/google-meet/index.js';

const config = loadGoogleMeetOAuthConfig();
const meetClient = new GoogleMeetClient(config);

const records = await meetClient.listConferenceRecords({ meetingCode: 'abc-defg-hij' });
const transcript = await meetClient.fetchTranscript(records[0].name);
```

## Tests

```bash
npm test
```
