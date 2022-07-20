import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

// COMPONENTS
// import Header from "./view/Header";
import Homepage from "./view/Homepage";
import UserManagement from "./view/UserManagement";
import GroupManagement from "./view/GroupManagement";
import Tasks from "./view/Tasks";

function App() {
  // PROTECTED ROUTE
  // GET ADMIN PRIVILEDGE

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Homepage />} />
          {/* admin page */}
          <Route path="/management" element={<UserManagement />} />
          <Route path="/group-management" element={<GroupManagement />} />

          {/* user page */}
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
