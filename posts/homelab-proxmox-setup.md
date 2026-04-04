## Overview

This post documents the architecture and setup of my cybersecurity homelab — built for learning threat detection, network security, and offensive security in a controlled environment.

The goal isn't to build something production-ready. It's to build something I can break, observe, and learn from.

## Hardware

The core of the lab runs on a **Minisforum MS-790 Pro**:

- AMD Ryzen 9 7940HS
- 32GB RAM
- 2TB NVMe SSD
- Running Proxmox VE as the hypervisor

Storage is handled by a **Ugreen DXP2800 NAS** with 12TB of raw capacity, running TrueNAS Scale with ZFS.

## Architecture

The stack is layered:

- **pfSense** — firewall and routing, VLAN segmentation between lab segments
- **Suricata** — network IDS/IPS, monitoring traffic between segments
- **Wazuh** — SIEM and host-based intrusion detection
- **GNS3** — network simulation for testing topologies before deploying

## Network Segmentation

The key design decision was separating the lab into isolated segments:

- **Management VLAN** — Proxmox management, NAS access
- **Blue Team VLAN** — Wazuh, monitoring tools, log aggregation
- **Red Team VLAN** — attack simulation, intentionally vulnerable VMs
- **General VLAN** — everyday traffic, kept separate from lab activity

This lets me simulate attacker traffic without risking my actual network.

## What's Next

The planned progression for offensive tooling:

1. `nmap` / `hping3` — network reconnaissance fundamentals
2. Metasploit / Metasploitable — structured exploitation practice
3. C2 frameworks (Sliver, Covenant) — command and control simulation

Each stage gets its own writeup as I work through it.
