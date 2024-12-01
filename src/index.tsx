import { useEffect, useState } from "react";
import { Board } from "./components/board";
import { Keyboard } from "./components/keyboard";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { cn } from "./utils/helpers";
import "./index.css";

const BOARD_SIZE = 30;
const GUESSED_STATES = ["correct", "incorrect", "wrongSpot", "winner"];

type GameOverEvent = {
  won: boolean;
  word: string;
};

export default function WordleGame() {
  const [boardState, setBoardState] = useState<BoardState>([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    const unlisten = listen<GameOverEvent>("game_over", (event) => {
      setGameOver(true);

      // Display game over message
      if (event.payload.won) {
        console.log("You won!", event.payload.word);
        showPopup("You win!");
      } else {
        console.log("Game over", event.payload);
        showPopup("Game over");
      }
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  const handleInput = (input: string) => {
    // Reject input if the game is over
    if (gameOver) {
      console.warn("Game over, cannot accept input");
      return;
    }

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
          showPopup("Word already guessed");

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
          showPopup("Not in word list");

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

  const showPopup = (message: string) => {
    setMessage(message);
    setTimeout(() => setMessage(undefined), 5000);
  };

  const handleNewGame = async () => {
    try {
      console.log("Starting a new game");
      await invoke<BoardState>("new_game");
      setGameOver(false);
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
    <>
      <ActionBar newGame={handleNewGame} />
      <Popup message={message} />

      <main className="flex flex-col items-center justify-center h-screen mt-5 space-y-20">
        <Board state={boardState} size={BOARD_SIZE} />
        <Keyboard onInput={handleInput} />
      </main>
    </>
  );
}

const ActionBar = ({ newGame }: { newGame: () => void }) => {
  return (
    <div
      className="absolute top-5 right-6 w-24 h-8 p-2 rounded-md bg-gray-300 hover:bg-gray-200 active:bg-gray-100 cursor-pointer shadow-sm select-none text-sm font-bold flex items-center justify-center"
      onClick={newGame}
    >
      New Game
    </div>
  );
};

const Popup = ({ message }: { message: string | undefined }) => {
  return (
    <div
      className={cn(
        "absolute top-8 right-1/2 translate-x-[50%] h-10 w-fit px-3 bg-gray-800 rounded-lg flex items-center justify-center transition-all",
        !message && "hidden",
      )}
    >
      <p className="text-white font-medium text-sm">{message}</p>
    </div>
  );
};
