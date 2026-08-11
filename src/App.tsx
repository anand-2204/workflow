import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";

export default function App() {
  return (
    <div className="w-full h-screen bg-gray-900 text-gray-100">
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
