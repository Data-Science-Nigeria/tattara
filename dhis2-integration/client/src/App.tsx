import { useState } from "react";
import LoginForm from "./components/LoginForm";
import Selector from "./components/Selector";

function App() {
  const [auth, setAuth] = useState<{ username: string; password: string } | null>(
    null
  );

  if (!auth) {
    return <LoginForm onLogin={setAuth} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold p-4">DHIS2 External App</h1>
      <Selector auth={auth} />
    </div>
  );
}

export default App;
