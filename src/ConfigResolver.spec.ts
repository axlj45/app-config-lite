import * as mockfs from 'mock-fs';

import { ConfigResolver } from './ConfigResolver';

describe('Config Resolver', () => {
    beforeEach(() => {
        mockfs({
            '/home/xdg_home': {},
            '/home/xdg_home/.config': {},
            './src/example.json': JSON.stringify({ "configData":"value" }),
            //'./config.json': JSON.stringify({ "configData":"value" }),
        });
    });

    afterEach(() => {
        mockfs.restore();
        delete process.env.XDG_CONFIG_HOME;
        delete process.env.HOME;
    });

    it('should not find a configuration file if it doesn\'t exist', () => {
        const sut = new ConfigResolver('test-app');
        const path = sut.findConfig();
        expect(path).toBeUndefined();
    });

    it('should generate file if it doesn\'t exist', () => {
        const sut = new ConfigResolver('test-app');
        const path = sut.findOrGenerateConfig();
        expect(path).toContain('test-app/config.json');
    });

    it('should resolve a config file without a file specified', () => {
        const sut = new ConfigResolver('test-app');
        const config = sut.resolveConfig();
        expect(config).not.toBeNull()
        expect(config).not.toBeUndefined()
        expect(config.configData).toBe('value');
    });

    it('should resolve a config file when XDG_CONFIG_HOME is set', () => {
        process.env.XDG_CONFIG_HOME = '/home/xdg_home';
        const sut = new ConfigResolver('test-app');
        const path = sut.findOrGenerateConfig();
        expect(path).toContain('/home/xdg_home');
    });

    it('should resolve a config file when HOME is set & folder exists', () => {
        process.env.HOME = '/home/xdg_home';
        const sut = new ConfigResolver('test-app');
        const path = sut.findOrGenerateConfig();
        expect(path).toContain('/home/xdg_home/.config');
    });
});
