export interface IConfigResolver {
    findOrGenerateConfig(): string | undefined;
    findConfig(): string | undefined;
    resolveConfig(): any;
    getOrGenerateConfig(): string | undefined;
}