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
  public readonly customFileProtocol: string = 'elek-io-local-file';
  private allowedHostnamesToLoadInternal: string[] = [];
  private allowedHostnamesToLoadExternal: string[] = [
    this.customFileProtocol,
    'localhost',
    'elek.io',
    'api.elek.io',
    'github.com',
  ];
  private core: ElekIoCore | null = null;

  constructor() {
    // Allow the vite dev server to do HMR in development
    if (app.isPackaged === false && process.env['ELECTRON_RENDERER_URL']) {
      this.allowedHostnamesToLoadInternal.push(
        process.env['ELECTRON_RENDERER_URL']
      );
    }

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    // if (require('electron-squirrel-startup')) {
    //   app.quit();
    // }

    // Register app events
    app.on('ready', () => this.onAppReady());
    app.on('activate', () => this.onAppActivate());
    app.on('window-all-closed', () => this.onAppAllWindowsClosed());
    app.on('web-contents-created', (event, webContents) =>
      this.onAppWebContentsCreated(event, webContents)
    );

    // Enable auto-updates
    // @see https://github.com/electron/update-electron-app
    // updateElectronApp();
  }

  /**
   * Initializes Core, registers custom file protocol,
   * creates the first window and registers IPC handlers
   *
   * Needs to be called once Electron has finished initializing
   */
  private async onAppReady(): Promise<void> {
    this.core = new ElekIoCore({
      log: { level: app.isPackaged ? 'info' : 'debug' },
    });
    const user = await this.core.user.get();

    if (user && user.localApi.isEnabled) {
      this.core.api.start(user.localApi.port);
    }

    this.registerCustomFileProtocol();

    const window = await this.createWindow();
    this.registerIpcMain(window, this.core);
  }

  /**
   * Creates a new window when the app is activated
   *
   * Triggered when launching the application for the first time,
   * attempting to re-launch the application when it's already running,
   * or clicking on the application's dock or taskbar icon.
   */
  private async onAppActivate(): Promise<void> {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      await this.createWindow();
    }
  }

  private onAppAllWindowsClosed(): void {
    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onAppWebContentsCreated(
    _event: {
      preventDefault: () => void;
      readonly defaultPrevented: boolean;
    },
    webContents: Electron.WebContents
  ): void {
    // Disable the creation of new windows e.g. by using target="_blank"
    // Instead, let the operating system handle this event's url if it's in the whitelist
    // and open external links inside the default browser
    // @see https://www.electronjs.org/docs/latest/tutorial/security#14-disable-or-limit-creation-of-new-windows
    // @todo in the future we can also allow mailto: URL's etc.
    webContents.setWindowOpenHandler(({ url }) => {
      const parsedUrl = new URL(url);

      if (
        this.allowedHostnamesToLoadExternal.includes(parsedUrl.hostname) ===
        false
      ) {
        const errorMessage = `Prevented navigation to untrusted, external URL "${parsedUrl.toString()}" from "${webContents.getURL()}"`;
        Sentry.captureException(new SecurityError(errorMessage));
        this.core?.logger.error(errorMessage);

        return { action: 'deny' };
      }

      setImmediate(() => {
        shell.openExternal(url);
      });
      return { action: 'deny' };
    });
  }

  /**
   * Creates a new window with security in mind and loads the frontend
   */
  private async createWindow(): Promise<BrowserWindow> {
    const initialWindowSize = this.getInitialWindowSize();

    const options: BrowserWindowConstructorOptions = {
      width: initialWindowSize.width,
      height: initialWindowSize.height,
    };

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

    window.webContents.on('will-navigate', (event, urlToLoad) =>
      this.onWindowWebContentsWillNavigate(window, event, urlToLoad)
    );

    if (app.isPackaged) {
      // Client is in production
      // Load the static index.html directly
      window.loadFile(Path.join(__dirname, `../renderer/index.html`));
      // Uncomment to debug a production build
      // window.webContents.openDevTools();
    } else {
      // Client is in development
      const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
      if (!rendererUrl) {
        throw new Error(`"process.env['ELECTRON_RENDERER_URL']" is empty`);
      }
      console.log('Loading frontend in development by URL:', rendererUrl);
      window.loadURL(rendererUrl);
      window.webContents.openDevTools();
    }

    return window;
  }

  /**
   * Returns the initial window size based on the primary display
   */
  private getInitialWindowSize(): {
    width: number;
    height: number;
  } {
    const display = screen.getPrimaryDisplay();
    const displaySize = display.workAreaSize;
    const aspectRatioFactor = 16 / 9;

    const windowProps = {
      width: 0,
      height: 0,
    };

    if (displaySize.width >= displaySize.height) {
      // Use 80% of possible height and set width to match 16/9
      windowProps.height = Math.round(displaySize.height * 0.8);
      windowProps.width = Math.round(windowProps.height * aspectRatioFactor);
    } else {
      // Use 80% of possible width and set height to match 16/9
      windowProps.width = Math.round(displaySize.width * 0.8);
      windowProps.height = Math.round(windowProps.width * aspectRatioFactor);
    }

    return windowProps;
  }

  /**
   * Prevents loading untrusted origins internally / inside elek.io Client
   *
   * @see https://github.com/doyensec/electronegativity/wiki/AUXCLICK_JS_CHECK
   */
  private onWindowWebContentsWillNavigate(
    window: BrowserWindow,
    event: Electron.Event<Electron.WebContentsWillNavigateEventParams>,
    urlToLoad: string
  ): void {
    const parsedUrl = new URL(urlToLoad);

    if (
      this.allowedHostnamesToLoadInternal.includes(parsedUrl.origin) === false
    ) {
      event.preventDefault();
      const errorMessage = `Prevented navigation to untrusted, internal URL "${parsedUrl.toString()}" from "${window.webContents.getURL()}"`;
      Sentry.captureException(new SecurityError(errorMessage));
      this.core?.logger.error(errorMessage);
    }
  }

  /**
   * Registers a custom file protocol to load files from the local file system
   */
  private registerCustomFileProtocol(): void {
    protocol.handle(this.customFileProtocol, async (request) => {
      const absoluteFilePath = request.url.replace(
        `${this.customFileProtocol}://`,
        ''
      );

      if (!this.core) {
        Sentry.captureException(
          new Error(
            'Trying to handle custom file protocol but Core is not initialized.'
          )
        );
        return new Response('Internal Server Error', { status: 500 });
      }

      if (
        absoluteFilePath.startsWith(this.core.util.pathTo.projects) === false
      ) {
        Sentry.captureException(
          new SecurityError(
            `Tried to load file "${absoluteFilePath}" outside of Projects directory.`
          )
        );
        return new Response(
          'Forbidden: Tried to load a file from outside of elek.io Projects directory',
          { status: 403 }
        );
      }

      return await net.fetch(`file://${absoluteFilePath}`);
    });
  }

  /**
   * Registers IPC handlers for the main process
   */
  private registerIpcMain(
    window: Electron.BrowserWindow,
    core: ElekIoCore
  ): void {
    ipcMain.handle('electron:dialog:showOpenDialog', async (_event, args) => {
      return await dialog.showOpenDialog(window, args);
    });
    ipcMain.handle('electron:dialog:showSaveDialog', async (_event, args) => {
      return await dialog.showSaveDialog(window, args);
    });
    ipcMain.handle('core:api:start', async (_event, args) => {
      return await core.api.start(args[0]);
    });
    ipcMain.handle('core:api:isRunning', async () => {
      return await core.api.isRunning();
    });
    ipcMain.handle('core:api:stop', async () => {
      return await core.api.stop();
    });
    ipcMain.handle('core:logger:debug', (_event, args) => {
      return core.logger.debug(args[0]);
    });
    ipcMain.handle('core:logger:info', (_event, args) => {
      return core.logger.info(args[0]);
    });
    ipcMain.handle('core:logger:warn', (_event, args) => {
      return core.logger.warn(args[0]);
    });
    ipcMain.handle('core:logger:error', (_event, args) => {
      return core.logger.error(args[0]);
    });
    ipcMain.handle('core:logger:read', async (_event, args) => {
      return await core.logger.read(args[0]);
    });
    ipcMain.handle('core:user:get', async () => {
      return await core.user.get();
    });
    ipcMain.handle('core:user:set', async (_event, args) => {
      return await core.user.set(args[0]);
    });
    ipcMain.handle('core:projects:count', async () => {
      return await core.projects.count();
    });
    ipcMain.handle('core:projects:create', async (_event, args) => {
      return await core.projects.create(args[0]);
    });
    ipcMain.handle('core:projects:list', async (_event, args) => {
      return await core.projects.list(args[0]);
    });
    ipcMain.handle('core:projects:read', async (_event, args) => {
      return await core.projects.read(args[0]);
    });
    ipcMain.handle('core:projects:update', async (_event, args) => {
      return await core.projects.update(args[0]);
    });
    ipcMain.handle('core:projects:getChanges', async (_event, args) => {
      return await core.projects.getChanges(args[0]);
    });
    ipcMain.handle('core:projects:clone', async (_event, args) => {
      return await core.projects.clone(args[0]);
    });
    ipcMain.handle('core:projects:synchronize', async (_event, args) => {
      return await core.projects.synchronize(args[0]);
    });
    ipcMain.handle('core:projects:setRemoteOriginUrl', async (_event, args) => {
      return await core.projects.setRemoteOriginUrl(args[0]);
    });
    ipcMain.handle('core:projects:delete', async (_event, args) => {
      return await core.projects.delete(args[0]);
    });
    ipcMain.handle('core:assets:list', async (_event, args) => {
      return await core.assets.list(args[0]);
    });
    ipcMain.handle('core:assets:create', async (_event, args) => {
      return await core.assets.create(args[0]);
    });
    ipcMain.handle('core:assets:read', async (_event, args) => {
      return await core.assets.read(args[0]);
    });
    ipcMain.handle('core:assets:update', async (_event, args) => {
      return await core.assets.update(args[0]);
    });
    ipcMain.handle('core:assets:delete', async (_event, args) => {
      return await core.assets.delete(args[0]);
    });
    ipcMain.handle('core:assets:save', async (_event, args) => {
      return await core.assets.save(args[0]);
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
    ipcMain.handle('core:collections:list', async (_event, args) => {
      return await core.collections.list(args[0]);
    });
    ipcMain.handle('core:collections:create', async (_event, args) => {
      return await core.collections.create(args[0]);
    });
    ipcMain.handle('core:collections:read', async (_event, args) => {
      return await core.collections.read(args[0]);
    });
    ipcMain.handle('core:collections:update', async (_event, args) => {
      return await core.collections.update(args[0]);
    });
    ipcMain.handle('core:collections:delete', async (_event, args) => {
      return await core.collections.delete(args[0]);
    });
    ipcMain.handle('core:entries:list', async (_event, args) => {
      return await core.entries.list(args[0]);
    });
    ipcMain.handle('core:entries:create', async (_event, args) => {
      return await core.entries.create(args[0]);
    });
    ipcMain.handle('core:entries:read', async (_event, args) => {
      return await core.entries.read(args[0]);
    });
    ipcMain.handle('core:entries:update', async (_event, args) => {
      return await core.entries.update(args[0]);
    });
    ipcMain.handle('core:entries:delete', async (_event, args) => {
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
