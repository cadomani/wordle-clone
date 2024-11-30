use std::sync::Mutex;

use state::{BoardState, KeyboardState};

pub mod commands;
pub mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Mutex::new(BoardState::new()))
        .manage(Mutex::new(KeyboardState::new()))
        .invoke_handler(tauri::generate_handler![commands::submit_guess,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
