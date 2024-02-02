import ElekIoCore from '@elek-io/core';
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  dialog,
  ipcMain,
  protocol,
  screen,
} from 'electron';
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import Path from 'path';

class Main {
  constructor() {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (require('electron-squirrel-startup')) {
      app.quit();
    }

    // Register app events
    app.on('ready', this.onReady.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
  }

  private onWindowAllClosed() {
    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow('/projects');
    }
  }

  private onReady() {
    // Register a protocol that is able to load files from local FS
    protocol.registerFileProtocol('local-resource', (request, callback) => {
      const url = request.url.replace(/^local-resource:\/\//, '');
      // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
      const decodedUrl = decodeURI(url); // Needed in case URL contains spaces
      try {
        return callback(decodedUrl);
      } catch (error) {
        console.error(
          'ERROR: registerLocalResourceProtocol: Could not get file path:',
          error
        );
      }
    });

    // Check in Core if either local or cloud user is set
    // If no, show the user the /user/create page
    // If yes use this to init core and show /projects

    const core = new ElekIoCore();
    this.registerIpcMain(core);

    // const user = await core.user.get();
    // let mainWindow: BrowserWindow;
    this.createWindow('/');

    // if (user) {
    //   mainWindow = await this.createWindow('/projects');
    // } else {
    //   mainWindow = await this.createWindow('/user/create');
    // }
  }

  /**
   * Figures out where and how to display the window
   *
   * @todo only do this on first start. After that, the user will have adjusted it to his liking.
   * The size, monitor and maybe position should be saved locally and then applied on each start.
   * If the setup changes (display not available anymore or different resolution), default back to this.
   */
  private getWindowSize() {
    const display = screen.getPrimaryDisplay();
    const displaySize = display.workAreaSize;
    const aspectRatioFactor = 16 / 9;

    const windowSize = {
      width: 0,
      height: 0,
    };

    if (displaySize.width >= displaySize.height) {
      // Use 80% of possible height and set width to match 16/9
      windowSize.height = Math.round(displaySize.height * 0.8);
      windowSize.width = Math.round(windowSize.height * aspectRatioFactor);
    } else {
      // Use 80% of possible width and set height to match 16/9
      windowSize.width = Math.round(displaySize.width * 0.8);
      windowSize.height = Math.round(windowSize.width * aspectRatioFactor);
    }

    return windowSize;
  }

  private createWindow(
    path: string,
    options?: BrowserWindowConstructorOptions
  ) {
    const { width, height } = this.getWindowSize();

    // Set defaults if missing
    const defaults: BrowserWindowConstructorOptions = {
      height,
      width,
    };
    options = Object.assign({}, defaults, options);

    // Overwrite webPreferences
    options.webPreferences = {
      preload: Path.join(__dirname, 'preload.js'),
    };

    const window = new BrowserWindow(options);

    if (app.isPackaged) {
      // Uncomment for debugging in production
      // window.webContents.openDevTools();
      // installExtension(REACT_DEVELOPER_TOOLS)
      //   .then((name) => console.log(`Added Extension:  ${name}`))
      //   .catch((err) => console.log('An error occurred: ', err));

      // Client is in production
      // Load the static index.html directly
      window.loadFile(
        Path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    } else {
      // Client is in development
      window.webContents.openDevTools();
      installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Chrome extension:  ${name}`))
        .catch((err) =>
          console.log('An error occurred adding Chrome extension: ', err)
        );

      console.log(
        'Loading frontend in development by URL:',
        MAIN_WINDOW_VITE_DEV_SERVER_URL
      );
      window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    }

    return window;
  }

  private registerIpcMain(core: ElekIoCore) {
    ipcMain.handle('electron:dialog:showOpenDialog', async (event, args) => {
      return await dialog.showOpenDialog(args[0], args[1]);
    });
    ipcMain.handle('core:user:get', async () => {
      return await core.user.get();
    });
    ipcMain.handle('core:user:set', async (event, args) => {
      return await core.user.set(args[0]);
    });
    ipcMain.handle('core:projects:count', async () => {
      return await core.projects.count();
    });
    ipcMain.handle('core:projects:create', async (event, args) => {
      return await core.projects.create(args[0]);
    });
    ipcMain.handle('core:projects:list', async (event, args) => {
      return await core.projects.list(args[0]);
    });
    ipcMain.handle('core:projects:read', async (event, args) => {
      return await core.projects.read(args[0]);
    });
    ipcMain.handle('core:projects:update', async (event, args) => {
      return await core.projects.update(args[0]);
    });
    ipcMain.handle('core:projects:delete', async (event, args) => {
      return await core.projects.delete(args[0]);
    });
    ipcMain.handle('core:projects:search', async (event, args) => {
      return await core.projects.search(args[0], args[1], args[2]);
    });
    ipcMain.handle('core:assets:list', async (event, args) => {
      return await core.assets.list(args[0]);
    });
    ipcMain.handle('core:assets:create', async (event, args) => {
      return await core.assets.create(args[0]);
    });
    ipcMain.handle('core:assets:delete', async (event, args) => {
      return await core.assets.delete(args[0]);
    });
    // ipcMain.handle('core:snapshots:list', async (event, args) => {
    //   return await core.snapshots.list(
    //     args[0],
    //     args[1],
    //     args[2],
    //     args[3],
    //     args[4]
    //   );
    // });
    // ipcMain.handle('core:snapshots:commitHistory', async (event, args) => {
    //   return await core.snapshots.commitHistory(args[0]);
    // });
    ipcMain.handle('core:collections:list', async (event, args) => {
      return await core.collections.list(args[0]);
    });
    ipcMain.handle('core:collections:create', async (event, args) => {
      return await core.collections.create(args[0]);
    });
    ipcMain.handle('core:collections:read', async (event, args) => {
      return await core.collections.read(args[0]);
    });
    ipcMain.handle('core:collections:update', async (event, args) => {
      return await core.collections.update(args[0]);
    });
    ipcMain.handle('core:collections:delete', async (event, args) => {
      return await core.collections.delete(args[0]);
    });
    ipcMain.handle('core:entries:list', async (event, args) => {
      return await core.entries.list(args[0]);
    });
    ipcMain.handle('core:entries:create', async (event, args) => {
      return await core.entries.create(args[0]);
    });
    ipcMain.handle('core:entries:read', async (event, args) => {
      return await core.entries.read(args[0]);
    });
    ipcMain.handle('core:entries:update', async (event, args) => {
      return await core.entries.update(args[0]);
    });
    ipcMain.handle('core:entries:delete', async (event, args) => {
      return await core.entries.delete(args[0]);
    });
    // this.handleIpcMain<Parameters<AssetService['list']>>('core:assets:list', async (event, args) => {
    //   return await core.assets.list(args.projectId);
    // })
  }
}

export default new Main();

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
