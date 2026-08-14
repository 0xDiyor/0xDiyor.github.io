---
title: "Self-Hosting Matrix: Tuwunel, E2EE, and What Went Wrong"
date: 2026-08-14
tags: ["matrix", "selfhosting", "security", "e2ee"]
description: "Setting up a self-hosted Matrix homeserver with Tuwunel for Hermes messaging on my iPhone, enabling E2EE, and the problems I ran into along the way."
---

I wanted Hermes, my automation assistant, to deliver messages to my iPhone: cron job output, job search digests, reminders. This post covers how I set up a self-hosted Matrix homeserver for that, how I enabled end-to-end encryption, and the problems I hit along the way.

## Context

I compared the usual chat platforms against Matrix and went with Matrix for two reasons. It's an open protocol, so there's no vendor lock-in and no API paywall for running a bot. And it supports end-to-end encryption, which matters when a third party operates the server.

Then I had to pick between a public homeserver and a self-hosted one. A public server like matrix.org is fast to get working but you don't control it, which makes E2EE essentially mandatory. Self-hosting means owning the whole stack: DNS, TLS, federation, updates. Modern Rust homeservers run in about 150MB of RAM, which fits comfortably on my VPS alongside everything else. I went self-hosted for the control and the learning.

## Understanding the Stack

Four pieces make up the setup:

**Tuwunel** is the homeserver. It's a Rust implementation and the successor to Conduit and conduwuit. It handles accounts, rooms, and federation, stores everything in RocksDB, and ships as a hardened systemd unit that runs as its own user.

**Caddy** is the TLS reverse proxy in front of it. It terminates HTTPS on port 443 and forwards to Tuwunel, which listens on loopback only. Caddy handles certificate issuance automatically.

**Hermes** connects through its gateway, which logs in as a bot user. It handles sending and receiving messages, and with the right packages installed, end-to-end encryption.

**Element X** is the client I use on my iPhone to talk to the bot. It supports E2EE.

## Let's Begin

### Deploying Tuwunel

Tuwunel installs from an official apt repo. The important config decisions are in `/etc/tuwunel/tuwunel.toml`:

```toml
[global]
server_name = "matrix.0xdiyor.com"
address = ["127.0.0.1"]
port = 8008
registration_shared_secret = "<generated>"
allow_registration = false
allow_encryption = true
allow_federation = true
```

One thing to understand before you commit: `server_name` is immutable. It becomes the domain part of every user ID, `@user:matrix.0xdiyor.com`, and cannot be changed later. I used the subdomain as the server name, which also makes client discovery automatic, and Tuwunel serves the federation `.well-known` file itself through Caddy, so nothing touches my portfolio site's DNS.

### Caddy

The Caddyfile is two lines:

```
matrix.0xdiyor.com {
    reverse_proxy 127.0.0.1:8008
}
```

I verified the install with `curl -s https://matrix.0xdiyor.com/_matrix/client/versions`, which should return the API version list.

### The Parking Wildcard Problem

The first real problem: my DNS registrar (Porkbun) installs a wildcard CNAME on every account that points every unconfigured subdomain at a parking page. Matrix traffic was silently redirected to that page, ACME certificate challenges were failing, and the gateway was logging `404 pixie proxy`.

The symptom set looked like a broken server, not a DNS issue, so this took a while to pin down. The fix was one explicit A record for `matrix` pointing at the VPS IP. An exact-match A record takes precedence over the wildcard, so the parking redirect stopped.

## User Setup

With registration disabled, I created users through the Synapse-style admin register endpoint, which Tuwunel exposes when `registration_shared_secret` is set. The flow is: GET a nonce, compute an HMAC-SHA1 signature over the nonce, username, password, and admin flag, then POST. The response includes an access token for the new user.

I hit one gotcha here. Resetting the admin user's password to a strong one revoked every access token that user held, including the one I was using to perform the reset. The very next admin call failed with `M_UNKNOWN_TOKEN`. The fix is to re-login for a fresh token before continuing any admin work.

## Wiring the Gateway

The Hermes gateway config lives in `~/.hermes/.env`. The essentials:

