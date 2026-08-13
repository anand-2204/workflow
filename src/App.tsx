
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/Editor';
import WorkflowList from './pages/WorkflowList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/workflows" />} />
        <Route path="/workflows" element={<WorkflowList />} />
        <Route path="/workflows/new" element={<Editor />} />
        <Route path="/workflows/:workflowId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;