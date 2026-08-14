---
title: "opskit: A Zero-Dependency PowerShell Diagnostics Toolkit for Windows"
date: 2026-08-14
tags: ["powershell", "tooling", "scripting", "projects"]
description: "How opskit is built: a zero-dependency PowerShell diagnostics toolkit for Windows, what's in it, the CI setup, and the script runner I deliberately haven't shipped yet."
---

opskit is a terminal based diagnostics toolkit for Windows that puts the checks a helpdesk runs dozens of times a week behind one menu. This post covers the design decisions, what's in it, how CI validates it, and the script runner I'm deliberately holding back.

## Context

Helpdesk work means running the same handful of diagnostics repeatedly: what process owns this port, is DNS resolving, when does this certificate expire, why is this machine slow. I kept rewriting the same one-liners from memory, so I built opskit: a single PowerShell script, zero dependencies, runnable on any stock Windows box.

## The Design Constraint

The hard requirement is that opskit runs on a stock Windows box with nothing installed. Windows PowerShell 5.1 ships with Windows 10 and 11, so that's the compatibility floor. No modules, no dependencies, no admin rights required, no package manager.

That one constraint decided every design choice that followed. If the tool needs anything beyond what the OS already provides, it fails the point of the tool.

## Architecture: One File, One Loop

opskit is a single script, `opskit.ps1`. The whole architecture is one pattern:

```
MENU -> DISPATCH -> FUNCTION -> PAUSE -> MENU
```

Menus are `while ($true)` loops that print options and read a choice. Dispatch is a hashtable of scriptblocks, deliberately not an `if/elseif` chain:

```powershell
$Dispatch = @{
    "1" = { Invoke-NetToolkit }
    "2" = { Invoke-PortsInUse }
    "3" = { Invoke-HealthSnapshot }
}
& $Dispatch[$choice]
```

Adding a feature means writing one function and adding one dispatch entry. Sub-menus repeat the same shape locally and return on `B`. The main loop exits on `Q`.

Output is ASCII only, with 16 color `Write-Host`. No ANSI escapes, no Unicode box drawing, because PowerShell 5.1's conhost mangles both and I want the menu to render correctly on a stock terminal session, not just on my own machine.

## What's In It (v0.3)

| Module | What it does |
|---|---|
| Ports in use | Maps listening ports to owning processes (port, address, PID, name) |
| Network toolkit | Subnet/CIDR math, DNS record lookups, latency and traceroute |
| System health snapshot | CPU, RAM, disk, uptime, top processes, optional text export for ticket notes |
| Certificate checker | Remote cert inspection (expiry, chain status) plus local store expiry scan with warning thresholds |

There's also a help screen (`H` from the main menu) covering navigation and expected input per module. The roadmap has v0.4 as a folder-scoped script runner and v0.5 as non-interactive mode.

## The Script Runner (Planned, Not Shipped)

The script runner is the one feature that can do damage, so it's the one I haven't shipped yet. When it lands, it's designed to be intentionally restricted:

- Only lists and executes `.ps1` files from the repo's own `scripts/` folder. No path input, no arbitrary execution.
- Shows the script's synopsis and asks for confirmation before running.
- SHA256 hash allowlisting via a manifest, so a tampered or unapproved script is refused even if it's sitting in the folder.

I'd rather ship a runner that refuses to do the wrong thing than one that can point anywhere.

## CI: Lint and Smoke Test

I do most of my development on Linux, where PowerShell doesn't exist, so I can't validate opskit locally. That forced CI to be the entire testing story.

Every push runs GitHub Actions on a `windows-latest` runner with two gates:

- **Lint**: PSScriptAnalyzer over the whole repo, failing on any warning or error. The only exclusion is `PSAvoidUsingWriteHost`, because colored host output is the point of a TUI.
- **Smoke test**: an end-to-end script that launches the real menu, pipes a scripted sequence of keystrokes through stdin, and asserts on marker strings in the captured output. It exercises the Windows-only paths (`Get-NetTCPConnection`, `Get-CimInstance`, `Resolve-DnsName`, the `Cert:` drive) on every change.

To run headless, the script had to survive having no console. `Clear-Host` is skipped when output is redirected, and `RawUI.ReadKey` falls back to `Read-Host` when input is redirected. A side benefit: opskit now behaves sanely when its output is piped to a file.

## Things I Found Interesting

PowerShell 5.1 is full of small landmines you only hit when you actually target it. `@($x).Count` instead of `.Count` on a single object, because a lone object's count is unreliable in 5.1. `RawUI.ReadKey` doesn't exist in the ISE at all.

The smoke test has its own trap: it has to account for every pause in the menu, because each `Wait-ForKey` consumes a line of stdin. I hit an off-by-one where every answer after the pause desynchronized, and the failure looked completely unrelated to the menu. It took a while to figure out that a missing blank line in the input sequence was the cause.

## Key Takeaways

- The constraint did the design work. Deciding the tool had to run on a stock box with nothing installed forced one file, zero modules, ASCII output, and a dispatch table.
- Being unable to run your own tool forces honest engineering. CI is the only validation, so the README has to match reality and the smoke test has to cover everything.
- The most secure feature is sometimes the one you decline to ship until you can make it safe.

## References

- [opskit on GitHub](https://github.com/0xDiyor/opskit)
- [PSScriptAnalyzer](https://github.com/PowerShell/PSScriptAnalyzer)
- [Building and testing PowerShell in GitHub Actions](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-powershell)
