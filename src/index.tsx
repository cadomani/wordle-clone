import { useEffect, useState } from "react";
import { Board } from "./components/board";
import { Keyboard } from "./components/keyboard";
import { invoke } from "@tauri-apps/api/core";
import "./index.css";
import { emit } from "@tauri-apps/api/event";

const BOARD_SIZE = 30;
const GUESSED_STATES = ["correct", "incorrect", "wrongSpot"];

export default function WordleGame() {
  const [boardState, setBoardState] = useState<BoardState>([]);

  const handleInput = (input: string) => {
    // Obtain the state of the last cell
    const lastCellState = boardState[boardState.length - 1]?.state;

    // Select action based on input
    switch (input) {
      case "ENTER":
        console.log("Enter pressed");

        // Reject if the board is empty
        if (boardState.length === 0) {
          console.warn("Board empty, cannot submit");
          return;
        }

        // Reject if the row is not filled
        if (boardState.length % 5 != 0) {
          console.warn("Row not filled, cannot submit");
          return;
        }

        // Reject if the last cell is of a guessed state and the board is full
        if (
          boardState.length == BOARD_SIZE &&
          GUESSED_STATES.includes(lastCellState)
        ) {
          console.warn("Last cell is of a guessed state, cannot submit");
          return;
        }

        submitAnswer();
        break;
      case "BACKSPACE":
        console.log("Backspace pressed");

        // Reject if the board is empty
        if (boardState.length === 0) {
          console.warn("Board empty, cannot remove more characters");
          return;
        }

        // Reject if the last cell is of a guessed state
        if (GUESSED_STATES.includes(lastCellState)) {
          console.warn("Last cell is of a guessed state, cannot remove");
          return;
        }

        // If the last cell is marked as invalid, reset all other invalid cells to notSubmitted
        if (lastCellState === "invalid") {
          console.log(
            "Last cell is marked invalid, resetting all other invalid cells and removing the last cell",
          );
          setBoardState((prev) =>
            prev
              .slice(0, -1)
              .map((cell) =>
                cell.state === "invalid"
                  ? { ...cell, state: "notSubmitted" }
                  : cell,
              ),
          );
          return;
        }

        setBoardState((prev) => prev.slice(0, -1));
        break;
      default:
        console.log(`Character ${input} pressed`);

        // Reject if the board is already full
        if (boardState.length === BOARD_SIZE) {
          console.warn("Board full, cannot add more characters");
          return;
        }

        // Reject if the row is full but has not been submitted
        if (
          boardState.length > 0 &&
          boardState.length % 5 === 0 &&
          !GUESSED_STATES.includes(lastCellState)
        ) {
          console.log("Row full, cannot add more characters");
          return;
        }

        // Add character to the board
        setBoardState((prev) => [
          ...prev,
          { letter: input, state: "notSubmitted" },
        ]);

        break;
    }
  };

  const submitAnswer = async () => {
    const lastRow = boardState
      .slice(-5)
      .map((cell) => cell.letter)
      .join("");

    try {
      // Submit guess and update the board state
      const updatedBoard = await invoke<BoardState>("submit_guess", {
        guess: lastRow,
      });

      setBoardState(updatedBoard);
    } catch (error: unknown) {
      switch (error) {
        case "word already guessed":
          console.warn("Word already guessed");

          // Update the state of the last five characters to invalid
          setBoardState((prev) =>
            prev.map((cell, i) =>
              i >= prev.length - 5
                ? { letter: cell.letter, state: "invalid" }
                : cell,
            ),
          );

          break;
        case "invalid word":
          console.warn("Invalid word");

          // Update the state of the last five characters to invalid
          setBoardState((prev) =>
            prev.map((cell, i) =>
              i >= prev.length - 5
                ? { letter: cell.letter, state: "invalid" }
                : cell,
            ),
          );

          break;
        default:
          console.error(error);
          break;
      }
    }
  };

  const handleNewGame = async () => {
    try {
      console.log("Starting a new game");
      await invoke<BoardState>("new_game");
      setBoardState([]);
      emit("reset");
    } catch (e) {
      console.error(e);
      return;
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    window.addEventListener(
      "keydown",
      (e) => {
        if (/^[a-zA-Z]$/.test(e.key)) {
          handleInput(e.key.toUpperCase());
        } else if (e.key === "Backspace") {
          handleInput("BACKSPACE");
        } else if (e.key === "Enter") {
          handleInput("ENTER");
        }

        e.preventDefault();
        e.stopPropagation();
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [handleInput, submitAnswer]);

  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-2">
      <div
        className="absolute left-6 top-6 size-10 p-2 rounded-md bg-gray-300 hover:bg-gray-200 active:bg-gray-100 cursor-pointer shadow-sm select-none text-lg font-bold"
        onClick={handleNewGame}
      >
        NG
      </div>
      <Board state={boardState} size={BOARD_SIZE} />
      <Keyboard onInput={handleInput} />
    </main>
  );
}

// const ActionBar = () => {
//   return (
//     <div className="absolute top-1 left-0 px-4 flex space-x-4">
//       <div className="size-10 p-2 rounded-md bg-gray-300 hover:bg-gray-200 active:bg-gray-100 cursor-pointer shadow-sm select-none text-lg font-bold">
//         NG
//       </div>
//     </div>
//   );
// };
