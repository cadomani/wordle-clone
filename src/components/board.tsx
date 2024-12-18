import { useEffect, useState } from "react";
import { cn } from "../utils/helpers";

const EMPTY_CELL: CellState = { letter: "", state: "notSubmitted" };

export const Board = ({
  state,
  size = 30,
}: {
  state: BoardState;
  size: number;
}) => (
  <div className="grid grid-cols-5 grid-flow-row gap-1.5">
    {[...state, ...Array(size - state.length).fill(EMPTY_CELL)].map(
      (cell: CellState, index) => (
        <Cell key={`${index}-${cell.letter}`} index={index % 5} {...cell} />
      ),
    )}
  </div>
);

const Cell = ({ index, letter, state }: CellState & { index: number }) => {
  const [animateInput, setAnimate] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  // Trigger input animation when a letter is entered
  useEffect(() => {
    if (letter !== "") {
      setAnimate(true);
      const timeout = setTimeout(() => setAnimate(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [letter]);

  useEffect(() => {
    if (state !== "notSubmitted" && state !== "invalid") {
      // Trigger flip animation when any status changes (row submission)
      setTimeout(() => setIsSubmitted(true), 300 * index);

      // Special handling for winner state
      if (state === "winner") {
        setTimeout(() => setIsWinner(true), 100 * index + 1600);
      }
    }
  }, [state]);

  return (
    <div
      className={cn(
        "relative size-20 select-none cursor-default transition-all duration-500 [transform-style:preserve-3d]",
        isSubmitted && "[transform:rotateX(180deg)]",
        isWinner && "[transform:rotateX(0deg)] transition-none duration-0",
      )}
    >
      <div
        className={cn(
          "absolute size-20 font-extrabold flex items-center justify-center text-[3rem] [backface-visibility:hidden]",
          "bg-white text-black border-[3px]",
          letter == "" ? "border-[#D4D6DA]" : "border-[#888A8C]",
          state == "invalid" && "animate-shake",
          animateInput && "duration-150 scale-110",
          isWinner && "bg-[#6BAA64] text-white border-none animate-wave",
        )}
      >
        {letter}
      </div>
      <div
        className={cn(
          "absolute size-20 font-extrabold flex items-center justify-center text-[3rem] [backface-visibility:hidden] [transform:rotateX(180deg)]",
          state == "incorrect" && "bg-[#787C7E] text-white",
          state == "wrongSpot" && "bg-[#CAB458] text-white",
          (state == "correct" || state == "winner") &&
            "bg-[#6BAA64] text-white",
        )}
      >
        {letter}
      </div>
    </div>
  );
};
