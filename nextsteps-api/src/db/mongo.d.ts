import { type Db } from 'mongodb';
/** Cosmos / Mongo collection names — partition keys documented in scripts/init-db.ts */
export declare const NEXTSTEPS_COLLECTIONS: {
    readonly USERS: "users";
    readonly ROLE_MAPPINGS: "role_mappings";
    readonly TRAINEE_REGISTRY: "trainee_registry";
    readonly GOOGLE_OAUTH_TOKENS: "google_oauth_tokens";
    readonly NOTIFICATIONS: "notifications";
    readonly SESSIONS: "sessions";
    readonly SESSION_TRANSCRIPTS: "session_transcripts";
    readonly TRANSCRIPTS: "transcripts";
    readonly QUIZ_SUBMISSIONS: "quiz_submissions";
    readonly QUIZZES: "quizzes";
    readonly FEEDBACK_SUBMISSIONS: "feedback_submissions";
    readonly BATCH_FEEDBACK_STATE: "batch_feedback_state";
    readonly AUDIT_LOGS: "audit_logs";
    readonly MAVERICK_BATCH_MEMBERSHIPS: "maverick_batch_memberships";
    readonly P7_BATCH_METRICS: "p7_batch_metrics";
    readonly P7_TOP_PERFORMERS: "p7_top_performers";
    readonly P7_REMINDER_TIMINGS: "p7_reminder_timings";
    readonly P7_CURRICULUM_RECOMMENDATIONS: "p7_curriculum_recommendations";
};
export declare const connectMongo: () => Promise<Db>;
export declare const getDb: () => Db;
export declare const closeMongo: () => Promise<void>;
