use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub enum KeyState {
    Special,
    NotPlayed,
    Incorrect,
    WrongSpot,
    Correct,
}

#[derive(Debug, Serialize, Clone)]
pub struct KeyboardKey {
    pub key: String,
    pub state: KeyState,
}

#[derive(Debug, Serialize, Clone)]
pub struct KeyboardState(Vec<Vec<KeyboardKey>>);

impl Default for KeyboardState {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyboardState {
    pub fn new() -> Self {
        let layers = vec![
            vec!["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            vec!["A", "S", "D", "F", "G", "H", "J", "K", "L"],
            vec!["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
        ]
        .into_iter()
        .map(|row| {
            row.into_iter()
                .map(|key| KeyboardKey {
                    key: key.to_string(),
                    state: if key.len() > 1 {
                        KeyState::Special
                    } else {
                        KeyState::NotPlayed
                    },
                })
                .collect()
        })
        .collect();

        println!("{:#?}", layers);

        Self(layers)
    }
}

#[derive(Debug, Serialize, Clone, Default)]
pub enum GuessStatus {
    Correct,
    Incorrect,
    WrongSpot,
    #[default]
    NotPlayed,
}

#[derive(Debug, Serialize, Clone)]
pub struct Guess {
    pub letter: String,
    pub status: GuessStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct BoardState {
    pub word: String,
    pub guesses: Vec<String>,
    pub correct: Vec<String>,
    pub incorrect: Vec<String>,
    pub wrong_spot: Vec<String>,
}
