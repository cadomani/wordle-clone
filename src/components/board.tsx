import { useEffect, useState } from "react";
import { cn } from "../utils/helpers";

type CellState = {
  index: number;
  letter: string;
  status: "not-submitted" | "incorrect" | "wrong-spot" | "correct";
};

type RowState = {
  row: CellState[];
  status: "unsubmitted" | "active" | "submitted";
};

type BoardState = RowState[];

const emptyRow: CellState[] = [
  { index: 0, letter: "", status: "not-submitted" },
  { index: 1, letter: "", status: "not-submitted" },
  { index: 2, letter: "", status: "not-submitted" },
  { index: 3, letter: "", status: "not-submitted" },
  { index: 4, letter: "", status: "not-submitted" },
];

const defaultBoardState: BoardState = [
  {
    row: [
      { index: 0, letter: "A", status: "correct" },
      { index: 1, letter: "B", status: "incorrect" },
      { index: 2, letter: "C", status: "wrong-spot" },
      { index: 3, letter: "D", status: "incorrect" },
      { index: 4, letter: "E", status: "correct" },
    ],
    status: "submitted",
  },
  {
    row: [...emptyRow],
    status: "active",
  },
  {
    row: [...emptyRow],
    status: "unsubmitted",
  },
  {
    row: [...emptyRow],
    status: "unsubmitted",
  },
  {
    row: [...emptyRow],
    status: "unsubmitted",
  },
  {
    row: [...emptyRow],
    status: "unsubmitted",
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
              letter: char.toUpperCase(),
              status: "not-submitted",
            } as CellState;
          }
        } else {
          // If there are no empty cells, clear the last cell
          if (emptyCellIndex === -1) {
            if (index === activeCellState.length - 1) {
              return { letter: "", status: "not-submitted" } as CellState;
            }
          } else if (index === emptyCellIndex - 1) {
            return { letter: "", status: "not-submitted" } as CellState;
          }
        }
        return cell;
      }),
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "keydown",
      (e) => {
        // Ignore keydown events that are not letters
        if (/^[a-zA-Z]$/.test(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          handleInput(e.key);
        }

        // Clear the last cell when the Backspace key is pressed
        if (e.key === "Backspace") {
          handleInput("");
        }

        // Submit the answer when the Enter key is pressed
        if (e.key === "Enter") {
          console.log("Submitting answer");
        }
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [handleInput]);

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
        <Cell key={index} {...cell} />
      ))}
    </div>
  );
};

type CellProps = CellState;

const Cell = ({ letter = "", status = "not-submitted" }: CellProps) => {
  const [animateInput, setAnimate] = useState(false);

  useEffect(() => {
    if (letter !== "") {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [letter]);

  return (
    <div
      className={cn(
        "size-20 font-extrabold flex items-center justify-center text-[3rem] font-sans transition-transform duration-150",
        letter == "" ? "border-[#D4D6DA]" : "border-[#888A8C]",
        status == "not-submitted" && "bg-white text-black border-[3px]",
        status == "incorrect" && "bg-[#787C7E] text-white",
        status == "wrong-spot" && "bg-[#CAB458] text-white",
        status == "correct" && "bg-[#6BAA64] text-white",
        animateInput && "scale-110",
        // status != "not-submitted" &&
        //   "transition-all duration-500 [transform-style:preserve-3d] [transform:rotateY(180deg)] transla",
      )}
    >
      {letter}
    </div>
  );
};
