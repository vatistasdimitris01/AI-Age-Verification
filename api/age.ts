import verifyAgeHandler from './verify-age';

/**
 * This endpoint is a user-friendly alias for /api/verify-age.
 * It performs the complete multi-step verification process (liveness, analysis, consistency check)
 * in a single server-side call, designed for backend-to-backend integrations.
 */
export default verifyAgeHandler;
