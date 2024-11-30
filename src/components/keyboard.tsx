import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { cn } from "../utils/helpers";

const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

type KeyState =
  | "notApplicable"
  | "notPlayed"
  | "incorrect"
  | "wrongSpot"
  | "correct";

type KeyboardState = {
  key: string;
  state: KeyState;
};

export const Keyboard = () => {
  const [keyboardState, setKeyboardState] = useState<Map<string, KeyState>>(
    KEYBOARD_LAYOUT.flat().reduce((acc, letter) => {
      if (letter === "ENTER" || letter === "BACKSPACE") {
        acc.set(letter, "notApplicable");
      } else {
        acc.set(letter, "notPlayed");
      }
      return acc;
    }, new Map<string, KeyState>()),
  );

  useEffect(() => {
    const unlisten = listen<KeyboardState[]>("keyboard_state", (event) =>
      setTimeout(
        () =>
          setKeyboardState(new Map(event.payload.map((k) => [k.key, k.state]))),
        1500,
      ),
    );

    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-1.5 w-full">
      {KEYBOARD_LAYOUT.map((row, i) => (
        <div key={i} className="flex justify-around space-x-1.5">
          {row.map((letter) => (
            <KeyboardButton
              key={letter}
              letter={letter}
              state={keyboardState.get(letter) ?? "notApplicable"}
              onClick={() => {}}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const KeyboardButton = ({
  letter,
  state,
  onClick,
}: {
  letter: string;
  state: KeyState;
  onClick: () => void;
}) => {
  return (
    <button
      className={cn(
        "w-12 h-16 p-2 text-xl font-bold text-black bg-[#D4D6DA] rounded-lg",
        letter === "ENTER" && "w-20 text-sm",
        letter === "BACKSPACE" && "w-20 text-2xl",
        state == "incorrect" && "bg-[#787C7E] text-white",
        state == "wrongSpot" && "bg-[#CAB458] text-white",
        state == "correct" && "bg-[#6BAA64] text-white",
      )}
      onClick={onClick}
    >
      {letter === "BACKSPACE" ? "⌫" : letter}
    </button>
  );
};
