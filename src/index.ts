import { Configuration } from "./Configuration";
import { ConfigResolver } from "./ConfigResolver";

export class AppConfigLite {
    private static _instance: undefined | Configuration = undefined;

    public static init(appName: string, configPath?: string): Configuration {
        const resolver = new ConfigResolver(appName, configPath);
        this._instance = new Configuration(resolver);
        return this._instance;
    }

    public static get Instance(): Configuration | undefined {
        return this._instance;
    }
}
