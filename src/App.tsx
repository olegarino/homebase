import "./App.css";
import ChatComponent from "./ChatComponent";

function App() {

  return (
    <main className="container">
      <h1>Welcome</h1>
      <div className="playground-card">
        <h1 className="title">Plyayground</h1>
        <ChatComponent />
      </div>
    </main>
  );
}

export default App;
