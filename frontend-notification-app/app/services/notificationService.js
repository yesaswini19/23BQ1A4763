// services/notificationService.js
const API_BASE = "http://4.224.186.213/evaluation-service";

export const fetchNotifications = async (page, limit, type) => {
    const url = `${API_BASE}/notifications?page=${page}&limit=${limit}&notification_type=${type}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer YOUR_JWT_TOKEN', // Replace with your actual token
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return await response.json();
};