export interface MeetTranscriptSegment {
  startOffset: string;
  text: string;
}

export interface MeetTranscriptPayload {
  rawText: string;
  segments: MeetTranscriptSegment[];
}

export interface GoogleMeetClient {
  fetchTranscript(sessionId: string, meetConferenceId?: string): Promise<MeetTranscriptPayload>;
}

export class StubGoogleMeetClient implements GoogleMeetClient {
  async fetchTranscript(sessionId: string): Promise<MeetTranscriptPayload> {
    return {
      rawText: `Stub transcript for session ${sessionId}. At 34:00 interface vs abstract class discussion. At 52:00 multiple inheritance workaround caused confusion.`,
      segments: [
        { startOffset: '00:00', text: `Session ${sessionId} started.` },
        {
          startOffset: '34:00',
          text: 'Interface vs abstract class distinction caused questions.',
        },
        {
          startOffset: '52:00',
          text: 'Multiple inheritance workaround caused confusion.',
        },
      ],
    };
  }
}
