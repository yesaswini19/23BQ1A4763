const { Log } = require('./logging_middleware/logger');

const TYPE_WEIGHTS = {
    'Placement': 3,
    'Result': 2,
    'Event': 1
};

function calculatePriority(notification) {
    const weight = TYPE_WEIGHTS[notification.Type] || 0;
    const timeFactor = new Date(notification.Timestamp).getTime();
    return (weight * 10000000000000) + timeFactor;
}

class FixedMinHeap {
    constructor(maxSize) {
        this.heap = [];
        this.maxSize = maxSize;
    }
    insert(item) {
        if (this.heap.length < this.maxSize) {
            this.heap.push(item);
            this.bubbleUp(this.heap.length - 1);
        } else if (item.priorityScore > this.heap[0].priorityScore) {
            this.heap[0] = item;
            this.sinkDown(0);
        }
    }
    bubbleUp(index) {
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].priorityScore >= this.heap[parentIndex].priorityScore) break;
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }
    sinkDown(index) {
        let left = 2 * index + 1;
        let right = 2 * index + 2;
        let smallest = index;
        const length = this.heap.length;

        if (left < length && this.heap[left].priorityScore < this.heap[smallest].priorityScore) {
            smallest = left;
        }
        if (right < length && this.heap[right].priorityScore < this.heap[smallest].priorityScore) {
            smallest = right;
        }
        if (smallest !== index) {
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            this.sinkDown(smallest);
        }
    }
    getSortedItems() {
        return [...this.heap].sort((a, b) => b.priorityScore - a.priorityScore);
    }
}

async function processTopNotifications() {
    const API_URL = 'http://4.224.186.213/evaluation-service/notifications';
    // Updated with your current valid token:
    const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ5ZXNhc3dpbmlwYW1kaTE5QGdtYWlsLmNvbSIsImV4cCI6MTc4MDY0MjQ2MywiaWF0IjoxNzgwNjQxNTYzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNzFkZDIwYWItMWViOS00MmQyLTgyOWQtMzhmMDNjMDFkN2ZlIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicGFtaWRpIHllc2Fzd2luaSIsInN1YiI6IjNmYzlhZmYwLWIwOTAtNGQzNi04ZWQ2LWIyNTkwNTVmNjY0YiJ9LCJlbWFpbCI6Inllc2Fzd2luaXBhbWRpMTlAZ21haWwuY29tIiwibmFtZSI6InBhbWlkaSB5ZXNhc3dpbmkiLCJyb2xsTm8iOiIyM2JxMWE0NzYzIiwiYWNjZXNzQ29kZSI6IlFRZEVZeSIsImNsaWVudElEIjoiM2ZjOWFmZjAtYjA5MC00ZDM2LThlZDYtYjI1OTA1NWY2NjRiIiwiY2xpZW50U2VjcmV0IjoiRUprTm5CY3puTW5SS3hzQiJ9.-27FB66pZ_ZQPcnRLEIFxgcai5bJz0A7OYWDjsDqDIY";

    await Log("backend", "info", "utils", "Initiating raw notification processing job");
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`API responded with status code ${response.status}`);
        }
        const data = await response.json();
        const notifications = data.notifications || data;
        const heap = new FixedMinHeap(10);
        notifications.forEach(item => {
            item.priorityScore = calculatePriority(item);
            heap.insert(item);
        });
        const top10 = heap.getSortedItems();
        console.log("=== TOP 10 PRIORITY NOTIFICATIONS ===");
        console.dir(top10, { depth: null, colors: true });
        await Log("backend", "info", "utils", "Successfully compiled");
        return top10;

    } catch (error) {
        await Log("backend", "error", "utils", `Execution fault encountered in sorting engine: ${error.message}`);
        console.error("Sorting engine operational error:", error.message);
    }
}
processTopNotifications();