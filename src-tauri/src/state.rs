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
    pub key: String,
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
                key: c.to_string(),
                state: LetterState::NotPlayed,
            })
            .collect();

        println!("{:?}", initial_state);

        Self(initial_state)
    }

    pub fn update(&mut self, key: &str, state: LetterState) {
        for k in self.0.iter_mut() {
            if k.key == key {
                // If the state is the same or better than the current state, don't update it
                if k.state >= state {
                    println!("State is the same or better, skipping update for {:?} with inputs {:?} and {:?}", k, key, state);
                    continue;
                }
                k.state = state;
            }
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct Guess {
    pub letter: String,
    pub state: LetterState,
}

#[derive(Debug, Clone)]
pub struct GameEngine {
    word: String,
    guesses: Vec<String>,
    dictionary: Vec<String>,
    keyboard_state: KeyboardState,
    app_handle: AppHandle,
}

impl GameEngine {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            word: Self::choose_game_word(),
            dictionary: Self::load_words("dict-valid.txt"),
            guesses: Vec::new(),
            keyboard_state: KeyboardState::new(),
            app_handle,
        }
    }

    fn choose_game_word() -> String {
        let words = Self::load_words("dict-limited.txt");
        let random_word = words.choose(&mut rand::thread_rng()).unwrap();
        println!("Random word: {}", random_word);

        random_word.to_string()
    }

    pub fn reset(&mut self) {
        self.word = Self::choose_game_word();
        self.guesses.clear();
    }

    pub fn guess(&mut self, guess: &str) -> Result<Vec<Guess>, String> {
        // Check if the guess is the same length as the word
        if guess.len() != self.word.len() {
            println!("Invalid word length. Guess length: {}", guess.len());
            return Err("invalid word length".to_string());
        }

        // Check if guess is in the dictionary
        println!("Dictionary length: {}", self.dictionary.len());
        if !self.dictionary.contains(&guess.to_uppercase()) {
            println!("Guess not in dictionary: {}", guess.to_uppercase());
            return Err("invalid word".to_string());
        }

        // Add guess to list of guesses
        self.guesses.push(guess.to_string());

        // Validate guess against each letter in the word
        let mut guess_result = Vec::new();
        for (i, c) in self.word.chars().enumerate() {
            let state = match guess.chars().nth(i) {
                Some(g) if g == c => LetterState::Correct,
                Some(g) if self.word.contains(g) => LetterState::WrongSpot,
                _ => LetterState::Incorrect,
            };

            guess_result.push(Guess {
                letter: guess.chars().nth(i).unwrap().to_string(),
                state,
            });
        }

        // Update keyboard state
        for result in guess_result.iter() {
            self.keyboard_state.update(&result.letter, result.state);
        }

        self.app_handle
            .emit("keyboard_state", self.keyboard_state.clone())
            .expect("failed to emit keyboard state");

        // Return the result of the guess
        println!("Guess result: {:?}", guess_result);
        Ok(guess_result)
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
