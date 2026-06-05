async function Log(stack, level, pkg, message) {
    // Updated with your new token
    const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ5ZXNhc3dpbmlwYW1kaTE5QGdtYWlsLmNvbSIsImV4cCI6MTc4MDY0MjQ2MywiaWF0IjoxNzgwNjQxNTYzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNzFkZDIwYWItMWViOS00MmQyLTgyOWQtMzhmMDNjMDFkN2ZlIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicGFtaWRpIHllc2Fzd2luaSIsInN1YiI6IjNmYzlhZmYwLWIwOTAtNGQzNi04ZWQ2LWIyNTkwNTVmNjY0YiJ9LCJlbWFpbCI6Inllc2Fzd2luaXBhbWRpMTlAZ21haWwuY29tIiwibmFtZSI6InBhbWlkaSB5ZXNhc3dpbmkiLCJyb2xsTm8iOiIyM2JxMWE0NzYzIiwiYWNjZXNzQ29kZSI6IlFRZEVZeSIsImNsaWVudElEIjoiM2ZjOWFmZjAtYjA5MC00ZDM2LThlZDYtYjI1OTA1NWY2NjRiIiwiY2xpZW50U2VjcmV0IjoiRUprTm5CY3puTW5SS3hzQiJ9.-27FB66pZ_ZQPcnRLEIFxgcai5bJz0A7OYWDjsDqDIY";
    
    const LOG_ENDPOINT = "http://4.224.186.213/evaluation-service/logs";

    const payload = {
        stack: stack,
        level: level,
        package: pkg,
        message: message
    };

    try {
        const response = await fetch(LOG_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Log created successfully. LogID: ${data.logID}`);
            return data;
        } else {
            console.error("❌ Test server rejected log payload:", data);
        }
    } catch (error) {
        console.error("💥 Error connecting to logging server:", error.message);
    }
}

module.exports = { Log };