<h1>MERN STACK TASK MANAGEMENT</h1>

- Server running on port 3002
- View running on port 3000
- include res.send() to get a response on react

- `npm start` in root folder to run concurrently scripts

<h3>Setting up environment</h3>

- [x] mySQL MODEL
- [x] Expressjs CONTROLLER
- [x] Reactjs VIEW
- [x] Nodejs SERVER

- import connection module into every CONTROLLER file

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

user:

- [x] view tasks
- [x] manage tasks
