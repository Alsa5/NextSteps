export type MeetTranscriptSegment = {
  text: string;
  startTime: string;
  endTime: string;
};

export type MeetTranscript = {
  conferenceRecordId: string;
  segments: MeetTranscriptSegment[];
  source: 'stub' | 'google';
};

export type ConferenceRecord = {
  name: string;
  meetingCode: string;
  startTime: string;
  endTime: string;
};

export type ListConferenceRecordsParams = {
  meetingCode: string;
};

export type BuildAuthorizationUrlParams = {
  state: string;
};
