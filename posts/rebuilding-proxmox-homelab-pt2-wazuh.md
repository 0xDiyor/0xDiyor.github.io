## Overview

Installing and configuring **Wazuh** on my Proxmox homelab. Wazuh will serve as my SIEM, giving me visibility into what's happening across the VMs running on the host.

I started by reading through the official [Wazuh documentation](https://documentation.wazuh.com) to get familiar with the architecture before touching anything.

![Wazuh documentation overview](../assets/images/wazuh-pt2-documentation.png)

*Wazuh documentation — reading this first before installing anything*

## Wazuh Architecture

There are four core components to the Wazuh system: **Wazuh Indexer**, **Wazuh Server**, **Wazuh Dashboard**, and **Wazuh Agent**.

- **Wazuh Indexer** stores data as JSON documents. Each document maps field names to values — strings, numbers, Booleans, dates, arrays, and more. It's designed for near real-time analysis with very low latency.
- **Wazuh Server** is the central component. It analyzes data collected from Wazuh agents and agentless devices, detecting threats, anomalies, and compliance violations in real time. It also handles centralized agent management and monitors their operational status.
- **Wazuh Dashboard** is the web UI for visualizing alerts, events, and agent status.
- **Wazuh Agent** runs on monitored endpoints and ships data back to the server.

![Wazuh server architecture diagram](../assets/images/wazuh-pt2-server-architecture.png)

*Wazuh server architecture*

![Wazuh agent architecture diagram](../assets/images/wazuh-pt2-agent-architecture.png)

*Wazuh agent architecture*

For my setup, I'll be running the Wazuh server, indexer, and dashboard on the same host. A distributed deployment would be overkill for a homelab.

## Setting Up the Wazuh VM

I downloaded **Ubuntu 24.04 LTS** — the newest Ubuntu release that Wazuh officially supports at the time of writing. I added the ISO to Proxmox and configured the VM as follows:

![Proxmox VM configuration for Wazuh Ubuntu install](../assets/images/wazuh-pt2-ubuntu-vm-config.png)

*VM configuration in Proxmox before starting the Ubuntu installer*

During the Ubuntu Server installer, I set a DHCP reservation in the Xfinity Gateway admin panel and then assigned it a static IP within the installer itself.

![Ubuntu server static IP configuration](../assets/images/wazuh-pt2-ubuntu-static-ip.png)

*Static IP configured during the Ubuntu Server install*

![Ubuntu system install confirmation](../assets/images/wazuh-pt2-ubuntu-system-install.png)

*Ubuntu Server install completing successfully*

### Fixing LVM to Use the Full Disk

After the install, I noticed Ubuntu wasn't using the full 100GB I'd allocated — LVM only claimed a portion of it by default. I SSH'd from my MacBook and ran the following to expand the logical volume to use all available space:

```bash
sudo lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
sudo resize2fs /dev/ubuntu-vg/ubuntu-lv
df -h /
```

![SSH session fixing the LVM issue](../assets/images/wazuh-pt2-lvm-fix.png)

*Extending the LVM logical volume to use the full allocated disk*

## Installing Wazuh

With Ubuntu prepped, I ran a quick `sudo apt update && sudo apt upgrade` to get everything current, then used the Wazuh installation assistant to deploy the full stack in one shot:

```bash
curl -sO https://packages.wazuh.com/4.14/wazuh-install.sh && sudo bash ./wazuh-install.sh -a
```

The `-a` flag installs all components — indexer, server, and dashboard — on the same node. After it finished, I pulled up the web dashboard for the first time.

![Wazuh dashboard on first boot](../assets/images/wazuh-pt2-first-boot.png)

*Wazuh dashboard loading successfully after the all-in-one install*

## Deploying a Wazuh Agent

With the server up, I created a **Ubuntu 24.04 Desktop VM** as my first managed endpoint to deploy a Wazuh agent onto.

![Ubuntu Desktop VM confirmation in Proxmox](../assets/images/wazuh-pt2-desktop-vm.png)

*Ubuntu Desktop VM created and running in Proxmox*

After going through the Ubuntu installer, setting a static IP, and enabling SSH, I installed the Wazuh agent. I SSH'd from my Mac terminal to make copying the `wget` install commands easier, then enabled the agent via `systemctl`:

![Wazuh agent installation in progress](../assets/images/wazuh-pt2-agent-install.png)

*Installing the Wazuh agent on the Ubuntu Desktop VM*

Back in the Wazuh Dashboard, the agent showed up as active immediately.

![Wazuh dashboard showing active agent](../assets/images/wazuh-pt2-agent-dashboard.png)

*Wazuh agent visible and active in the dashboard*

## What's Next

The core stack is deployed and the first agent is reporting in. In Part 3, I'll go deeper into the Wazuh configuration — custom rulesets, alert tuning, and getting meaningful signal out of the SIEM instead of just noise.

## References

- [Wazuh official documentation](https://documentation.wazuh.com)
- [Wazuh installation assistant](https://documentation.wazuh.com/current/installation-guide/wazuh-indexer/index.html)
