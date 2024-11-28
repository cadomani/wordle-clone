import { Board } from "./components/board";
import { Keyboard } from "./components/keyboard";
import "./index.css";

export default function App() {
  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-20">
      <Board />
      <Keyboard />
    </main>
  );
}
