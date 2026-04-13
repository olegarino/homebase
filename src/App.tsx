import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import ChatPage from "@/pages/ChatPage";
import TracesPage from "@/pages/TracesPage";
import SettingsPage from "@/pages/SettingsPage";
import StatusPage from "@/pages/StatusPage";

function App() {
  return (
    <Layout>
      <div className="flex flex-1 flex-col min-h-0 h-full">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/traces" element={<TracesPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Layout>
  );
}

export default App;
