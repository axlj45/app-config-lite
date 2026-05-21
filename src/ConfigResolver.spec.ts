import mockfs = require('mock-fs');

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

    it('should emit an info event when generating a default config', () => {
        const sut = new ConfigResolver('test-app');
        const infos: string[] = [];
        sut.on('info', (msg: string) => infos.push(msg));

        sut.findOrGenerateConfig();

        expect(infos.length).toBe(1);
        expect(infos[0]).toContain('Creating default config file');
    });

    it('should prefer the XDG path over the default ./<app>/config.json path', () => {
        process.env.XDG_CONFIG_HOME = '/home/xdg_home';
        mockfs.restore();
        mockfs({
            '/home/xdg_home/test-app/config.json': JSON.stringify({ source: 'xdg' }),
            './test-app/config.json': JSON.stringify({ source: 'default' }),
        });

        const sut = new ConfigResolver('test-app');
        const path = sut.findConfig();
        expect(path).toContain('/home/xdg_home/test-app/config.json');
    });

    describe('Windows path discovery', () => {
        const originalPlatform = process.platform;

        afterEach(() => {
            Object.defineProperty(process, 'platform', { value: originalPlatform });
            delete process.env.APPDATA;
        });

        it('should resolve a config file from APPDATA on win32', () => {
            Object.defineProperty(process, 'platform', { value: 'win32' });
            process.env.APPDATA = '/home/xdg_home'; // reuse existing mocked folder
            mockfs.restore();
            mockfs({
                '/home/xdg_home': {},
                './src/example.json': JSON.stringify({ configData: 'value' }),
            });

            const sut = new ConfigResolver('test-app');
            const path = sut.findOrGenerateConfig();
            expect(path).toContain('/home/xdg_home');
            expect(path).toContain('test-app');
        });
    });
});
