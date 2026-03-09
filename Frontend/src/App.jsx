import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/pages/login.jsx";
import Home from "./components/pages/home.jsx";
import Register from "./components/pages/register.jsx";
import Watch from "./components/pages/watch.jsx";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.body.style.backgroundColor = isDarkMode ? "#0f172a" : "#ffffff";
  }, [isDarkMode]);

  return (
    <BrowserRouter>

      <Routes>
        <Route
          path="/"
          element={<Home isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode((prev) => !prev)} />}
        />
        <Route
          path="/login"
          element={<Login isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode((prev) => !prev)} />}
        />
        <Route
          path="/register"
          element={<Register isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode((prev) => !prev)} />}
        />
        <Route
          path="/watch/:videoId"
          element={<Watch isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode((prev) => !prev)} />}
        />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
