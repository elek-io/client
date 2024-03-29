// import { MakerDeb } from '@electron-forge/maker-deb';
// import { MakerDMG } from '@electron-forge/maker-dmg';
// import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
  packagerConfig: {
    icon: 'icons/icon',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      title: 'elek.io Client',
      setupExe: 'elek.io Client',
      name: 'client',
      // The ICO file to use as the icon for the generated Setup.exe
      setupIcon: 'icons/icon.ico',
    }),
    new MakerZIP(),
    // new MakerDMG(),
    // new MakerRpm({
    //   options: {
    //     productName: 'elek.io Client',
    //     bin: 'elek.io Client',
    //   },
    // }),
    // new MakerDeb({
    //   options: {
    //     productName: 'elek.io Client',
    //     bin: 'elek.io Client',
    //   },
    // }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'elek-io',
          name: 'client',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/renderer/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
