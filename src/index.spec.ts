import { AppConfigLite } from './index';
import * as mockfs from 'mock-fs';

describe('Configuration', () => {
    beforeEach(() => {
        mockfs({
            'src/example.json': JSON.stringify({ "configData": "value" }),
            './config.json': JSON.stringify({ "configData": "value" }),
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
});
