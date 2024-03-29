<h1>MERN STACK TASK MANAGEMENT</h1>

- Server running on port 3002
- View running on port 3000
- include res.send() to get a response on front end side

- `npm start` in root folder to run concurrently scripts

<h3>Setting up environment</h3>

- [x] mySQL MODEL
- [x] Expressjs CONTROLLER
- [x] Reactjs VIEW
- [x] Nodejs SERVER

PHASE 1 IDENTITY ACCESS MANAGEMENT

<h2>Login</h2> 
POST request to send input to database and check

route: /login

- [x] login screen
- [x] conditional login header
- [x] validate if user exist

<h2>User Management</h2>
POST request to add users from input

route: /management

- [x] add user route: /add
- [x] validate if user exist

- [x] validate password
- [x] validate email
- validator returns True/False
- if all is True -> send query
- if any field is False -> dont send query

- [x] add username, password, email, role

run database for login user  
check if column value is empty

route: /update

- [x] update password for current user
- [x] update email for current user
- [x] update group for current user

<h2>User Group Management</h2>

- [x] change input to option for group
- [] CheckGroup(userid, usergroup)

<h2>Privilege User Management & Security</h2>

- [x] admin account

  - [x] create user
  - [x] map out user groups and insert into db

  - [x] disable user == no login
  - [x] update account password, email, group details
  - [x] display users

- [x] enable/disable users (POST request to update)
- [x] password validation
- [x] bcrypt password encryption
- [x] decrypt password for compare
- [x] 8-10 characters (numbers, alphabets, special characters)

<h2>Conditional Rendering based on user group</h2>

admin:

- [x] management page
- change password
- change email
- disable account

==============================================

PHASE 2 TASK MANAGEMENT FLOW
TASK FLOW: OPEN -> TODO -> DOING -> DONE -> CLOSE

OPEN state:

- Project lead able to edit description

- [x] MYSQL MODEL
- PRIMARY KEY: app_acronym, plan_app_acronym, task_app_acronym

- Create App
  Optional fields

  - description
  - permit permissions

- Create Task
  Optional fields

  - description
  - notes
  - deadline
  - plan

- EVERYONE
- view applications
- not able to edit/ view tasks linked to applications not assigned to them

- [x] Running Number: auto increment after adding the 1st Application
- compare largest running number and +1

- [x] Check group for different permit (fetch from backend)

==============================================

- [x] Project Lead
- [x] create new apps
- [x] create new open tasks
- [x] assign permits
- [x] close tasks, demote tasks to doing

- [x] Edit Application
- [x] description
- [x] deadline
- [x] permits check

- [x] Edit Task (OPEN - DOING)
- [x] new notes
- [x] assign plan

==============================================

- [x] Project Manager
- [x] view tasks
- [x] approve tasks
- [x] assign task to plan
- [x] approve done to close task

- [x] Edit tasks (OPEN - DOING)
- [x] new notes
- [x] assign plan

==============================================

- [x] Team Member
- [x] complete tasks
- [x] add notes

- Validation of which user-group can perform state actions
- Email notification when team member complete tasks
- SYSTEM GENERATED: task_id = app_acronym + app_runningNumber
- audit trail of read-only notes

PHASE 3 API
All API requires login auth before any action
[x] CreateTask API
[x] GetTaskbyState
[x] PromoteTaskToDone

PHASE 4 CONTAINERIZE BACKEND

Changing to Dockers:
.env update SERVER_HOST to "host.docker.internal"

client/package.json update proxy to "http://host.docker.internal:4000"

Done with docker-compose:

- Get mySQL image
- Build mySQL image and run detached

- Build Dockerfile


