import path from "node:path";
import * as fs from "node:fs";
export function findProjectRoot(startDir) {
    let dir = startDir;
    while (dir !== path.parse(dir).root) {
        if (fs.existsSync(path.join(dir, "package.json"))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return process.cwd(); // fallback
}
//# sourceMappingURL=find.js.map