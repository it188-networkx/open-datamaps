# PR 检查

所有 PR 运行固定的 `PR checks` 门禁；仅根目录 README.md、AGENTS.md、CI.md 的改动跳过构建和业务测试，未知路径执行完整检查。

Node.js 22，执行 `npm ci --ignore-scripts --no-audit --no-fund`、`npm run build:ci`、`npm run test:ci`。依赖锁文件保证安装可复现；不运行第三方安装脚本。

测试使用 Node 内置测试运行器，直接加载业务实现，不访问外部服务。构建产物不上传或发布。`.actrc` 支持本地 `act pull_request`。GitHub 必需检查通过后由原生 auto-merge 合并；特权流程不检出 PR 代码。
