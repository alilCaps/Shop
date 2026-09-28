import { Routes, Route } from "react-router-dom";
import LandingPage from './LandingPage.jsx'
import Login from "./Login.jsx";
import Signup from "./SignUp.jsx";

function App() {

  return (
    <>
      <Routes>
            <Route path="/landingPage" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
      </Routes>
    </>
  )
}

export default App
