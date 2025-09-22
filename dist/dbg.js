import { findProjectRoot } from "./find.ts";
import path from "node:path";
class DbgLogger {
    static defaultOptions = {
        showLocation: true,
        showTimestamp: false,
        enabled: true,
        logger: console.log,
        isRelativePath: true,
    };
    static toRelativePath(absPath) {
        return path.relative(this.projectRoot, absPath);
    }
    static projectRoot = findProjectRoot(process.cwd());
    static formatValue(value, maxDepth = 3, currentDepth = 0) {
        if (currentDepth > maxDepth) {
            return "[深度超限]";
        }
        if (value === null)
            return "null";
        if (value === undefined)
            return "undefined";
        if (value === "")
            return '""';
        const type = typeof value;
        switch (type) {
            case "string":
                return `"${value}"`;
            case "number":
                if (Number.isNaN(value))
                    return "NaN";
                if (!Number.isFinite(value))
                    return value > 0 ? "Infinity" : "-Infinity";
                return String(value);
            case "boolean":
                return String(value);
            case "bigint":
                return `${value}n`;
            case "symbol":
                return value.toString();
            case "function":
                const funcStr = value.toString();
                const firstLine = funcStr.split("\n")[0];
                if (firstLine.length > 50) {
                    return `[Function: ${value.name || "anonymous"}]`;
                }
                return firstLine + (funcStr.includes("\n") ? "..." : "");
            case "object":
                if (value instanceof Date) {
                    return `Date(${value.toISOString()})`;
                }
                if (value instanceof RegExp) {
                    return value.toString();
                }
                if (value instanceof Error) {
                    return `Error(${value.message})`;
                }
                if (value instanceof Map) {
                    const entries = Array.from(value.entries());
                    const items = entries.map(([k, v]) => `${this.formatValue(k, maxDepth, currentDepth + 1)} => ${this.formatValue(v, maxDepth, currentDepth + 1)}`);
                    return `Map(${value.size}) { ${items.join(", ")} }`;
                }
                if (value instanceof Set) {
                    const items = Array.from(value).map((v) => this.formatValue(v, maxDepth, currentDepth + 1));
                    return `Set(${value.size}) { ${items.join(", ")} }`;
                }
                if (Array.isArray(value)) {
                    if (value.length === 0)
                        return "[]";
                    const items = value.map((v) => {
                        if (typeof v !== "object") {
                            return this.formatValue(v, maxDepth, currentDepth + 1);
                        }
                        else {
                            return JSON.stringify(v, null, 2);
                        }
                    });
                    return `[${items.join(", ")}]`;
                }
                try {
                    const keys = Object.keys(value);
                    if (keys.length === 0)
                        return "{}";
                    return JSON.stringify(value, null, 2);
                }
                catch {
                    return "[无法序列化的对象]";
                }
            default:
                return String(value);
        }
    }
    static getCallerLocation(isRelativePath) {
        const stack = new Error().stack;
        if (!stack)
            return "";
        const lines = stack.split("\n");
        for (let i = 4; i < lines.length; i++) {
            let line = lines[i];
            if (!line)
                continue;
            line = line.trim();
            if (line.includes("at ") && !line.includes("DbgLogger")) {
                const match = line.match(/at .+? \((.+):(\d+):(\d+)\)/) ||
                    line.match(/at (.+):(\d+):(\d+)/);
                if (match) {
                    if (isRelativePath) {
                        const absPath = match[1];
                        const lineNum = match[2];
                        if (!absPath || !lineNum) {
                            throw new Error("absPath or lineNum is empty");
                        }
                        const relativePath = this.toRelativePath(absPath);
                        return `${relativePath}:${lineNum}`;
                    }
                    else {
                        const filePath = match[1];
                        const lineNum = match[2];
                        const fileName = filePath?.split(/[/\\]/).pop() || filePath;
                        return `${fileName}:${lineNum}`;
                    }
                }
            }
        }
        return "";
    }
    static extractVariableName() {
        const stack = new Error().stack;
        if (!stack)
            return "";
        const lines = stack.split("\n");
        for (let i = 3; i < lines.length; i++) {
            const line = lines[i];
            if (!line) {
                throw new Error("Expected variable name");
            }
            if (line.includes("at ") && !line.includes("DbgLogger")) {
                // 这里可以尝试提取更多信息，但由于 JS 限制，很难完全自动推断
                // 实际项目中可以考虑使用 Babel 插件或 TypeScript transformer
                return "";
            }
        }
        return "";
    }
    /**
     * 调试打印函数
     */
    static debug(value, options) {
        const opts = { ...this.defaultOptions, ...options };
        if (!opts.enabled) {
            return value;
        }
        let output = "";
        // 添加时间戳
        if (opts.showTimestamp) {
            const timestamp = new Date().toLocaleTimeString();
            output += `[${timestamp}] `;
        }
        // 添加位置信息
        if (opts.showLocation) {
            const location = this.getCallerLocation(opts.isRelativePath);
            if (location) {
                output += `[${location}] `;
            }
        }
        // 添加自定义标签
        if (opts.label) {
            output += `[${opts.label}] `;
        }
        // 格式化输出
        if (opts.varName) {
            output += `${opts.varName} = ${this.formatValue(value)}`;
        }
        else {
            // 尝试自动推断变量名（有限支持）
            const autoName = this.extractVariableName();
            if (autoName) {
                output += `${autoName} = ${this.formatValue(value)}`;
            }
            else {
                output += `[表达式] = ${this.formatValue(value)}`;
            }
        }
        opts.logger(output);
        return value;
    }
    static setDefaultOptions(options) {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
    static enable() {
        this.defaultOptions.enabled = true;
    }
    static disable() {
        this.defaultOptions.enabled = false;
    }
}
/**
 * 主要的调试函数 - 需要手动传入变量名以获得最佳体验
 * 使用方式：
 * dbg(user, 'user') 或使用宏风格的辅助函数
 */
export function dbg(value, varName, options) {
    const finalOptions = varName ? { ...options, varName } : options;
    return DbgLogger.debug(value, finalOptions);
}
/**
 * 宏风格的调试函数 - 推荐使用方式
 * 使用 ES6 模板字符串来模拟变量名推断
 */
export const DBG = {
    /**
     * 使用方式：DBG.log(() => user) 或 DBG.log(() => ({ user, name, age }))
     */
    log(expr, options) {
        const value = expr();
        const funcStr = expr.toString();
        // 尝试从函数字符串中提取变量名
        let varName = "";
        // 匹配 () => varName 形式
        const singleVarMatch = funcStr.match(/^\(\s*\)\s*=>\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s*$/);
        if (singleVarMatch && singleVarMatch[1]) {
            varName = singleVarMatch[1];
        }
        // 匹配 () => ({ var1, var2 }) 形式
        else if (funcStr.includes("{") && funcStr.includes("}")) {
            const objMatch = funcStr.match(/\{\s*([^}]+)\s*}/);
            if (objMatch && objMatch[1]) {
                varName = `{ ${objMatch[1].trim()} }`;
            }
        }
        // 匹配 () => [var1, var2] 形式
        else if (funcStr.includes("[") && funcStr.includes("]")) {
            const arrMatch = funcStr.match(/\[\s*([^\]]+)\s*]/);
            if (arrMatch) {
                varName = `[ ${arrMatch[1]?.trim()} ]`;
            }
        }
        // 匹配函数调用形式
        else {
            const callMatch = funcStr.match(/^\(\s*\)\s*=>\s*(.+)\s*$/);
            if (callMatch) {
                if (!callMatch[1]) {
                    throw new Error("callmatch is error");
                }
                varName = callMatch[1].trim();
            }
        }
        if (!varName) {
            varName = "[复杂表达式]";
        }
        return DbgLogger.debug(value, { ...options, varName });
    },
};
/**
 * 简化的变量调试 - 需要手动提供变量名
 */
export function dbgVar(value, varName, options) {
    return dbg(value, varName, options);
}
/**
 * 多变量调试
 */
export function dbgMulti(variables, options) {
    Object.entries(variables).forEach(([name, value]) => {
        dbg(value, name, options);
    });
}
/**
 * 条件调试
 */
export function dbgIf(condition, value, varName, options) {
    if (condition) {
        return dbg(value, varName, options);
    }
    return value;
}
/**
 * 带标签的调试
 */
export function dbgWith(label, value, varName) {
    return dbg(value, varName, { label });
}
// 导出配置函数
export const dbgConfig = {
    setDefaults: DbgLogger.setDefaultOptions.bind(DbgLogger),
    enable: DbgLogger.enable.bind(DbgLogger),
    disable: DbgLogger.disable.bind(DbgLogger),
};
//# sourceMappingURL=dbg.js.map