```
MATRIX_HOMESERVER=https://matrix.0xdiyor.com
MATRIX_USER_ID=@hermes:matrix.0xdiyor.com
MATRIX_PASSWORD=...
MATRIX_ALLOWED_USERS=@diyor:matrix.0xdiyor.com
MATRIX_DEVICE_ID=HERMES_BOT
```

`MATRIX_ALLOWED_USERS` is the security-critical one. A bot that can act on your behalf is a dangerous default, and anyone who can reach an unrestricted bot can trigger it with full tool access. I locked it to my user ID only.

Proactive messages, like cron output, go to a home room. I typed `/sethome` in the bot's DM and the gateway persisted the room itself. Cron jobs now deliver there.

One operational note: restarting the gateway from inside the gateway is blocked, because the restart would kill the very session issuing the command. I scheduled the restart with `at`, which runs outside the service's process tree.

## Enabling E2EE

End-to-end encryption on Matrix means messages are encrypted on the sender's device and the server only ever relays ciphertext. The server operator, in this case me, cannot read them.

Enabling it took three pieces:

1. Install the encryption support: `mautrix[encryption]` and `libolm`.
2. Set `MATRIX_E2EE_MODE=required` so the bot fails closed instead of ever sending plaintext.
3. Bootstrap cross-signing. On first connect, Hermes generates a recovery key and writes it to a local file. I copied it into the environment as `MATRIX_RECOVERY_KEY` so future restarts self-verify the bot's identity.

I verified the bot's device keys were uploaded and signed by querying them via the keys API, then created an encrypted test room with `m.megolm.v1.aes-sha2` as the encryption algorithm. The bot auto-joined, replied, and the reply came back encrypted, with the shield icon showing in Element X.

I made one layout mistake here: I initially had a plaintext home room (the original channel) and an encrypted DM. Splitting traffic between an unencrypted room and an encrypted one defeated the point, so I created a fresh encrypted room, moved the home channel to it, and left the plaintext one behind. Everything is encrypted now.

## The Crypto Store Reset

The most interesting problem came after a routine gateway restart.

**Symptom:** messages sent before the restart showed "Waiting for this message" in Element X and never resolved. The bot wasn't replying in that room. Rooms created or used after the restart worked fine.

**Root cause:** during the restart, the gateway's local crypto store was recreated. The bot's device kept its ID but generated new encryption keys. My phone still held the old room key and refused to hand it to a device that no longer matched the one it trusted. The gateway log showed it at the exact timestamp of my stuck message: `DecryptionError: no session with given ID found`.

**Fix:** the stuck messages were permanently undecryptable, which is the E2EE guarantee working as intended, so I deleted those bubbles. Then I verified and trusted the bot's new session in Element X and sent a fresh message, which established a new session and worked immediately.

The lesson here: a bot's key store is a fragile asset. If it gets wiped, the bot gets a new identity and the encrypted history becomes unreadable, and no amount of server access can recover it, because the server never had the keys.

## Element X Quirks

The standard fix for a broken encryption session is `/discardsession` in the desktop Element client. Element X on iOS doesn't support that command. Typing it sends it to the bot as a plain message, and the bot replies "unknown slash command". Session rotation still happens on its own once you verify the new device and send a fresh message. A force-quit of the app forces the re-sync.

## Things I Found Interesting

- E2EE on Matrix treats the server operator as the adversary. Self-hosting doesn't let you peek at your own encrypted traffic, and that's correct behavior.
- Clock skew is a real issue: if the host clock runs ahead, the gateway drops inbound events as "too old". The fix is NTP sync and a gateway restart.
- An access token is full control of the account. If one is compromised, log out all sessions to revoke. Also, every diagnostic login creates a new device, which pollutes the device list over time.

## Key Takeaways

- Self-hosted Matrix with E2EE is very doable on a modest VPS. The deployment is the easy part; key management is the real responsibility.
- If you run an encrypted bot, treat its key store like a database. Back it up, or accept that a wiped store means a new identity and an unreadable past.
- The log timestamps and protocol responses told me exactly what broke. Reading them before guessing saved me from replacing healthy infrastructure.

## References

- [Tuwunel](https://github.com/matrix-construct/tuwunel)
- [Matrix protocol spec](https://spec.matrix.org)
- [Element X](https://element.io)
- [Hermes Matrix gateway docs](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/matrix)
