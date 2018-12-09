import { EventEmitter } from 'events';
import { join, resolve, dirname } from 'path';
import * as mkdirp from 'mkdirp';
import { writeFileSync, readFileSync } from 'fs'

import { IConfigResolver } from './IConfigResolver';
import { folderExists, fileExists } from './FileSystemExtensions';
import { IPathDefinition } from './IPathDefinition';

export class ConfigResolver extends EventEmitter implements IConfigResolver {
    private _appName: string;
    private _configFile: string | undefined;

    constructor(appName: string, configFile?: string) {
        super();

        this._appName = appName;
        this._configFile = configFile;
    }

    private getPaths(): IPathDefinition[] {
        const configFile = this._configFile || 'config.json';
        const appName = this._appName;

        const paths: IPathDefinition[] = [];
        const xdgConfig = process.env.XDG_CONFIG_HOME ||
            (process.env.HOME && join(process.env.HOME, '.config'));
        if (xdgConfig && folderExists(xdgConfig)) {
            paths.push({
                path: join(xdgConfig, appName, configFile),
                type: 'xdg',
            });
        }

        if (process.platform === 'win32' &&
            process.env.APPDATA &&
            folderExists(process.env.APPDATA)) {
            paths.push({
                path: resolve(join(process.env.APPDATA, appName, configFile)),
                type: 'win',
            });
        }

        paths.push({
            path: resolve(join('.', appName, configFile)),
            type: 'def',
        });

        paths.push({
            path: resolve(join('.', configFile)),
            type: 'old',
        });

        return paths;
    }

    private createConfigFile(configPath: IPathDefinition) {
        mkdirp.sync(dirname(configPath.path));

        const defaultConfig = require.resolve('./example.json');
        const createdConfig = readFileSync(defaultConfig, 'utf8');

        writeFileSync(configPath.path, createdConfig);

        return configPath.path;
    }

    findOrGenerateConfig(): string {
        let config = this.findConfig();

        if (config) return config;

        const paths = this.getPaths();

        const newConfig = this.createConfigFile(paths[0]);
        this.emit('info', `Creating default config file in ${config}`);
        return newConfig;
    }

    findConfig(): string | undefined {
        const paths = this.getPaths();

        const existingConfig = paths.find(o => fileExists(o.path));

        return existingConfig && existingConfig.path;
    }

    resolveConfig(): any {
        const path = this.getOrGenerateConfig();
        const config = JSON.parse(readFileSync(path, 'utf8'));
        config.self_path = path;
        return config;
    }

    getOrGenerateConfig(): string {
        if (this._configFile) {
            return resolve(this._configFile);
        }

        return this.findOrGenerateConfig();
    }
}