// sync-service/sync-retry.js
const { performSync } = require('./sync-logic');

async function syncWithRetry(rdsConnection, mongoClient, maxRetries = 3, delay = 1000) {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await performSync(rdsConnection, mongoClient);
            return; // Success, exit function
        } catch (error) {
            retries++;
            console.error(`Sync attempt ${retries} failed:`, error);

            if (retries >= maxRetries) {
                console.error('Max retries reached. Sync failed.');
                throw error;
            }

            // Wait before retrying
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = { syncWithRetry };