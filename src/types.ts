type CellState = {
  letter: string;
  state: "notSubmitted" | "invalid" | "incorrect" | "wrongSpot" | "correct";
};

type BoardState = CellState[];
