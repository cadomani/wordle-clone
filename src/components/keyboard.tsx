import { cn } from "../utils/helpers";

type KeyState =
  | "not-applicable"
  | "not-played"
  | "incorrect"
  | "wrong-spot"
  | "correct";

const KEYBOARD_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export const Keyboard = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-1.5 w-full">
      {KEYBOARD_LAYOUT.map((row, i) => (
        <div key={i} className="flex justify-around space-x-1.5">
          {row.map((letter) => (
            <KeyboardButton
              key={letter}
              letter={letter}
              state="incorrect"
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
        state == "wrong-spot" && "bg-[#CAB458] text-white",
        state == "correct" && "bg-[#6BAA64] text-white",
      )}
      onClick={onClick}
    >
      {letter === "BACKSPACE" ? "⌫" : letter}
    </button>
  );
};
