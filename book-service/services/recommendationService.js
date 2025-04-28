//maakes calls to the recommendation service
const axios = require('axios')
require('dotenv').config();

const {saveCircuitState, circuitState} = require('../middleware/circuit-breaker');

const OPEN = 'OPEN';
const CLOSED = 'CLOSED';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS, 10);
const RESET_TIMEOUT_MS = parseInt(process.env.RESET_TIMEOUT_MS, 10);

const REC_URI = process.env.RECOMMENDATION_SERVICE_URL

const recommendationService = {


    //getRecommendations method
    async getRecommendations(isbn) {
        console.log(`[RecService] Starting getRecommendations for ISBN: ${isbn}`);
        console.log(`[RecService] Current circuit state: ${circuitState.state}`);

        // Check if circuit is open
        if (circuitState.state === OPEN) {
            const now = Date.now();
            console.log(`[RecService] Circuit is OPEN, lastOpenTime: ${circuitState.lastOpenTime}, now: ${now}`);
            console.log(`[RecService] Time elapsed since circuit opened: ${now - circuitState.lastOpenTime}ms, reset timeout: ${RESET_TIMEOUT_MS}ms`);

            // If it's open and reset timeout hasn't expired
            if (now - circuitState.lastOpenTime < RESET_TIMEOUT_MS) {
                // Return success with fallback data (empty array)
                console.log('[RecService] Circuit OPEN - returning fallback data with status 503');
                return { status: 503, data: [] };
            }
            // Otherwise, we should try again (half-open state)
            console.log('[RecService] Circuit reset timeout expired - trying service again (half-open state)');
        }

        // Circuit is CLOSED or we're testing if service is back (half-open)
        try {
            console.log(`[RecService] Calling recommendation service for ISBN ${isbn} with timeout: ${TIMEOUT_MS}ms`);
            const response = await axios.get(`${REC_URI}/recommended-titles/isbn/${isbn}`, { timeout: TIMEOUT_MS });
            console.log(`[RecService] Received successful response with status: ${response.status}`);

            // If this succeeds and circuit was OPEN, close it
            if (circuitState.state === OPEN) {
                console.log('[RecService] Service recovered - closing circuit');
                circuitState.state = CLOSED;
                saveCircuitState();
            }

            const returnStatus = response.data.length > 0 ? 200 : 204;
            console.log(`[RecService] Returning response with status: ${returnStatus}, data length: ${response.data.length}`);

            return {
                status: returnStatus,
                data: response.data
            };
        } catch (error) {
            console.log(`[RecService] Caught error: ${error.message}`);
            console.log(`[RecService] Error code: ${error.code}`);

            // Handle timeout or connection errors
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout') ||
                error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {

                // If circuit is already open, return success with fallback data
                if (circuitState.state === OPEN) {
                    console.log('[RecService] Circuit already OPEN - returning fallback data with status 503');
                    return { status: 503, data: [] };
                }

                // First timeout - open the circuit but return 503
                console.log('[RecService] First timeout - opening circuit and returning 504');
                circuitState.state = OPEN;
                circuitState.lastOpenTime = Date.now();
                saveCircuitState();
                console.log(`[RecService] Circuit state updated to: ${circuitState.state}, lastOpenTime: ${circuitState.lastOpenTime}`);

                // Return timeout status
                return { status: 504, data: [] };
            }

            // For other errors, return the error but don't trip the circuit
            console.error('[RecService] Unexpected error from recommendation service:', error.message);
            return { status: 500, data: null };
        }
    }

}

module.exports = recommendationService;