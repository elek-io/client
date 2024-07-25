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
  shell,
} from 'electron';
import Path from 'path';
import icon from '../../resources/icon.png?asset';
// import { updateElectronApp } from 'update-electron-app';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'SecurityError';
  }
}

Sentry.init({
  dsn: 'https://c839d5cdaec666911ba459803882d9d0@o4504985675431936.ingest.sentry.io/4506688843546624',
  enableRendererProfiling: true,
});

class Main {
  private allowedOriginsToLoadInternal: string[] = [];
  private allowedOriginsToLoadExternal: string[] = [
    'https://elek.io',
    'https://api.elek.io',
    'https://github.com',
  ];

  constructor() {
    // Allow the vite dev server to do HMR in development
    if (app.isPackaged === false && process.env['ELECTRON_RENDERER_URL']) {
      this.allowedOriginsToLoadInternal.push(
        process.env['ELECTRON_RENDERER_URL']
      );
    }

    // Overwrite dugites resolved path to the embedded git directory
    // @see https://github.com/desktop/dugite/blob/0f5a4f11300fbfa8d2dd272b8ee9b771e5b34cd4/lib/git-environment.ts#L25
    // This seems to be necessary, since it resolves to `elek.io Client.app/Contents/Resources/app/git` instead of dugites git inside node_modules `elek.io Client.app/Contents/Resources/app/node_modules/dugite/git`
    // process.env.LOCAL_GIT_DIRECTORY = Path.resolve(
    //   __dirname,
    //   '../../',
    //   'node_modules',
    //   'dugite',
    //   'git'
    // );

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    // if (require('electron-squirrel-startup')) {
    //   app.quit();
    // }

    // Register app events
    app.on('ready', this.onReady.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('web-contents-created', this.onWebContentsCreated.bind(this));

    // Enable auto-updates
    // @see https://github.com/electron/update-electron-app
    // updateElectronApp();
  }

  private onWebContentsCreated(
    event: {
      preventDefault: () => void;
      readonly defaultPrevented: boolean;
    },
    contents: Electron.WebContents
  ) {
    // Disable the creation of new windows e.g. by using target="_blank"
    // Instead, let the operating system handle this event's url if it's in the whitelist
    // and open external links inside the default browser
    // @see https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
    // @todo in the future we can also allow mailto: URL's etc.
    contents.setWindowOpenHandler(({ url }) => {
      const parsedUrl = new URL(url);

      if (
        this.allowedOriginsToLoadExternal.includes(parsedUrl.origin) === false
      ) {
        Sentry.captureException(
          new SecurityError(
            `Prevented navigation to untrusted, external origin "${parsedUrl}" from "${contents.getURL()}"`
          )
        );
        return { action: 'deny' };
      }

      setImmediate(() => {
        shell.openExternal(url);
      });
      return { action: 'deny' };
    });
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
      preload: Path.join(__dirname, '../preload/index.cjs'),
      disableBlinkFeatures: 'Auxclick', // @see https://github.com/doyensec/electronegativity/wiki/AUXCLICK_JS_CHECK
      nodeIntegration: false,
      contextIsolation: true, // @see https://github.com/doyensec/electronegativity/wiki/CONTEXT_ISOLATION_JS_CHECK
      sandbox: true, // @see https://github.com/doyensec/electronegativity/wiki/SANDBOX_JS_CHECK
    };
    if (process.platform === 'linux') {
      options.icon = icon;
    }
    options.frame = false;
    options.titleBarStyle = 'hidden';
    options.titleBarOverlay = true;

    const window = new BrowserWindow(options);

    // Prevent loading untrusted origins internally / inside elek.io Client
    // @see https://github.com/doyensec/electronegativity/wiki/AUXCLICK_JS_CHECK
    window.webContents.on('will-navigate', (event, urlToLoad) => {
      const parsedUrl = new URL(urlToLoad);

      if (
        this.allowedOriginsToLoadInternal.includes(parsedUrl.origin) === false
      ) {
        event.preventDefault();
        Sentry.captureException(
          new SecurityError(
            `Prevented navigation to untrusted, internal origin "${urlToLoad}" from "${window.webContents.getURL()}"`
          )
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
      window.loadFile(Path.join(__dirname, `../renderer/index.html`));
    } else {
      // Client is in development
      window.webContents.openDevTools();
      // installExtension(REACT_DEVELOPER_TOOLS)
      //   .then((name) => console.log(`Added Chrome extension:  ${name}`))
      //   .catch((err) =>
      //     console.log('An error occurred adding Chrome extension: ', err)
      //   );

      const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
      if (!rendererUrl) {
        throw new Error(`"process.env['ELECTRON_RENDERER_URL']" is empty`);
      }

      console.log('Loading frontend in development by URL:', rendererUrl);
      window.loadURL(rendererUrl);
    }

    return window;
  }

  private registerIpcMain(core: ElekIoCore) {
    ipcMain.handle('electron:dialog:showOpenDialog', async (event, args) => {
      return await dialog.showOpenDialog(undefined, args);
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
