use std::{
    fs::File,
    io::{self, BufRead},
};

use rand::seq::SliceRandom;

use serde::Serialize;

#[derive(Debug, Serialize, Clone, PartialEq, Copy)]
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
                // If the key is already correct, don't update state
                if k.state == LetterState::Correct {
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

#[derive(Debug, Serialize, Clone)]
pub struct BoardState {
    pub word: String,
    pub dictionary: Vec<String>,
    pub guesses: Vec<String>,
}

impl BoardState {
    pub fn new() -> Self {
        let file = File::open("dictionary.txt").expect("File not found");
        let reader = io::BufReader::new(file);

        let mut words = Vec::new();
        reader.lines().for_each(|line_result| {
            if let Ok(line) = line_result {
                if !line.trim().is_empty() {
                    words.push(line.to_uppercase());
                }
            }
        });

        let random_word = words.choose(&mut rand::thread_rng()).unwrap();

        println!("Random word: {}", random_word);
        Self {
            word: random_word.to_string(),
            dictionary: words,
            guesses: Vec::new(),
        }
    }

    pub fn reset(&mut self) {
        let random_word = self.dictionary.choose(&mut rand::thread_rng()).unwrap();
        println!("Random word: {}", random_word);
        self.word = random_word.to_string();
        self.guesses.clear();
    }

    pub fn guess(&mut self, guess: &str) -> Result<Vec<Guess>, String> {
        // Check if guess is in the dictionary
        if !self.dictionary.contains(&guess.to_uppercase()) {
            return Err("Invalid guess".to_string());
        }
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
            println!("Guess result: {:?}", guess_result);
        }
        Ok(guess_result)
    }
}

impl Default for BoardState {
    fn default() -> Self {
        Self::new()
    }
}
