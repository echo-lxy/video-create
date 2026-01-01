import * as esbuild from 'esbuild-wasm';

let initialized = false;

export async function initializeCompiler() {
  if (initialized) return;

  try {
    await esbuild.initialize({
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.19.12/esbuild.wasm',
    });
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize esbuild:', error);
    throw error;
  }
}

export interface CompileResult {
  success: boolean;
  code?: string;
  error?: string;
}

export async function compileTypeScript(code: string): Promise<CompileResult> {
  try {
    if (!initialized) {
      await initializeCompiler();
    }

    const result = await esbuild.transform(code, {
      loader: 'tsx',
      target: 'es2020',
      format: 'esm',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    });

    return {
      success: true,
      code: result.code,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown compilation error',
    };
  }
}

