import { parse } from '@typescript-eslint/typescript-estree';

// 危险的 API 黑名单
const DANGEROUS_APIS = [
  'eval',
  'Function',
  'XMLHttpRequest',
  'fetch',
  'import',
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

const traverse = (node: any, errors: string[], warnings: string[]) => {
  if (!node) return;

  // 检查函数调用
  if (node.type === 'CallExpression') {
    const calleeName = getCalleeName(node.callee);
    if (DANGEROUS_APIS.includes(calleeName)) {
      errors.push(`Dangerous API detected: ${calleeName}`);
    }
  }

  // 检查 import 语句
  if (node.type === 'ImportDeclaration') {
    const importSource = node.source.value;
    const isAllowed = ALLOWED_IMPORTS.some((allowed) =>
      importSource.startsWith(allowed)
    );
    if (!isAllowed) {
      warnings.push(`Import from '${importSource}' may not be allowed`);
    }
  }

  // 递归遍历子节点
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      if (Array.isArray(node[key])) {
        node[key].forEach((child: any) => traverse(child, errors, warnings));
      } else {
        traverse(node[key], errors, warnings);
      }
    }
  }
};

export async function validateCode(code: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 解析代码为 AST
    const ast = parse(code, {
      jsx: true,
      comment: true,
      loc: true,
    });

    traverse(ast, errors, warnings);
  } catch (error: any) {
    errors.push(`Syntax error: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function getCalleeName(callee: any): string {
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression') {
    return `${getCalleeName(callee.object)}.${callee.property.name}`;
  }
  return '';
}

