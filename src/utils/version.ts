/**
 * Version utilities for ProteusJS
 */

export const version = '2.0.0';

export function getVersion(): string {
  return version;
}

export function isVersionSupported(requiredVersion: string): boolean {
  const current = version.split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const currentPart = current[i] || 0;
    const requiredPart = required[i] || 0;
    
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  
  return true;
}
