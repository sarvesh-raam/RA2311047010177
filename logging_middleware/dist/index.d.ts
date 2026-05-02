type Stack = 'backend' | 'frontend';
type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type Package = 'cache' | 'controller' | 'cron_job' | 'dh' | 'domain' | 'handler' | 'repository' | 'route' | 'service' | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style' | 'auth' | 'config' | 'middleware' | 'utils';
interface LoggerConfig {
    email: string;
    name: string;
    rollNo: string;
    accessCode: string;
    clientID: string;
    clientSecret: string;
}
export declare function initLogger(cfg: LoggerConfig): void;
export declare function Log(stack: Stack, level: Level, pkg: Package, message: string): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map