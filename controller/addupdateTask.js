const connection = require("../controller/server/connection");
const errorHandler = require("./errorHandler");
const nodemailer = require("nodemailer");
require("dotenv").config();
const checkgroup = require("./checkGroup");

const addupdateTask = function (app) {
  const date = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const time = new Date().toTimeString().slice(0, 8);
  const now = `${date}/${month}/${year} ${time}`;

  app.post("/add-task", async (req, res, next) => {
    const { app_Rnum, app_acronym, taskName, taskDescription, taskNotes, taskState, taskCreator, taskOwner, taskPlan, note, permitUser } = req.body;

    const permitCreate = await checkgroup({
      username: taskOwner,
      usergroup: permitUser,
    });

    if (permitCreate === false) {
      return next(errorHandler("No access!", req, res));
    } else {
      if (taskName) {
        const checkTask = `SELECT task_name FROM task WHERE task_name = ? AND task_app_acronym = ?`;
        connection.query(checkTask, [taskName, app_acronym], (error, result) => {
          if (error) throw error;
          else if (result.length > 0) {
            ////////////////////////// CHECK IF TASK NAME EXIST /////////////////////////////////
            return next(errorHandler(`Task name exist for ${app_acronym}`, req, res));
          } else {
            //////////////////////////// GET APP ACRONYM, RUNNING NUMBER FOR TASK_ID /////////////////////////////////
            // GET APP RUNNING NUMBER
            const getRnum = `SELECT app_Rnum FROM application WHERE app_acronym = ?`;
            connection.query(getRnum, [app_acronym], (error, result) => {
              if (error) throw error;
              else {
                const taskId = app_acronym.concat("_", app_Rnum + 1);
                //////////////////////////// ADD TASK /////////////////////////////////
                // FETCH PLAN COLOR FROM PLAN TABLE
                if (taskPlan) {
                  const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
                  connection.query(getPlanColor, [taskPlan], (error, result) => {
                    if (error) throw error;
                    else if (result.length > 0) {
                      const taskColor = result[0].plan_color;
                      console.log(taskColor);

                      // INSERT NEW TASK
                      const addTask = `INSERT INTO task (task_app_acronym, task_id, task_name, task_description, task_plan, task_color, task_state, task_creator, task_owner, task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
                      connection.query(
                        addTask,
                        [app_acronym, taskId, taskName, taskDescription, taskPlan, taskColor, taskState, taskCreator, taskOwner],
                        (error, result) => {
                          if (error) throw error;
                          else {
                            // ADD AUDIT NOTES
                            const auditNotes = `${now}: ${taskState} \nDone by: ${taskCreator} \n${taskNotes}`;
                            const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
                            connection.query(addNote, [taskName, auditNotes], (error, result) => {
                              if (error) throw error;
                            });

                            // UPDATE APP RNUM
                            const updateRnum = `UPDATE application SET app_Rnum = ? WHERE app_acronym = ?`;
                            connection.query(updateRnum, [app_Rnum + 1, app_acronym], (error, result) => {
                              if (error) throw error;
                            });
                          }
                        }
                      );
                    }
                  });
                  res.send(`Task ${taskName} created!`);
                } else if (!taskPlan) {
                  const addTask = `INSERT INTO task (task_app_acronym, task_id, task_name, task_description, task_plan, task_state, task_creator, task_owner, task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
                  connection.query(
                    addTask,
                    [app_acronym, taskId, taskName, taskDescription, taskPlan, taskState, taskCreator, taskOwner],
                    (error, result) => {
                      if (error) throw error;
                      else {
                        // ADD AUDIT NOTES
                        const auditNotes = `${now}: ${taskState} \nDone by: ${taskCreator} \n${taskNotes}`;
                        const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
                        connection.query(addNote, [taskName, auditNotes], (error, result) => {
                          if (error) throw error;
                        });

                        // UPDATE APP RNUM
                        const updateRnum = `UPDATE application SET app_Rnum = ? WHERE app_acronym = ?`;
                        connection.query(updateRnum, [app_Rnum + 1, app_acronym], (error, result) => {
                          if (error) throw error;
                        });
                      }
                    }
                  );
                  res.send(`Task ${taskName} created!`);
                }
              }
            });
          }
        });
      } else if (!taskName) {
        return next(errorHandler("Input valid task name", req, res));
      }
    }
  });

  app.post("/edit-task", async (req, res, next) => {
    const { task_name, taskNotes, taskState, taskOwner, taskPlan, app_acronym } = req.body;
    // console.log(req.body);

    // NOTES TYPED IN
    // GET TASK STATE - GET STATE PERMIT OF APPLICATION
    if (taskState === "Open") {
      const getPermit = `SELECT app_permitOpen FROM application WHERE app_acronym = ?`;
      function checkPermit() {
        return new Promise((resolve, reject) => {
          connection.query(getPermit, [app_acronym], (error, result) => {
            if (error) reject(error);
            else {
              // console.log(result);
              return resolve(result[0].app_permitOpen);
            }
          });
        });
      }
      const permit = await checkPermit();
      const permitUser = await checkgroup({
        username: taskOwner,
        usergroup: permit,
      });
      if (permitUser === false) {
        return next(errorHandler("No access", req, res));
      } else if (permitUser === true) {
        if (taskNotes.length > 0) {
          // UPDATED TASK NOTES
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          const updateNotes = `${now}: ${taskState} \nDone by: ${taskOwner} \n${taskNotes} \n`;
          connection.query(addNote, [task_name, updateNotes], (error, result) => {
            if (error) reject(error);
            else {
              // CHECK FOR TASK PLAN
              // UPDATED TASK PLAN
              if (taskPlan) {
                const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
                connection.query(getPlanColor, [taskPlan], (error, result) => {
                  if (error) throw error;
                  else if (result.length > 0) {
                    const taskColor = result[0].plan_color;
                    // console.log(taskColor);
                    // UPDATE TASK
                    const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                    connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                      if (error) throw error;
                      else {
                        // INSERT INTO task_notes
                        const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW() + 1)`;
                        const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task \n`;
                        connection.query(addNote, [task_name, updateNotes], (error, result) => {
                          if (error) throw error;
                        });
                      }
                    });
                  }
                });
              } else {
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, task_name], (error, result) => {
                  if (error) throw error;
                });
              }
              res.send(`Updated ${task_name}`);
            }
          });
        } else if (taskNotes.length == 0) {
          // NO TASK NOTES
          // UPDATED TASK PLAN
          const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
          connection.query(getPlanColor, [taskPlan], (error, result) => {
            if (error) throw error;
            else {
              if (taskPlan) {
                const taskColor = result[0].plan_color;
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                  if (error) throw error;
                  else {
                    // INSERT INTO task_notes
                    const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
                    const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task plan \n`;
                    connection.query(addNote, [task_name, updateNotes], (error, result) => {
                      if (error) throw error;
                    });
                  }
                });
              }
            }
          });
          res.send(`Updated ${task_name}`);
        }
      }
    }

    if (taskState === "ToDo") {
      const getPermit = `SELECT app_permitToDo FROM application WHERE app_acronym = ?`;
      function checkPermit() {
        return new Promise((resolve, reject) => {
          connection.query(getPermit, [app_acronym], (error, result) => {
            if (error) reject(error);
            else {
              // console.log(result);
              return resolve(result[0].app_permitToDo);
            }
          });
        });
      }
      const permit = await checkPermit();
      const permitUser = await checkgroup({
        username: taskOwner,
        usergroup: permit,
      });
      if (permitUser === false) {
        return next(errorHandler("No access", req, res));
      } else if (permitUser === true) {
        if (taskNotes.length > 0) {
          // UPDATED TASK NOTES
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          const updateNotes = `${now}: ${taskState} \nDone by: ${taskOwner} \n${taskNotes} \n`;
          connection.query(addNote, [task_name, updateNotes], (error, result) => {
            if (error) reject(error);
            else {
              // CHECK FOR TASK PLAN
              // UPDATED TASK PLAN
              if (taskPlan) {
                const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
                connection.query(getPlanColor, [taskPlan], (error, result) => {
                  if (error) throw error;
                  else if (result.length > 0) {
                    const taskColor = result[0].plan_color;
                    // console.log(taskColor);
                    // UPDATE TASK
                    const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                    connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                      if (error) throw error;
                      else {
                        // INSERT INTO task_notes
                        const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW() + 1)`;
                        const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task \n`;
                        connection.query(addNote, [task_name, updateNotes], (error, result) => {
                          if (error) throw error;
                        });
                      }
                    });
                  }
                });
              } else {
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, task_name], (error, result) => {
                  if (error) throw error;
                });
              }
              res.send(`Updated ${task_name}`);
            }
          });
        } else if (taskNotes.length == 0) {
          // NO TASK NOTES
          // UPDATED TASK PLAN
          const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
          connection.query(getPlanColor, [taskPlan], (error, result) => {
            if (error) throw error;
            else {
              if (taskPlan) {
                const taskColor = result[0].plan_color;
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                  if (error) throw error;
                  else {
                    // INSERT INTO task_notes
                    const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
                    const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task plan \n`;
                    connection.query(addNote, [task_name, updateNotes], (error, result) => {
                      if (error) throw error;
                    });
                  }
                });
              }
            }
          });
          res.send(`Updated ${task_name}`);
        }
      }
    }

    if (taskState === "Doing") {
      const getPermit = `SELECT app_permitDoing FROM application WHERE app_acronym = ?`;
      function checkPermit() {
        return new Promise((resolve, reject) => {
          connection.query(getPermit, [app_acronym], (error, result) => {
            if (error) reject(error);
            else {
              // console.log(result);
              return resolve(result[0].app_permitDoing);
            }
          });
        });
      }
      const permit = await checkPermit();
      const permitUser = await checkgroup({
        username: taskOwner,
        usergroup: permit,
      });
      if (permitUser === false) {
        return next(errorHandler("No access", req, res));
      } else if (permitUser === true) {
        if (taskNotes.length > 0) {
          // UPDATED TASK NOTES
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          const updateNotes = `${now}: ${taskState} \nDone by: ${taskOwner} \n${taskNotes} \n`;
          connection.query(addNote, [task_name, updateNotes], (error, result) => {
            if (error) reject(error);
            else {
              // CHECK FOR TASK PLAN
              // UPDATED TASK PLAN
              if (taskPlan) {
                const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
                connection.query(getPlanColor, [taskPlan], (error, result) => {
                  if (error) throw error;
                  else if (result.length > 0) {
                    const taskColor = result[0].plan_color;
                    // console.log(taskColor);
                    // UPDATE TASK
                    const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                    connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                      if (error) throw error;
                      else {
                        // INSERT INTO task_notes
                        const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW() + 1)`;
                        const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task \n`;
                        connection.query(addNote, [task_name, updateNotes], (error, result) => {
                          if (error) throw error;
                        });
                      }
                    });
                  }
                });
              } else {
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, task_name], (error, result) => {
                  if (error) throw error;
                });
              }
              res.send(`Updated ${task_name}`);
            }
          });
        } else if (taskNotes.length == 0) {
          // NO TASK NOTES
          // UPDATED TASK PLAN
          const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
          connection.query(getPlanColor, [taskPlan], (error, result) => {
            if (error) throw error;
            else {
              if (taskPlan) {
                const taskColor = result[0].plan_color;
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                  if (error) throw error;
                  else {
                    // INSERT INTO task_notes
                    const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
                    const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task plan \n`;
                    connection.query(addNote, [task_name, updateNotes], (error, result) => {
                      if (error) throw error;
                    });
                  }
                });
              }
            }
          });
          res.send(`Updated ${task_name}`);
        }
      }
    }

    if (taskState === "Done") {
      const getPermit = `SELECT app_permitDone FROM application WHERE app_acronym = ?`;
      function checkPermit() {
        return new Promise((resolve, reject) => {
          connection.query(getPermit, [app_acronym], (error, result) => {
            if (error) reject(error);
            else {
              // console.log(result);
              return resolve(result[0].app_permitDone);
            }
          });
        });
      }
      const permit = await checkPermit();
      const permitUser = await checkgroup({
        username: taskOwner,
        usergroup: permit,
      });
      if (permitUser === false) {
        return next(errorHandler("No access", req, res));
      } else if (permitUser === true) {
        if (taskNotes.length > 0) {
          // UPDATED TASK NOTES
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          const updateNotes = `${now}: ${taskState} \nDone by: ${taskOwner} \n${taskNotes} \n`;
          connection.query(addNote, [task_name, updateNotes], (error, result) => {
            if (error) reject(error);
            else {
              // CHECK FOR TASK PLAN
              // UPDATED TASK PLAN
              if (taskPlan) {
                const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
                connection.query(getPlanColor, [taskPlan], (error, result) => {
                  if (error) throw error;
                  else if (result.length > 0) {
                    const taskColor = result[0].plan_color;
                    // console.log(taskColor);
                    // UPDATE TASK
                    const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                    connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                      if (error) throw error;
                      else {
                        // INSERT INTO task_notes
                        const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW() + 1)`;
                        const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task \n`;
                        connection.query(addNote, [task_name, updateNotes], (error, result) => {
                          if (error) throw error;
                        });
                      }
                    });
                  }
                });
              } else {
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, task_name], (error, result) => {
                  if (error) throw error;
                });
              }
              res.send(`Updated ${task_name}`);
            }
          });
        } else if (taskNotes.length == 0) {
          // NO TASK NOTES
          // UPDATED TASK PLAN
          const getPlanColor = `SELECT plan_color FROM plan WHERE plan_mvp_name = ?`;
          connection.query(getPlanColor, [taskPlan], (error, result) => {
            if (error) throw error;
            else {
              if (taskPlan) {
                const taskColor = result[0].plan_color;
                const updateTask = `UPDATE task SET task_plan = ?, task_owner = ?, task_color = ? WHERE task_name = ?`;
                connection.query(updateTask, [taskPlan, taskOwner, taskColor, task_name], (error, result) => {
                  if (error) throw error;
                  else {
                    // INSERT INTO task_notes
                    const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
                    const updateNotes = `${now}: ${taskState} \n${taskOwner} \nUpdated task plan \n`;
                    connection.query(addNote, [task_name, updateNotes], (error, result) => {
                      if (error) throw error;
                    });
                  }
                });
              }
            }
          });
          res.send(`Updated ${task_name}`);
        }
      }
    }
  });

  // PROJECT MANAGER APPROVE TASK
  app.post("/move-task-todo", async (req, res, next) => {
    const { task_name, newState, note, taskOwner, permitUser } = req.body;
    const permitOpen = await checkgroup({
      username: taskOwner,
      usergroup: permitUser,
    });
    console.log(permitOpen);
    if (permitOpen === false) {
      return next(errorHandler("No access!", req, res));
    } else if (permitOpen === true) {
      const updateTask = `UPDATE task SET task_state = ?, task_owner = ? WHERE task_name = ? `;
      connection.query(updateTask, [newState, taskOwner, task_name], (error, result) => {
        if (error) throw error;
        else {
          const auditNote = `${now}: ${newState} \nDone by: ${taskOwner} \nUpdated task state to To-Do \n`;
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          connection.query(addNote, [task_name, auditNote], (error, result) => {
            if (error) throw error;
            else {
              res.send(result);
            }
          });
        }
      });
    }
  });

  app.post("/move-task-doing", async (req, res, next) => {
    const { task_name, newState, taskOwner, permitUser } = req.body;
    console.log(req.body);
    const permitOpen = await checkgroup({
      username: taskOwner,
      usergroup: permitUser,
    });
    if (permitOpen === false) {
      console.log(permitUser);
      return next(errorHandler("No access", req, res));
    } else {
      const updateNote = `UPDATE task SET task_state = ?, task_owner = ? WHERE task_name = ? `;
      connection.query(updateNote, [newState, taskOwner, task_name], (error, result) => {
        if (error) throw error;
        else {
          const auditNote = `${now}: ${newState} \nDone by: ${taskOwner} \nUpdated task state to Doing \n`;
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          connection.query(addNote, [task_name, auditNote], (error, result) => {
            if (error) throw error;
            else {
              res.send(result);
            }
          });
        }
      });
    }
  });

  app.post("/move-task-done", async (req, res, next) => {
    const { task_name, newState, taskOwner, permitUser } = req.body;
    const permitOpen = await checkgroup({
      username: taskOwner,
      usergroup: permitUser,
    });
    if (permitOpen === false) {
      return next(errorHandler("No access", req, res));
    } else {
      const updateNote = `UPDATE task SET task_state = ?, task_owner = ? WHERE task_name = ? `;
      connection.query(updateNote, [newState, taskOwner, task_name], (error, result) => {
        if (error) throw error;
        else {
          const auditNote = `${now}: ${newState} \nDone by: ${taskOwner} \nUpdated task state to Done \n`;
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          connection.query(addNote, [task_name, auditNote], (error, result) => {
            if (error) throw error;
            else {
              // FETCH ALL EMAILS OF PROJECT LEAD USER GROUP
              const fetchEmail = `SELECT accounts.email, usergroup.user_group FROM accounts, usergroup WHERE accounts.username = usergroup.username AND usergroup.user_group = "project lead"`;
              connection.query(fetchEmail, (error, result) => {
                if (error) throw error;
                else if (result.length > 0) {
                  // console.log(result);

                  result.forEach((user) => {
                    console.log(`Sending email to ${user.email}`);
                    // SEND EMAIL WITH NODEMAILER
                    function sendEmail() {
                      // // create reusable transporter object using the default SMTP transport
                      let transporter = nodemailer.createTransport({
                        host: process.env.MAILTRAP_HOST,
                        port: process.env.MAILTRAP_PORT,
                        secure: false,
                        auth: {
                          user: process.env.MAILTRAP_USER,
                          pass: process.env.MAILTRAP_PASS,
                        },
                      });
                      // send mail with defined transport object
                      let info = transporter.sendMail({
                        from: `${taskOwner}@tms.com`, // sender address
                        to: "project_lead@tms.com", // list of receivers
                        subject: `Task ${task_name} is done!`, // Subject line
                        text: `${taskOwner} has completed task: ${task_name} on ${now}. Review now!`, // plain text body
                        html: `${taskOwner} has completed task: ${task_name} on ${now}. Review now!`, // html body
                      });
                    }
                    sendEmail();
                  });
                  res.send("Email has been sent to project lead!");
                }
              });
            }
          });
        }
      });
    }
  });

  app.post("/move-task-close", async (req, res, next) => {
    const { task_name, newState, taskOwner, permitUser } = req.body;
    const permitOpen = await checkgroup({
      username: taskOwner,
      usergroup: permitUser,
    });
    if (permitOpen === false) {
      return next(errorHandler("No access", req, res));
    } else {
      const updateNote = `UPDATE task SET task_state = ?, task_owner = ? WHERE task_name = ? `;
      connection.query(updateNote, [newState, taskOwner, task_name], (error, result) => {
        if (error) throw error;
        else {
          const auditNote = `${now}: ${newState} \nDone by: ${taskOwner} \nUpdated task state to Closed \n`;
          const addNote = `INSERT INTO task_notes (task_name, task_note, last_updated) VALUES (?, ?, NOW())`;
          connection.query(addNote, [task_name, auditNote], (error, result) => {
            if (error) throw error;
            else {
              res.send(result);
            }
          });
        }
      });
    }
  });
};

module.exports = addupdateTask;
