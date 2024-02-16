import ElekIoCore from '@elek-io/core';
import * as Sentry from '@sentry/electron/main';
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  dialog,
  ipcMain,
  net,
  protocol,
  screen,
} from 'electron';
import Path from 'path';
import { updateElectronApp } from 'update-electron-app';
import { SecurityError } from '../util';

Sentry.init({
  dsn: 'https://c839d5cdaec666911ba459803882d9d0@o4504985675431936.ingest.sentry.io/4506688843546624',
  enableRendererProfiling: true,
});

class Main {
  constructor() {
    // Overwrite dugites resolved path to the embedded git directory
    // @see https://github.com/desktop/dugite/blob/0f5a4f11300fbfa8d2dd272b8ee9b771e5b34cd4/lib/git-environment.ts#L25
    // This seems to be necessary, since it resolves to `elek.io Client.app/Contents/Resources/app/git` instead of dugites git inside node_modules `elek.io Client.app/Contents/Resources/app/node_modules/dugite/git`
    process.env.LOCAL_GIT_DIRECTORY = Path.resolve(
      __dirname,
      '../../',
      'node_modules',
      'dugite',
      'git'
    );

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    if (require('electron-squirrel-startup')) {
      app.quit();
    }

    // Register app events
    app.on('ready', this.onReady.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));

    // Enable auto-updates
    // @see https://github.com/electron/update-electron-app
    updateElectronApp();
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
    protocol.handle('elek-io-local-file', (request) => {
      const filePath = request.url.replace(
        /^elek-io-local-file:\/\//,
        'file://'
      );

      return net.fetch(filePath);
    });

    // Check in Core if either local or cloud user is set
    // If no, show the user the /user/create page
    // If yes use this to init core and show /projects

    const core = new ElekIoCore({
      environment: app.isPackaged ? 'production' : 'development',
    });
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
   * The size, monitor and maybe position should be saved locally in the users configuration and then applied on each start.
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

    // Overwrite webPreferences to always load the correct preload script
    // and explicitly enable security features - although Electron > v28 should set these by default
    options.webPreferences = {
      preload: Path.join(__dirname, 'preload.js'),
      disableBlinkFeatures: 'Auxclick', // @see https://github.com/doyensec/electronegativity/wiki/AUXCLICK_JS_CHECK
      nodeIntegration: false,
      contextIsolation: true, // @see https://github.com/doyensec/electronegativity/wiki/CONTEXT_ISOLATION_JS_CHECK
      sandbox: true, // @see https://github.com/doyensec/electronegativity/wiki/SANDBOX_JS_CHECK
    };

    const window = new BrowserWindow(options);

    // Prevent navigation to untrusted origins
    // @see https://github.com/doyensec/electronegativity/wiki/AUXCLICK_JS_CHECK
    window.webContents.on('will-navigate', (event, urlToLoad) => {
      const trustedOrigins = ['https://elek.io'];
      const parsedUrl = new URL(urlToLoad);

      if (trustedOrigins.includes(parsedUrl.origin) === false) {
        event.preventDefault();
        throw new SecurityError(
          `Prevented navigation to untrusted origin "${urlToLoad}" from "${window.webContents.getURL()}"`
        );
      }
    });

    if (app.isPackaged) {
      // Uncomment to debug a production build
      window.webContents.openDevTools();
      // installExtension(REACT_DEVELOPER_TOOLS)
      //   .then((name) => console.log(`Added Chrome extension:  ${name}`))
      //   .catch((err) =>
      //     console.log('An error occurred adding Chrome extension: ', err)
      //   );

      // Client is in production
      // Load the static index.html directly
      window.loadFile(
        Path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    } else {
      // Client is in development
      window.webContents.openDevTools();
      // installExtension(REACT_DEVELOPER_TOOLS)
      //   .then((name) => console.log(`Added Chrome extension:  ${name}`))
      //   .catch((err) =>
      //     console.log('An error occurred adding Chrome extension: ', err)
      //   );

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
