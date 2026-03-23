// Clear the environment variable that makes Electron behave like Node
delete process.env.ELECTRON_RUN_AS_NODE;
// Launch the actual main process logic
require('./desktop-main/main.js');
