import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export function get<T, K extends keyof T>(obj: T, path: string, defaultValue: K | undefined = undefined): K | undefined {
    const keys = path.split('.');
    let result: any = obj;

    for (let key of keys) {
        result = result[key];
        if (result === undefined) {
            return defaultValue;
        }
    }

    return result;
}

export function set<T>(obj: T, path: string, value: any): T {
    const keys = path.split('.');
    let current: any = obj;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (i === keys.length - 1) {
            current[key] = value;
        } else {
            current[key] = current[key] || {};
            current = current[key];
        }
    }

    return obj;
}

export function mkdirpSync(dir: string): void {
    if (existsSync(dir)) {
        return;
    }

    mkdirpSync(dirname(dir));
    mkdirSync(dir);
}