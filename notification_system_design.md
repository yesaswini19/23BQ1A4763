# Stage 1: Notification Platform REST API Design

## 1. Core Platform Actions

The notification platform does a few things for users who are logged in:

* **Fetch Notifications:** It gets a list of notifications that were sent to the user. The user can look at a number of notifications at a time and filter them to see only the ones they have not read yet.

* **Mark as Read:** It changes the status of one or more notifications so the user does not see them again.

* **Real-Time Subscriptions:** It connects the user to a feed so they get notifications right away without having to refresh the page.

## 2. REST API Specifications

### A. Fetch Student Notifications

* **Endpoint:** `GET /api/v1/notifications`

* **Headers:**

```

Authorization: Bearer <access_token>

Accept: application/json

```

* **Query Parameters:**

* `status`: The user can choose to see notifications that are read or unread.

* `page`: The user can choose which page of notifications they want to see. If they do not choose it will show the page.

* `limit`: The user can choose how notifications they want to see at a time. If they do not choose it will show 20 notifications.

* **Response Body (`200 OK`):**

```json

{

"success":

"page": 1

"limit": 20

"totalNotifications": 145

"data": [

{

"notificationID": "n_7f2b91a0-4d32-4113-9cf6-1c88d8f56efb"

"notificationType": "Placement"

"title": "New Placement Drive"

"message": "AffordMed interview slots are now open."

"isRead":

"createdAt": "2026-06-05T09:40:00Z"

}

]

}

```

### B. Mark Notification as Read

* **Endpoint:** `PATCH /api/v1/notifications/:id/read`

* **Headers:**

```

Authorization: Bearer <access_token>

Content-Type: application/json

```

* **Response Body (`200 OK`):**

```json

{

"success":

"message": "Notification updated successfully."

"data": {

"notificationID": "n_7f2b91a0-4d32-4113-9cf6-1c88d8f56efb"

"isRead":

"readAt": "2026-06-05T10:02:11Z"

}

}

```

## 3. Real-Time Notification Mechanism

To send notifications to logged-in students away the system will use WebSockets with a library like Socket.io and Node.js.

1. **Connection Lifecycle:** When a student logs in their computer starts a connection with the server.

2. **Authentication:** The students computer sends a token to the server so it knows who the student is.

3. **Dispatch:** The server sends notifications to the students computer away when it gets a new notification, for that student.