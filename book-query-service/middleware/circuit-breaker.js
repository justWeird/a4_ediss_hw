//import needed modules
const fs = require('fs');
const { Mutex } = require('async-mutex');
const mutex = new Mutex();
const path = require('path');
const axios = require('axios');

//configure the state
const circuitStateFile = path.join('/app/circuit-state', 'state.json');
// local state.json
// const circuitStateFile = path.join('./config', 'state.json');
const OPEN = 'OPEN';
const CLOSED = 'CLOSED';

//default state is CLOSED
let circuitState = {
    state: CLOSED,
    lastOpenTime: null
};

//try to load state from volume
try {

    //if the file path doesn't exist, create it
    const stateDir = path.dirname(circuitStateFile);

    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
        console.log(`Creating circuit breaker state directory: ${stateDir}`);
    }

    if (fs.existsSync(circuitStateFile)) {
        circuitState = JSON.parse(fs.readFileSync(circuitStateFile, 'utf8'));
        console.log('Loaded circuit state from file', circuitState);
    } else {
        //carry on with closed state
        saveCircuitState();
        console.log('Initialized circuit state file');
    }
} catch (err) {
    console.error('Error loading circuit state:', err);
}

async function saveCircuitState() {

    //use mutex to avoid parallel processing issues where state isn't preserved
    const release = await mutex.acquire();

    try {
        fs.writeFileSync(circuitStateFile, JSON.stringify(circuitState));
    } catch (err) {
        console.error('Error saving circuit state:', err);
    } finally {
        release();      //unlocks file access so others can use it.
    }
}

module.exports = {saveCircuitState, circuitState};