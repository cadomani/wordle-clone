use std::{
    fs::File,
    io::{self, BufRead},
};

use rand::seq::SliceRandom;

use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Clone, PartialEq, PartialOrd, Copy)]
#[serde(rename_all = "camelCase")]
pub enum LetterState {
    NotPlayed,
    Incorrect,
    WrongSpot,
    Correct,
}

#[derive(Debug, Serialize, Clone)]
pub struct KeyboardKey {
    pub key: char,
    pub state: LetterState,
}

#[derive(Debug, Serialize, Clone)]
pub struct KeyboardState(Vec<KeyboardKey>);

impl Default for KeyboardState {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyboardState {
    pub fn new() -> Self {
        let initial_state = "QWERTYUIOPASDFGHJKLZXCVBNM"
            .chars()
            .map(|c| KeyboardKey {
                key: c,
                state: LetterState::NotPlayed,
            })
            .collect();

        Self(initial_state)
    }

    pub fn update(&mut self, key: &char, state: LetterState) {
        for k in self.0.iter_mut() {
            if k.key == *key {
                // If the state is the same or better than the current state, don't update it
                if k.state >= state {
                    continue;
                }
                k.state = state;
            }
        }
    }

    pub fn reset(&mut self) {
        for k in self.0.iter_mut() {
            k.state = LetterState::NotPlayed;
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct Guess {
    pub letter: String,
    pub state: LetterState,
}

#[derive(Debug, Serialize, Clone)]
pub struct BoardState(Vec<Guess>);

#[derive(Debug, Clone)]
pub struct GameEngine {
    game_word: String,
    guesses: Vec<String>,
    dictionary: Vec<String>,
    board_state: BoardState,
    keyboard_state: KeyboardState,
    app_handle: AppHandle,
}

impl GameEngine {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            game_word: Self::choose_game_word(),
            dictionary: Self::load_words("dict-valid.txt"),
            guesses: Vec::new(),
            keyboard_state: KeyboardState::new(),
            board_state: BoardState(Vec::new()),
            app_handle,
        }
    }

    pub fn new_game(&mut self) {
        self.game_word = Self::choose_game_word();
        self.guesses.clear();
        self.keyboard_state.reset();
        self.board_state.0.clear();
    }

    pub fn guess(&mut self, guess: &str) -> Result<Vec<Guess>, String> {
        // Check if the guess is the same length as the word
        if guess.len() != self.game_word.len() {
            return Err("invalid word length".to_string());
        }

        // Check if guess is in the dictionary
        if !self.dictionary.contains(&guess.to_uppercase()) {
            return Err("invalid word".to_string());
        }

        // Check if word has already been guessed
        if self.guesses.contains(&guess.to_string()) {
            return Err("word already guessed".to_string());
        }

        // Add guess to list of guesses
        self.guesses.push(guess.to_string());

        // Validate guess against each letter in the word
        for (i, guessed_letter) in guess.chars().enumerate() {
            // Check if the guessed letter is in the word and assign a state
            let state = match self.game_word.chars().nth(i) {
                Some(game_letter) if game_letter == guessed_letter => LetterState::Correct,
                _ => {
                    if self.game_word.contains(guessed_letter) {
                        LetterState::WrongSpot
                    } else {
                        LetterState::Incorrect
                    }
                }
            };

            self.keyboard_state.update(&guessed_letter, state);

            self.board_state.0.push(Guess {
                letter: guessed_letter.to_string(),
                state,
            });
        }

        // Send the updated keyboard state to the frontend
        self.app_handle
            .emit("keyboard_state", self.keyboard_state.clone())
            .expect("failed to emit keyboard state");

        // Return the result of the guess
        println!("Board state: {:?}", self.board_state);
        Ok(self.board_state.0.clone())
    }

    fn choose_game_word() -> String {
        let words = Self::load_words("dict-limited.txt");
        let random_word = words.choose(&mut rand::thread_rng()).unwrap();
        println!("Random word: {}", random_word);

        random_word.to_string()
    }

    fn load_words(filename: &str) -> Vec<String> {
        let file = File::open(filename).expect("File not found");
        let reader = io::BufReader::new(file);

        let mut words = Vec::new();
        reader.lines().for_each(|line_result| {
            if let Ok(line) = line_result {
                if !line.trim().is_empty() {
                    words.push(line.to_uppercase());
                }
            }
        });

        words
    }
}
