const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

export function classifyHostname(
  hostname: string | undefined
): 'development' | 'production' {
  return hostname !== undefined && LOCAL_HOSTNAMES.has(hostname)
    ? 'development'
    : 'production';
}

export function resolveDeploymentEnvironment(): 'development' | 'production' {
  return classifyHostname(
    typeof window !== 'undefined' ? window.location.hostname : undefined
  );
}
