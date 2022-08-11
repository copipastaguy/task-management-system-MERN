const connection = require("../../server/connection");
const checkGroup = require("../checkGroup");
const errorHandler = require("../errorHandler");
const { permitDoingController, permitDoneController } = require("../permitController");
const loginUser = require("../loginController");
const nodemailer = require("nodemailer");

const date = new Date().getDate();
const month = new Date().getMonth() + 1;
const year = new Date().getFullYear();
const time = new Date().toTimeString().slice(0, 8);
const now = `${date}/${month}/${year} ${time}`;

const PromoteTask2Done = function (app) {
  app.post("/promote-task", async (req, res, next) => {
    const { username, password, app_acronym, task_name } = req.body;
    // console.log(req.body);

    if (username && password) {
      const login = await loginUser(username, password);
      if (login === false) return next(errorHandler({ message: "Unauthorized", code: 4001 }, req, res));

      //   CHECK DOING PERMIT (APPLICATION ACRONYM)
      const permitDoing = await permitDoingController(app_acronym);
      const permitDone = await permitDoneController(app_acronym);

      const user = await checkGroup({
        username: username,
        usergroup: permitDoing,
      });
      //   console.log(user);
      if (user === false) return next(errorHandler({ message: "Forbidden", code: 4002 }, req, res));
      //   FETCH TASK
      const getTask = `SELECT task_name, task_state FROM task WHERE task_name = ? AND task_app_acronym = ?`;
      connection.query(getTask, [task_name, app_acronym], (error, result) => {
        if (error) throw error;
        else if (result.length > 0) {
          // CHECK TASK STATE IF IS IN DOING
          if (result[0].task_state != "Doing") {
            res.send({ message: `Invalid state (${result[0].task_state}) to promote to Done`, code: 4005 }, req, res);
          } else {
            // PROMOTE TASK
            const task_state = "DONE";
            const updateTask = `UPDATE task SET task_state = ?, task_owner = ? WHERE task_name = ? AND task_app_acronym = ? `;
            connection.query(updateTask, [task_state, username, task_name, app_acronym], (error, result) => {
              if (error) throw error;
              else {
                // SEND EMAIL TO PERMIT DONE USER GROUP
                const fetchEmail = `SELECT accounts.email FROM accounts, usergroup WHERE accounts.username = usergroup.username AND usergroup.user_group = ?`;
                connection.query(fetchEmail, [permitDone], (error, result) => {
                  if (error) throw error;
                  else if (result.length > 0) {
                    //   console.log(result);
                    result.forEach((user) => {
                      console.log(`Sending email to ${user.email}`);
                      function sendEmail() {
                        let transporter = nodemailer.createTransport({
                          host: process.env.MAILTRAP_HOST,
                          port: process.env.MAILTRAP_PORT,
                          secure: false,
                          auth: {
                            user: process.env.MAILTRAP_USER,
                            pass: process.env.MAILTRAP_PASS,
                          },
                        });
                        let info = transporter.sendMail({
                          from: `${username}@tms.com`, // sender address
                          to: `${user.email}`, // list of receivers
                          subject: `Task ${task_name} is done!`, // Subject line
                          text: `${username} has completed task: ${task_name} on ${now}. Review now!`, // plain text body
                          html: `${username} has completed task: ${task_name} on ${now}. Review now!`, // html body
                        });
                      }
                      sendEmail();
                    });
                    res.send({ message: "Task has been updated, email has been sent", code: 200 }, req, res);
                  }
                });
              }
            });
          }
        } else {
          res.send({ message: "Invalid task", code: 4005 }, req, res);
        }
      });
    } else {
      return next(errorHandler({ message: "Unauthorized", code: 4001 }, req, res));
    }
  });
};

module.exports = PromoteTask2Done;