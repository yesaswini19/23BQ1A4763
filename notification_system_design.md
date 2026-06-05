#Stage 1: Notification Platform REST API Design

# 1. Core Platform Actions

The notification platform does a few things for users who are logged in:

Fetch Notifications: It gets a list of notifications that were sent to the user. The user can look at a number of notifications at a time and filter them to see only the ones they have not read yet.

Mark as Read: It changes the status of one or more notifications so the user does not see them again.

Real-Time Subscriptions: It connects the user to a feed so they get notifications right away without having to refresh the page.

# 2. REST API Specifications

A. Fetch Student Notifications

Endpoint: `GET /api/v1/notifications`
* Headers:

Authorization: Bearer <access_token>
Accept: application/json

Query Parameters:

* status: The user can choose to see notifications that are read or unread.
* page: The user can choose which page of notifications they want to see. If they do not choose it will show the page.
* limit: The user can choose how notifications they want to see at a time. If they do not choose it will show 20 notifications.


Response Body ('200 OK'):

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
     }]

}

# B. Mark Notification as Read

* Endpoint: "PATCH /api/v1/notifications/:id/read"

* Headers:

Authorization: Bearer <access_token>
Content-Type: application/json

* Response Body ('200 OK'):

{
    "success":
    "message": "Notification updated successfully."
    "data": {
    "notificationID": "n_7f2b91a0-4d32-4113-9cf6-1c88d8f56efb"
    "isRead":
    "readAt": "2026-06-05T10:02:11Z"
}

}


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

sql students table ---

CREATE TABLE students (

student_id VARCHAR(50) PRIMARY KEY,

name VARCHAR(100) NOT REQUIRED TO BE NULL,

email VARCHAR(150) UNIQUE AND NOT NULL,

roll_no VARCHAR(20) UNIQUE AND NOT NULL

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

sql notifications table----
 
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


command --

CREATE INDEX, idx_student_unread_date ON notifications (student_id, is_read, created_at ASC);


* Optimized structured query designed to search for all students who received a Placement category notification within the trailing 7-day period:

      SELECT DISTINCT s.student_id, s.name, s.email, s.roll_no 
      FROM students s  JOIN notifications n ON s.student_id = n.student_id
      WHERE n.notification_type = 'Placement'
      AND n.created_at >= NOW() - INTERVAL 7 DAY;


  ------------------------------------------------------------------------------------
  # Stage 4: High-Load Performance and Caching Strategy

# 1. Core Solutions for Database Overwhelm
To stop the database from getting overwhelmed on every page load we need to implement some solutions.
Here are a few ideas:

* In-Memory Caching using Redis: We can store unread notifications for each student directly in memory. This way when a user loads a page the system reads from the fast memory layer of querying the database disk.

* Service Worker and Client-Side Caching: We can cache the last received notification array directly in the students browser storage like IndexedDB or LocalStorage. The user interface loads the cached data instantly while checking the server for updates in the background.

#2. Architectural Performance Tradeoffs

Strategy A: Using Redis for In-Memory Caching----

The good things about this approach are:

* It massively reduces database read operations, which prevents connection pool exhaustion.

* It provides -millisecond response latency for fetching notification feeds.

However there are some challenges:

* We need to handle cache invalidation. When a student marks a notification as read the backend must. Update both the Redis key and the persistent database row. This is to prevent out-of-sync states.

* Running a high-availability Redis cluster requires system memory and hosting resources, which increases infrastructure costs.

# Strategy B: Client-Side Storage with Background Sync

The advantages of this approach are:

* It has zero server overhead for initial page loads if data is served from browser storage.

* It provides an instant user interface experience under poor network conditions.

However there are some tradeoffs:

* If background syncing lags students might see notification statuses, for a short period.

* The storage persistence depends heavily on browser clear-cache policies and user device memory constraints.

---------------------------------------------------------------------------------------
# Stage 5: Distributed Event Processing & Message Queues

1.Shortcomings of the Current Implementation--

The loop implementation has big problems when handling 50,000 students:

* Synchronous Bottleneck:Doing HTTP API calls (`send_email`) and database inserts (`save_to_db`) one by one in a single loop slows things down. If each iteration takes 100ms processing 50,000 users would take over 80 minutes, which's too slow.

* Single Point of Failure:If the email API fails or times out for some students, the rest of the students in the list won't get their database inserts or in-app push messages.

* Lack of Fault Tolerance:When 200 student emails failed those events were lost because theres no way to retry them or track their state.

# 2. Process Decoupling Strategy
Saving notifications to the database and sending emails should happen separately not together.

Concerns:

* Immediate System Action:The database layer should be fast and lightweight.

* Asynchronous Jobs: Heavy network operations like sending emails should be done separately using a message broker (like RabbitMQ or AWS SQS). This way if one fails it won't affect the system.

# 3. Redesigned System Architecture
To make this process reliable and fast we're breaking down the loop into a Publisher-Worker model using background queues.

Producer Of doing tasks directly the main app creates a small event job for each student and pushes them into a queue.

#Background Consumer Workers

Independent worker processes take these jobs from the queue. If an email server times out for some students only those jobs are sent to a *Dead Letter Queue (DLQ)** or scheduled for a retry without stopping the main platform.

# 4. Pseudocode

function notify_all(student_ids: array, message: string):
     for student_id in student_ids:
          job_payload = {
          "student_id": student_id
          "message": message,
          "attempt": 1
          }
          push_to_message_queue("notification_jobs" job_payload)

function notification_worker_process():
    while true:
         job = pop_from_message_queue("notification_jobs")
    if job is null:
         wait()
         continue
    try:

        save_to_db(job.student_id, job.message)
        push_to_app(job.student_id, job.message)
        email_status = send_email(job.student_id, job.message)
        if email_status == failed:
            raise Exception("Email API transmission failed")

    except Exception as e:
        if job.attempt < 3:  
             job.attempt = job.attempt +1
             push_to_message_queue("notification_jobs" job)
        else:
             push_to_dead_letter_queue("failed_notifications" job)

----------------------------------------------------------------------------

# Stage 6: Priority Queue Processing & Real-Time Top K Maintenance

1. Architectural Strategy for Real-Time Priority Tracking

To keep track of the 10 most important unread notifications when we get a lot of them all the time the application uses a special kind of list called a Min-Heap Priority Queue that can only hold 10 things. This Priority Queue is stored in the computers memory.

Q.Why use a Min-Heap of regular sorting?

Sorting a list:When we sort a list we have to sort the whole thing every time we add or remove something and that takes a lot of time.

Fixed-Size Min-Heap:When we use a Min-Heap it is much faster to add something. We can do it in a lot time. We make sure the Min-Heap only has 10 things in it. The important thing is always at the top. If a new notification is more important than the one, at the top we get rid of the one and put the new one in its place. This happens quickly.

2. Priority Weights Algorithm Matrix

We sort the notifications based on what kind of notification they're how important they are. If two notifications are the kind we use the time they were made to figure out which one is more important.

Priority Score = (Type Weight * 10^13) + Timestamp

Based on Notification Type ,Weight Multiplier , Description:

1.Placement - 3 -This is the important kind of notification.
2.Result    - 2 -This kind of notification is pretty important.
3.Event     - 1 - This is a kind of notification.

-------------------------------------------------