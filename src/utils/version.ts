export function formatAppVersion(version: string): string {
  const parts = version.split('.');
  const [major, minor = '0', patch] = parts;

  if (!major) return 'ver0.0';
  if (!patch || patch === '0') return `ver${major}.${minor}`;
  return `ver${major}.${minor}.${patch}`;
}
