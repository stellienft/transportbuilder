const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareConfig {
  apiToken: string;
  zoneId: string;
}

function getConfig(): CloudflareConfig {
  return {
    apiToken: process.env.CLOUDFLARE_API_TOKEN!,
    zoneId: process.env.CLOUDFLARE_ZONE_ID!,
  };
}

// Create a DNS A record for a subdomain pointing to a droplet IP
export async function createDnsRecord(subdomain: string, dropletIp: string) {
  const config = getConfig();
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${config.zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'A',
      name: `${subdomain}.transitpage.com`,
      content: dropletIp,
      ttl: 1, // Auto TTL
      proxied: true, // Orange cloud — Cloudflare proxy for SSL + DDoS protection
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare DNS create failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
  }

  return {
    dnsRecordId: data.result.id as string,
    name: data.result.name as string,
  };
}

// Delete a DNS record (when a site is torn down)
export async function deleteDnsRecord(dnsRecordId: string) {
  const config = getConfig();
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${config.zoneId}/dns_records/${dnsRecordId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare DNS delete failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
  }

  return true;
}

// Add a custom hostname for a Pro+ customer (Cloudflare for SaaS)
export async function addCustomHostname(hostname: string) {
  const config = getConfig();
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${config.zoneId}/custom_hostnames`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hostname,
      ssl: {
        method: 'http',
        type: 'dv',
        wildcard: false,
      },
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare custom hostname failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
  }

  return {
    customHostnameId: data.result.id as string,
    hostname: data.result.hostname as string,
    sslStatus: data.result.ssl?.status as string,
  };
}

// Verify a custom hostname's SSL status
export async function verifyCustomHostname(customHostnameId: string) {
  const config = getConfig();
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${config.zoneId}/custom_hostnames/${customHostnameId}`, {
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare custom hostname verification failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
  }

  return {
    hostname: data.result.hostname as string,
    sslStatus: data.result.ssl?.status as string,
    ownershipVerification: data.result.ownership_verification as {
      type: string;
      value: string;
      method: string;
    } | null,
  };
}

// Delete a custom hostname
export async function deleteCustomHostname(customHostnameId: string) {
  const config = getConfig();
  const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${config.zoneId}/custom_hostnames/${customHostnameId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
    },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare custom hostname delete failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
  }

  return true;
}
