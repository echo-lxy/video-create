import { validateCode } from '@/lib/security/code-validator';

describe('Code Security Validator', () => {
  it('should pass valid Remotion code', async () => {
    const code = `
      import React from 'react';
      import { AbsoluteFill } from 'remotion';
      
      export const MyVideo: React.FC = () => {
        return <AbsoluteFill />;
      };
    `;

    const result = await validateCode(code);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject code with eval', async () => {
    const code = `
      import React from 'react';
      export const MyVideo = () => {
        eval('console.log("dangerous")');
        return <div>Test</div>;
      };
    `;

    const result = await validateCode(code);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about non-whitelisted imports', async () => {
    const code = `
      import React from 'react';
      import fs from 'fs';
      export const MyVideo = () => <div>Test</div>;
    `;

    const result = await validateCode(code);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

