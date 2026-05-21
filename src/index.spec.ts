import { AppConfigLite } from './index';
import mockfs = require('mock-fs');

describe('Configuration', () => {
    beforeEach(() => {
        // Reset the singleton so test order doesn't affect outcomes.
        AppConfigLite.reset();

        mockfs({
            'src/example.json': JSON.stringify({ "configData": "value" }),
            './config.json': JSON.stringify({
                configData: 'value',
                nested: { key: 'nestedVal', deep: { leaf: 42 } },
                emptyString: '',
            }),
        });
        process.env.EXAMPLE_ENV_VAR = 'env_data';
    });

    afterEach(() => {
        mockfs.restore();
        delete process.env.EXAMPLE_ENV_VAR;
    });

    it('should not provide an initialized instance until instantiated', () => {
        const sut = AppConfigLite.Instance;

        expect(sut).toBeUndefined();
    });

    it('should fire a loaded event when a config file is loaded', () => {
        let loaded = false;
        const sut = AppConfigLite.init('test-app');

        sut.on('loaded', () => {
            loaded = true;
        });
        sut.load();
        expect(loaded).toBe(true);
    });

    it('should provide an initialized instance once instantiated', () => {
        AppConfigLite.init('test-app');
        const sut = AppConfigLite.Instance;

        expect(sut).not.toBeUndefined();
        expect(sut).not.toBeNull();
    });

    it('should provide get mechanism for retrieving settings from file', () => {
        const sut = AppConfigLite.init('test-app');
        sut.load();
        const setting = sut.get('configData');
        expect(setting).toBe('value');
    });

    it('should provide set mechanism for setting a temporary setting', () => {
        const sut = AppConfigLite.init('test-app');
        sut.load();
        sut.set('tempSetting', {
            complex: 'data',
        });
        const setting = sut.get('tempSetting');
        expect(setting.complex).toBe('data');
    });

    it('should support environment variables', () => {
        const sut = AppConfigLite.init('test-app');
        sut.load();
        const setting = sut.get('example.env.var');
        expect(setting).toBe('env_data');
    });

    it('should give precedence to environment variables', () => {
        const sut = AppConfigLite.init('test-app');
        sut.load();

        const fileSetting = sut.get('configData');
        expect(fileSetting).toBe('value');

        process.env.CONFIGDATA = 'env_data';
        const envSetting = sut.get('configData');
        delete process.env.CONFIGDATA;
        expect(envSetting).toBe('env_data');
    });

    it('should not persist to disk by default', () => {
        const control = AppConfigLite.init('test-app');
        control.load();

        const fileSetting = control.get('configData');
        expect(fileSetting).toBe('value');

        control.set('configData', 'newValue');
        const newSetting = control.get('configData');
        expect(newSetting).toBe('newValue');

        const sut = AppConfigLite.init('test-app');
        expect(sut.get('configData')).toBeUndefined()
    });

    it('should persist configuration settings to disk when save is called', () => {
        const control = AppConfigLite.init('test-app');
        control.load();

        const fileSetting = control.get('configData');
        expect(fileSetting).toBe('value');

        control.set('configData', 'newValue');

        control.save();

        const sut = AppConfigLite.init('test-app');
        sut.load();

        expect(sut.get('configData')).toBe('newValue');
    });

    describe('event emission', () => {
        it('should emit an info event when an env var overrides a config value', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();

            const infoMessages: string[] = [];
            sut.on('info', (msg: string) => infoMessages.push(msg));

            process.env.CONFIGDATA = 'env_data';
            sut.get('configData');
            delete process.env.CONFIGDATA;

            expect(infoMessages.length).toBe(1);
            expect(infoMessages[0]).toContain('CONFIGDATA');
        });

        it('should only emit the env override info event once per key', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();

            const infoMessages: string[] = [];
            sut.on('info', (msg: string) => infoMessages.push(msg));

            process.env.CONFIGDATA = 'env_data';
            sut.get('configData');
            sut.get('configData');
            sut.get('configData');
            delete process.env.CONFIGDATA;

            expect(infoMessages.length).toBe(1);
        });

        it('should emit a saved event after a successful save', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();

            const savedPaths: string[] = [];
            sut.on('saved', (path: string) => savedPaths.push(path));

            sut.save();
            expect(savedPaths.length).toBe(1);
            expect(savedPaths[0]).toContain('config.json');
        });

        it('should emit an error event when load() fails to read the config file', () => {
            // Explicit path that does not exist -> readFileSync throws -> caught -> 'error'
            const sut = AppConfigLite.init('test-app', './does-not-exist.json');
            const errors: string[] = [];
            sut.on('error', (msg: string) => errors.push(msg));

            sut.load();
            expect(errors.length).toBe(1);
        });

        it('should emit an error event when load() encounters malformed JSON', () => {
            mockfs.restore();
            mockfs({ './bad.json': '{ not valid json' });

            const sut = AppConfigLite.init('test-app', './bad.json');
            const errors: string[] = [];
            sut.on('error', (msg: string) => errors.push(msg));

            sut.load();
            expect(errors.length).toBe(1);
        });
    });

    describe('nested key resolution', () => {
        it('should resolve nested keys via dotted path from file data', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();
            expect(sut.get('nested.key')).toBe('nestedVal');
            expect(sut.get('nested.deep.leaf')).toBe(42);
        });

        it('should return undefined for missing nested keys', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();
            expect(sut.get('nested.missing')).toBeUndefined();
            expect(sut.get('nonexistent.path.value')).toBeUndefined();
        });

        it('should set and get nested keys created via set()', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();
            sut.set('a.b.c', 'deepValue');
            expect(sut.get('a.b.c')).toBe('deepValue');
        });
    });

    describe('environment variable edge cases', () => {
        it('should let an empty-string env var override the file value', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();

            process.env.CONFIGDATA = '';
            const result = sut.get('configData');
            delete process.env.CONFIGDATA;

            expect(result).toBe('');
        });

        it('should let env var "0" override the file value', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();

            process.env.CONFIGDATA = '0';
            const result = sut.get('configData');
            delete process.env.CONFIGDATA;

            expect(result).toBe('0');
        });
    });

    describe('get() defaultValue', () => {
        it('should return the provided default when the key is missing', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();
            expect(sut.get('missing.key', 'fallback')).toBe('fallback');
        });

        it('should ignore the default when the key is present in the file', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();
            expect(sut.get('configData', 'fallback')).toBe('value');
        });

        it('should ignore the default when an env var is set', () => {
            const sut = AppConfigLite.init('test-app');
            sut.load();

            process.env.MISSING_KEY = 'from_env';
            const result = sut.get('missing.key', 'fallback');
            delete process.env.MISSING_KEY;

            expect(result).toBe('from_env');
        });
    });

    describe('explicit config path', () => {
        it('should use the explicit config path passed to init()', () => {
            mockfs.restore();
            mockfs({ './explicit.json': JSON.stringify({ explicit: 'yes' }) });

            const sut = AppConfigLite.init('test-app', './explicit.json');
            sut.load();
            expect(sut.get('explicit')).toBe('yes');
        });
    });

    describe('singleton behavior', () => {
        it('should replace the singleton on subsequent init() calls', () => {
            const first = AppConfigLite.init('test-app');
            const second = AppConfigLite.init('other-app');

            expect(AppConfigLite.Instance).toBe(second);
            expect(AppConfigLite.Instance).not.toBe(first);
        });

        it('reset() should clear the singleton', () => {
            AppConfigLite.init('test-app');
            expect(AppConfigLite.Instance).toBeDefined();

            AppConfigLite.reset();
            expect(AppConfigLite.Instance).toBeUndefined();
        });
    });
});
