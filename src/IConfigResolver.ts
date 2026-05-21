export interface IConfigResolver {
    findOrGenerateConfig(): string;
    findConfig(): string | undefined;
    resolveConfig(): any;
    getOrGenerateConfig(): string;
}
