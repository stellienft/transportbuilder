const DO_API_BASE = 'https://api.digitalocean.com/v2';

function getApiToken(): string {
  return process.env.DIGITALOCEAN_API_TOKEN!;
}

// The snapshot ID of the base Transport Builder image (Ubuntu + Nginx + Node + config-pull script)
// This should be set once after creating the base snapshot
const BASE_SNAPSHOT_ID = process.env.DO_BASE_SNAPSHOT_ID || '';

// Create a new droplet for a customer site
export async function createDroplet(siteSlug: string, siteId: string, plan: 'starter' | 'pro' | 'premium') {
  const token = getApiToken();
  
  // Choose size based on plan
  const sizeMap = {
    starter: 's-1vcpu-1gb',   // $6/mo
    pro: 's-1vcpu-1gb',       // $6/mo (same for now, calculator is lightweight)
    premium: 's-2vcpu-2gb',   // $12/mo
  };
  
  const response = await fetch(`${DO_API_BASE}/droplets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `tp-${siteSlug}`,
      region: 'syd1',  // Sydney — closest for AU transport companies
      size: sizeMap[plan],
      image: BASE_SNAPSHOT_ID || 'ubuntu-24-04-x64',  // fallback to plain Ubuntu
      backups: false,
      ipv6: false,
      user_data: `#cloud-config
runcmd:
  - mkdir -p /etc/transitpage
  - echo "TRANSITPAGE_SITE_ID=${siteId}" > /etc/transitpage/config.env
  - echo "TRANSITPAGE_SITE_SLUG=${siteSlug}" >> /etc/transitpage/config.env
  - echo "TRANSITPAGE_API_URL=https://transitpage.com" >> /etc/transitpage/config.env
  - systemctl restart transitpage-pull
`,
      tags: ['transitpage', `site:${siteId}`, `plan:${plan}`],
    }),
  });

  const data = await response.json();
  if (!data.droplet) {
    throw new Error(`DO droplet create failed: ${data.message || 'Unknown error'}`);
  }

  return {
    dropletId: String(data.droplet.id),
    name: data.droplet.name,
    status: data.droplet.status,
  };
}

// Get droplet details (including public IP)
export async function getDroplet(dropletId: string) {
  const token = getApiToken();
  const response = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!data.droplet) {
    throw new Error(`DO droplet get failed: ${data.message || 'Unknown error'}`);
  }

  const networkV4 = data.droplet.networks?.v4?.find((n: any) => n.type === 'public');
  
  return {
    dropletId: String(data.droplet.id),
    name: data.droplet.name,
    status: data.droplet.status,
    publicIp: networkV4?.ip_address || null,
  };
}

// Wait for droplet to be active and get its IP
export async function waitForDropletActive(dropletId: string, maxWaitMs = 120000): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const droplet = await getDroplet(dropletId);
    
    if (droplet.status === 'active' && droplet.publicIp) {
      return droplet.publicIp;
    }
    
    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error(`Droplet ${dropletId} did not become active within ${maxWaitMs / 1000}s`);
}

// Delete a droplet
export async function deleteDroplet(dropletId: string) {
  const token = getApiToken();
  const response = await fetch(`${DO_API_BASE}/droplets/${dropletId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`DO droplet delete failed: ${response.statusText}`);
  }

  return true;
}
