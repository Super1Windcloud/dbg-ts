interface DbgOptions {
    /** 是否显示文件名和行号 */
    showLocation?: boolean;
    isRelativePath?: boolean;
    /** 是否显示时间戳 */
    showTimestamp?: boolean;
    /** 自定义标签 */
    label?: string;
    /** 输出函数，默认使用 console.log */
    logger?: (message: string) => void;
    /** 是否启用调试输出 */
    enabled?: boolean;
    /** 强制指定变量名 */
    varName?: string;
}
declare class DbgLogger {
    private static defaultOptions;
    private static toRelativePath;
    private static projectRoot;
    private static formatValue;
    private static getCallerLocation;
    private static extractVariableName;
    /**
     * 调试打印函数
     */
    static debug<T>(value: T, options?: DbgOptions): T;
    static setDefaultOptions(options: Partial<DbgOptions>): void;
    static enable(): void;
    static disable(): void;
}
/**
 * 主要的调试函数 - 需要手动传入变量名以获得最佳体验
 * 使用方式：
 * dbg(user, 'user') 或使用宏风格的辅助函数
 */
export declare function dbg<T>(value: T, varName?: string, options?: DbgOptions): T;
/**
 * 宏风格的调试函数 - 推荐使用方式
 * 使用 ES6 模板字符串来模拟变量名推断
 */
export declare const DBG: {
    /**
     * 使用方式：DBG.log(() => user) 或 DBG.log(() => ({ user, name, age }))
     */
    log<T>(expr: () => T, options?: Omit<DbgOptions, "varName">): T;
};
/**
 * 简化的变量调试 - 需要手动提供变量名
 */
export declare function dbgVar<T>(value: T, varName: string, options?: DbgOptions): T;
/**
 * 多变量调试
 */
export declare function dbgMulti(variables: Record<string, any>, options?: DbgOptions): void;
/**
 * 条件调试
 */
export declare function dbgIf<T>(condition: boolean, value: T, varName?: string, options?: DbgOptions): T;
/**
 * 带标签的调试
 */
export declare function dbgWith<T>(label: string, value: T, varName?: string): T;
export declare const dbgConfig: {
    setDefaults: typeof DbgLogger.setDefaultOptions;
    enable: typeof DbgLogger.enable;
    disable: typeof DbgLogger.disable;
};
export {};
//# sourceMappingURL=dbg.d.ts.map