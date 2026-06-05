const { Log } = require('./logging_middleware/logger');

async function runTest() {
    console.log("--- Starting Logger Connectivity Test ---");
    
    // Call the Log function as if the application were running
    await Log(
        "backend", 
        "info", 
        "test-harness", 
        "Connectivity test: Verifying if the logging middleware can reach the server."
    );
    
    console.log("--- Test Complete ---");
}

runTest();