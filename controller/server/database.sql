-- CREATE DATABASE AND TABLES

CREATE DATABASE IF NOT EXISTS nodelogin;
USE nodelogin;

CREATE TABLE IF NOT EXISTS accounts (
  username varchar(50) NOT NULL,
  password varchar(255) NOT NULL,
  email varchar(100) DEFAULT NULL,
  admin_privilege tinyint DEFAULT '0',
  user_group varchar(255) DEFAULT NULL,
  status enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  timestamp datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (username),
  UNIQUE KEY username_UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS application (
  app_acronym varchar(255) NOT NULL,
  app_description longtext,
  app_Rnum int DEFAULT NULL,
  app_startDate date DEFAULT NULL,
  app_endDate date DEFAULT NULL,
  app_permitCreate varchar(255) DEFAULT NULL,
  app_permitOpen varchar(255) DEFAULT NULL,
  app_permitToDo varchar(255) DEFAULT NULL,
  app_permitDoing varchar(255) DEFAULT NULL,
  app_permitDone varchar(255) DEFAULT NULL,
  app_createdDate datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (app_acronym)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS usergroup (
  username varchar(255) NOT NULL,
  user_group varchar(255) NOT NULL,
  PRIMARY KEY (user_group,username),
  KEY username_idx (username),
  KEY groupname_idx (user_group),
  CONSTRAINT username FOREIGN KEY (username) REFERENCES accounts (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS groupnames (
  groupname varchar(255) NOT NULL,
  PRIMARY KEY (groupname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS plan (
  plan_mvp_name varchar(255) NOT NULL,
  plan_app_acronym varchar(255) DEFAULT NULL,
  plan_color varchar(7) DEFAULT NULL,
  plan_startDate datetime NOT NULL,
  plan_endDate datetime NOT NULL,
  PRIMARY KEY (plan_mvp_name),
  KEY plan_app_acronym (plan_app_acronym),
  KEY plan_color (plan_color),
  CONSTRAINT plan_app_acronym FOREIGN KEY (plan_app_acronym) REFERENCES application (app_acronym)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS task (
  task_app_acronym varchar(45) NOT NULL,
  task_id varchar(255) DEFAULT NULL,
  task_name varchar(255) NOT NULL,
  task_description longtext,
  task_notes longtext,
  task_plan varchar(255) DEFAULT NULL,
  task_color varchar(7) DEFAULT NULL,
  task_state enum('Open','ToDo','Doing','Done','Closed') DEFAULT 'Open',
  task_creator varchar(255) DEFAULT NULL,
  task_owner varchar(255) DEFAULT NULL,
  task_createDate datetime DEFAULT NULL,
  PRIMARY KEY (task_app_acronym,task_name),
  KEY task_name (task_name),
  KEY task_plan (task_plan),
  KEY task_color_idx (task_color),
  CONSTRAINT task_app_acronym FOREIGN KEY (task_app_acronym) REFERENCES application (app_acronym),
  CONSTRAINT task_color FOREIGN KEY (task_color) REFERENCES plan (plan_color),
  CONSTRAINT task_plan FOREIGN KEY (task_plan) REFERENCES plan (plan_mvp_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE IF NOT EXISTS task_notes (
  task_name varchar(255) NOT NULL,
  task_note longtext,
  last_updated datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_name,last_updated),
  CONSTRAINT task_name FOREIGN KEY (task_name) REFERENCES task (task_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ADD DATA INTO DATABASE
INSERT INTO groupnames VALUES ("admin"), ("project lead"), ("project manager"), ("team member");

-- PRESET USERS
INSERT INTO accounts (username, password, email, user_group, admin_privilege, timestamp) VALUES 
("admin", "$2b$10$0hH2X8x0ON.d7f9TMY1GcO4UfT6hpVMcvAvLyktjmYrg/zCM4WQtO", "admin@tms.com", "admin", "1", NOW()),
("alfred", "$2b$10$TSwPXUEjHFrlfTNog42zweKW3uDzzxUs3OO5EQAX/SnTINdGyxTQ.", "alfred@tms.com", "team member", "0", NOW()),
("project_lead", "$2b$10$NTDCfrOIJnADNnoz9bJwsOejeiIVUdvI/Dos1FPthSGjldEN8POFy", "project_lead@tms.com", "project lead", "0", NOW()), 
("project_manager", "$2b$10$lLppFnLFwH7DOh5Ld2aaK.aGqMccvvCh71oZ9L7SQrTvJPWUiS7pO", "project_manager@tms.com", "project manager", "0", NOW());  

INSERT INTO usergroup (username, user_group) VALUES ("admin", "admin");
INSERT INTO usergroup (username, user_group) VALUES ("alfred", "team member");
INSERT INTO usergroup (username, user_group) VALUES ("project_lead", "project lead");
INSERT INTO usergroup (username, user_group) VALUES ("project_manager", "project manager");

-- CREATE NON ROOT USER WITH LIMITED PERMISSIONS
USE mysql;
CREATE USER 'default'@'%' IDENTIFIED BY 'default123';
GRANT INSERT, SELECT, UPDATE on nodelogin.* TO 'default'@'%';
FLUSH PRIVILEGES;