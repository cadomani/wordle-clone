type CellState = {
  letter: string;
  state:
    | "notSubmitted"
    | "invalid"
    | "incorrect"
    | "wrongSpot"
    | "correct"
    | "winner";
};

type BoardState = CellState[];
