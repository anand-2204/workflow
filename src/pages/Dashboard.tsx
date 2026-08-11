import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Workflows</h1>
      <Link
        to="/editor"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
      >
        Create Workflow
      </Link>
    </div>
  );
}
