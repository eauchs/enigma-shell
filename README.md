
# Enigma Shell 🔮

Control a full Linux operating system with natural language, directly in your browser.

## 🚀 About This Project

**Enigma Shell** is an experimental web interface that lets you talk to an operating system. Instead of typing complex shell commands, you simply describe what you want to do in plain English.

This project merges two cutting-edge technologies:

  * **v86:** An x86 emulator written in JavaScript that runs a full **Alpine Linux** image—complete with its own kernel and file system—directly in your browser.
  * **Ollama:** A client that connects to your local Ollama instance to use LLMs (like Llama 3, Mistral, etc.) to translate your natural language instructions into executable `bash` commands.

The result is a fluid and intuitive experience where the LLM becomes your personal systems engineer, driving a VM right before your eyes.

## ✨ Features

  * **Full Linux Environment:** A true, virtualized Alpine Linux VM, not a simulation.
  * **Natural Language Control:** Give commands like "create a folder named 'projects' and enter it" or "tell me the kernel version."
  * **100% Client-Side:** All application logic runs in your browser, ensuring responsiveness and privacy.
  * **Local LLM:** Uses your own Ollama instance, keeping your data and prompts private.
  * **Reactive UI:** Built with React, TypeScript, and Vite for a modern and high-performance user experience.

## 🛠️ Tech Stack

  * **Frontend:** React, TypeScript, Vite
  * **VM Emulation:** [v86](https://github.com/copy/v86)
  * **LLM Interaction:** [ollama-js](https://github.com/ollama/ollama-js) (Official Client)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed and running on your machine:

1.  **Node.js** (v18 or higher)
2.  **Ollama:** [Download and install Ollama](https://ollama.com/).
3.  **An LLM Model:** Pull an instruction-tuned model, e.g., `ollama pull qwen:4b`

## ▶️ Installation & Launch

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/eauchs/enigma-shell.git
    cd enigma-shell
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the application:**
    ```bash
    npm run dev
    ```
4.  Open your browser to the provided address (usually `http://localhost:5173`).

Ensure the Ollama application is running in the background before starting the development server.

## ✍️ Usage

Once the application loads, the Alpine Linux VM will boot up. Wait for the boot process to complete and for the login prompt to appear.

1.  Use the main input field to write your objective in natural language.
2.  Press "Enter".
3.  Watch as the LLM types and executes the corresponding command in the VM's terminal.

## 🛣️ Roadmap (Future Ideas)

Enigma Shell is a solid foundation. Here are a few ideas to take it to the next level:

  * **Multi-Step Planning:** Integrate a framework like **CrewAI** (via a Python backend communicating over WebSockets) to allow a team of agents to pursue complex, multi-command objectives (e.g., "install an Nginx server and deploy this website").
  * **State Persistence:** Allow the VM's disk state to be saved in `localStorage` or `IndexedDB` to resume a session where you left off.
  * **File Uploads:** Add the ability to upload files from the host machine into the VM's file system.
  * **Model Selection:** Allow the user to choose which Ollama model to use directly from the UI.

## 📄 License

This project is distributed under the MIT License. See the `LICENSE` file for more information.
