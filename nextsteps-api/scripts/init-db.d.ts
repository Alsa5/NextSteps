#!/usr/bin/env node
/**
 * MongoDB Database Initialization Script for NextSteps
 *
 * Creates required collections and seeds essential configuration data.
 * Safe for production - does NOT create fake/sample users, quizzes, or submissions.
 * Idempotent - safe to run multiple times without creating duplicates.
 *
 * Usage: npm run init-db
 */
declare function initializeDatabase(): Promise<void>;
export { initializeDatabase };
