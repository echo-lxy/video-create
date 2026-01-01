import { compileTypeScript } from '@/lib/compiler/code-compiler';

describe('Code Compiler', () => {
  it('should compile valid TypeScript code', async () => {
    const code = `
      import React from 'react';
      export const MyVideo: React.FC = () => {
        return <div>Hello</div>;
      };
    `;

    const result = await compileTypeScript(code);
    expect(result.success).toBe(true);
    expect(result.code).toBeDefined();
  });

  it('should return error for invalid code', async () => {
    const code = 'this is not valid code {{{}';

    const result = await compileTypeScript(code);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

