import { useEffect, useState } from "react";
import { cn } from "../utils/helpers";
import { invoke } from "@tauri-apps/api/core";

type CellState = {
  letter: string;
  status: "not-submitted" | "invalid" | "incorrect" | "wrong-spot" | "correct";
};

type RowState = {
  row: CellState[];
  status: "not-submitted" | "active" | "submitted";
};

type BoardState = RowState[];

const emptyRow: CellState[] = [
  { letter: "", status: "not-submitted" },
  { letter: "", status: "not-submitted" },
  { letter: "", status: "not-submitted" },
  { letter: "", status: "not-submitted" },
  { letter: "", status: "not-submitted" },
];

const defaultBoardState: BoardState = [
  {
    row: [
      { letter: "A", status: "correct" },
      { letter: "B", status: "incorrect" },
      { letter: "C", status: "wrong-spot" },
      { letter: "D", status: "incorrect" },
      { letter: "E", status: "correct" },
    ],
    status: "submitted",
  },
  {
    row: [...emptyRow],
    status: "active",
  },
  {
    row: [...emptyRow],
    status: "not-submitted",
  },
  {
    row: [...emptyRow],
    status: "not-submitted",
  },
  {
    row: [...emptyRow],
    status: "not-submitted",
  },
  {
    row: [...emptyRow],
    status: "not-submitted",
  },
];

export const Board = () => {
  const [boardState, setBoardState] = useState<BoardState>(defaultBoardState);
  const [activeCellState, setActiveCellState] = useState<CellState[]>([
    ...emptyRow,
  ]);

  const handleInput = (char: string) => {
    // Find the index of the last empty cell in the active row
    const emptyCellIndex = activeCellState.findIndex(
      (cell) => cell.letter === "",
    );

    // Early return if there are no empty cells and input exists
    if (emptyCellIndex === -1 && char) {
      return;
    }

    // Update the cells in the active row based on the input
    setActiveCellState((prev) =>
      prev.map((cell, index) => {
        // If there is an empty cell, fill it with the input
        if (char) {
          if (index === emptyCellIndex) {
            return {
              ...cell,
              letter: char.toUpperCase(),
              status: "not-submitted",
            } as CellState;
          }
        } else {
          // If there are no empty cells, clear the last cell
          if (emptyCellIndex === -1) {
            if (index === activeCellState.length - 1) {
              return {
                ...cell,
                letter: "",
                status: "not-submitted",
              } as CellState;
            }
          } else if (index === emptyCellIndex - 1) {
            return {
              ...cell,
              letter: "",
              status: "not-submitted",
            } as CellState;
          }
        }
        return cell;
      }),
    );
  };

  const submitAnswer = async () => {
    // Early return if the active row is not filled
    if (activeCellState.some((cell) => cell.letter === "")) {
      return;
    }

    try {
      await invoke("submit_guess", {
        guess: activeCellState.map((cell) => cell.letter).join(""),
      });
    } catch (e) {
      setActiveCellState((prev) =>
        prev.map((cell) => ({
          ...cell,
          status: "invalid",
        })),
      );
      console.error(e);
      return;
    }

    let activeRowUpdated = false;
    setBoardState((prev) =>
      prev.map((row) => {
        // Mark the active row as submitted and update the status of each cell
        if (row.status === "active") {
          return {
            row: activeCellState.map((cell) => ({
              ...cell,
              status: ["correct", "incorrect", "wrong-spot"][
                Math.floor(Math.random() * 3)
              ],
            })),
            status: "submitted",
          } as RowState;
          // Mark the first not-submitted row as active
        } else if (row.status === "not-submitted" && !activeRowUpdated) {
          activeRowUpdated = true;
          return {
            ...row,
            status: "active",
          } as RowState;
        }
        return row;
      }),
    );

    // Reset the active cell state
    setActiveCellState([...emptyRow]);
  };

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "keydown",
      (e) => {
        // Ignore keydown events that are not letters
        if (/^[a-zA-Z]$/.test(e.key)) {
          handleInput(e.key);
        }

        // Clear the last cell when the Backspace key is pressed
        if (e.key === "Backspace") {
          handleInput("");
        }

        // Submit the answer when the Enter key is pressed
        if (e.key === "Enter") {
          submitAnswer();
        }

        // Prevent default behavior for all keydown events
        e.preventDefault();
        e.stopPropagation();
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [handleInput, submitAnswer]);

  return (
    <div className="flex flex-col space-y-2">
      {boardState.map((row, index) => (
        <Row
          key={index}
          state={row.status == "active" ? activeCellState : row.row}
        />
      ))}
    </div>
  );
};

type RowProps = {
  state: CellState[];
};

const Row = ({ state }: RowProps) => {
  return (
    <div className="flex space-x-2">
      {state.map((cell, index) => (
        <Cell key={index} index={index} {...cell} />
      ))}
    </div>
  );
};

type CellProps = CellState & {
  index: number;
};

const Cell = ({ index, letter, status }: CellProps) => {
  const [animateInput, setAnimate] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Trigger input animation when a letter is entered
  useEffect(() => {
    if (letter !== "") {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [letter]);

  // Trigger flip animation when any status changes (row submission)
  if (status !== "not-submitted" && status !== "invalid") {
    setTimeout(() => setIsSubmitted(true), 300 * index);
  }

  return (
    <div
      className={cn(
        "relative size-20 select-none cursor-default transition-all duration-500 [transform-style:preserve-3d]",
        isSubmitted && "[transform:rotateX(180deg)]",
      )}
    >
      <div
        className={cn(
          "absolute size-20 font-extrabold flex items-center justify-center text-[3rem] [backface-visibility:hidden]",
          "bg-white text-black border-[3px]",
          letter == "" ? "border-[#D4D6DA]" : "border-[#888A8C]",
          status == "invalid" && "animate-shake",
          animateInput && "duration-150 scale-110",
        )}
      >
        {letter}
      </div>
      <div
        className={cn(
          "absolute size-20 font-extrabold flex items-center justify-center text-[3rem] [backface-visibility:hidden] [transform:rotateX(180deg)]",
          status == "incorrect" && "bg-[#787C7E] text-white",
          status == "wrong-spot" && "bg-[#CAB458] text-white",
          status == "correct" && "bg-[#6BAA64] text-white",
        )}
      >
        {letter}
      </div>
    </div>
  );
};
