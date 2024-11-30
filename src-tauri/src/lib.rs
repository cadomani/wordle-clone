use std::sync::Mutex;

use state::GameEngine;
use tauri::Manager;

pub mod commands;
pub mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let game_engine = GameEngine::new(app.handle().clone());
            app.manage(Mutex::new(game_engine));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::submit_guess,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
