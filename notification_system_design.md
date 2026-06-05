#Stage 1: Notification Platform REST API Design

# 1. Core Platform Actions

The notification platform does a few things for users who are logged in:

Fetch Notifications: It gets a list of notifications that were sent to the user. The user can look at a number of notifications at a time and filter them to see only the ones they have not read yet.

Mark as Read: It changes the status of one or more notifications so the user does not see them again.

Real-Time Subscriptions: It connects the user to a feed so they get notifications right away without having to refresh the page.

# 2. REST API Specifications

A. Fetch Student Notifications

Endpoint: `GET /api/v1/notifications`
Headers:

```
Authorization: Bearer <access_token>
Accept: application/json
```

Query Parameters:

* `status`: The user can choose to see notifications that are read or unread.
* `page`: The user can choose which page of notifications they want to see. If they do not choose it will show the page.
* `limit`: The user can choose how notifications they want to see at a time. If they do not choose it will show 20 notifications.

Response Body (`200 OK`):
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
# B. Mark Notification as Read

Endpoint: `PATCH /api/v1/notifications/:id/read`
Headers:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```
Response Body (`200 OK`):
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
# 3. Real-Time Notification Mechanism
To send notifications to logged-in students away the system will use WebSockets with a library like Socket.io and Node.js.
1.Connection Lifecycle:When a student logs in their computer starts a connection with the server.
2.Authentication: The students computer sends a token to the server so it knows who the student is.
3.Dispatch: The server sends notifications to the students computer away when it gets a new notification, for that student.

------------------------------------------------------------------------------------------

# Stage 2: Persistent Storage and Schema Design

#1. Storage Choice: Relational Database (MySQL / PostgreSQL)

We choose a Relational Database like MySQL or PostgreSQL for our storage needs.
Here are the reasons why:

ACID Compliance: This is important because it ensures that our transactions are completed properly without any issues.

Structured Relations:We have relationships between Students and individual Notifications which makes it easy to manage.

Complex Indexing Capability: This feature helps us optimize fields like student filters and timestamps.

# 2. Database Schema

```sql

CREATE TABLE students (

student_id VARCHAR(50) PRIMARY KEY,

name VARCHAR(100) NOT REQUIRED TO BE NULL,

email VARCHAR(150) UNIQUE AND NOT NULL,

roll_no VARCHAR(20) UNIQUE AND NOT NULL

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE notifications (

notification_id VARCHAR(50) PRIMARY KEY,

student_id VARCHAR(50) NOT NULL

notification_type Can be 'Event' 'Result' or 'Placement'

title VARCHAR(200) NOT REQUIRED TO BE NULL

message TEXT NOT REQUIRED TO BE NULL

is_read BOOLEAN DEFAULT FALSE AND NOT NULL

created_at TIMESTAMP DEFAULT, CURRENT_TIMESTAMP

FOREIGN KEY (student_id) REFERENCES students(student_id) ON CASCADE

);

--------------------------------------------------------------------
# Stage 3: Query Optimization & Indexing Analysis

#1. Evaluation of Existing Query

# Is the query accurate?

The query is accurate. It gets the entries for a specific student. These entries are sorted from oldest to newest.

# Why is this query executing slowly?

We have a lot of logs in the database. 5,000,000 Of them. If the database does not have indexes it has to read the rows one by one from the disk. This is called a Full Table Scan. When we sort the data using ORDER BY createdAt ASC it does a sorting operation in the system memory. This operation is called FileSort.

# Recommended Change & Optimization Strategy

We need to make some changes to the query. We should add a Composite Index that covers the columns we use in the WHERE clause and the sorting keys. Here is what we can do:

```sql

CREATE INDEX, idx_student_unread_date ON notifications (student_id, is_read, created_at ASC);

```
Optimized structured query designed to search for all students who received a Placement category notification within the trailing 7-day period:

SELECT DISTINCT s.student_id, s.name, s.email, s.roll_no 
FROM students s
JOIN notifications n ON s.student_id = n.student_id
WHERE n.notification_type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL 7 DAY;

  