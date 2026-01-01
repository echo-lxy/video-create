// 危险的 API 黑名单
const DANGEROUS_APIS = [
  'eval',
  'Function',
  'XMLHttpRequest',
  'fetch',
  'require',
  'process',
  'Buffer',
  '__dirname',
  '__filename',
  'global',
  'globalThis',
];

// 允许的 Remotion 和 React 导入
const ALLOWED_IMPORTS = [
  'react',
  'remotion',
  '@remotion/player',
  'lucide-react',
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 简单的正则表达式验证（不依赖 AST 解析器）
function validateWithRegex(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 检查危险的函数调用
    for (const dangerousApi of DANGEROUS_APIS) {
      // 匹配函数调用，如 eval(...) 或 window.eval(...)
      const regex = new RegExp(
        `(?:^|[^a-zA-Z0-9_])${dangerousApi}\\s*\\(`,
        'g'
      );
      if (regex.test(code)) {
        errors.push(`Dangerous API detected: ${dangerousApi}`);
      }
    }

    // 检查 import 语句
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const importSource = match[1];
      const isAllowed = ALLOWED_IMPORTS.some((allowed) =>
        importSource.startsWith(allowed)
      );
      if (!isAllowed) {
        warnings.push(`Import from '${importSource}' may not be allowed`);
      }
    }

    // 检查 require 调用
    const requireRegex = /require\s*\(/g;
    if (requireRegex.test(code)) {
      errors.push('require() calls are not allowed');
    }

    // 检查动态 import（允许，但给出警告）
    const dynamicImportRegex = /import\s*\(/g;
    if (dynamicImportRegex.test(code)) {
      warnings.push('Dynamic imports are not recommended');
    }
  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function validateCode(code: string): Promise<ValidationResult> {
  // 使用简单的正则表达式验证，避免在浏览器中使用 Node.js 特定的 AST 解析器
  // @typescript-eslint/typescript-estree 在浏览器环境中会失败
  return validateWithRegex(code);
}

