import { EventEmitter } from 'events';
import { writeFileSync } from 'fs';
import _ = require('lodash');

import { IConfigResolver } from './IConfigResolver';

export class Configuration extends EventEmitter {
    private _data: any = {};

    constructor(private configResolver: IConfigResolver) {
        super();
    }

    load() {
        try {
            this._data = this.configResolver.resolveConfig();
            this.emit('loaded', this._data.self_path);
        } catch (err: any) {
            this.emit('error', err.message);
        }
    }

    set(path: string, value: any): any {
        return _.set(this._data, path, value);
    }

    get(path: string): any {
        const envPath = path.toUpperCase().split('.').join('_');

        const value = _.get(process.env, envPath);
        if (value) {
            this.emit('info', `Configuration value for ${envPath} overridden by environment.`);
            return value;
        }

        return _.get(this._data, path);
    }

    save(): void {
        const path = this._data.self_path;
        try {
            writeFileSync(path, JSON.stringify(this._data, null, 2));
            this.emit('saved', this._data.self_path);
        } catch (err: any) {
            this.emit('error', err.message);
        }
    }
}