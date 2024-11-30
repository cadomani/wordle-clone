use std::sync::Mutex;

use tauri::State;

use crate::state::{GameEngine, Guess};

#[tauri::command]
pub fn input() {
    todo!()
}

#[tauri::command]
pub fn submit_guess(
    guess: String,
    game_engine: State<'_, Mutex<GameEngine>>,
) -> Result<Vec<Guess>, String> {
    println!("Guess: {}", guess);
    let mut game_engine = game_engine.lock().expect("Failed to lock board state");
    game_engine.guess(&guess.to_string())
}
