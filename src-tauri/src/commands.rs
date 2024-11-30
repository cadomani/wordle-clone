use std::sync::Mutex;

use tauri::{Emitter, State};

use crate::state::{BoardState, KeyboardState};

#[tauri::command]
pub fn input() {
    todo!()
}

#[tauri::command]
pub fn submit_guess(
    guess: String,
    board_state: State<'_, Mutex<BoardState>>,
    keyboard_state: State<'_, Mutex<KeyboardState>>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    println!("Guess: {}", guess);
    let mut keyboard_state = keyboard_state
        .lock()
        .expect("Failed to lock keyboard state");

    let mut board_state = board_state.lock().expect("Failed to lock board state");

    let results = board_state.guess(&guess.to_string())?;
    for result in results {
        keyboard_state.update(&result.letter, result.state);
    }

    app_handle
        .emit("keyboard_state", keyboard_state.clone())
        .expect("failed to emit keyboard state");

    Ok(())
}
