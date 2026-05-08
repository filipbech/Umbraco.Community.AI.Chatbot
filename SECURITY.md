# Security policy

## Supported versions

Until 1.0 lands, only the latest minor (`0.x`) is supported. After 1.0 we'll backport security fixes to the most recent two minor versions.

## Reporting a vulnerability

Please **do not** file a public GitHub issue for security-sensitive reports. Email the maintainer directly:

- **filipbech@umbraco.dk**

Include a description, reproduction steps, and the affected version. Expect an acknowledgement within a few days.

## What's in scope

This package ships an **anonymous, public-facing** chat endpoint that calls into an LLM. Anything that lets an attacker:

- bypass the per-IP rate limiter or the request size caps
- read content the chat instance shouldn't expose (e.g., member-only pages reachable through the search index)
- inject prompts that exfiltrate other tenants' data
- crash the host with crafted SSE input
- escalate from the public endpoint into the backoffice management API

…is in scope.

## Out of scope

- LLM-cost abuse via legitimate (rate-limited) traffic — that's a hosting concern; mitigate with a CDN/WAF in front (Cloudflare, AWS WAF, etc.).
- Issues in upstream Umbraco CMS or Umbraco.AI.* packages — report those upstream.
- Member-protected content reachable through the chat when the index *contains* that content. The README documents this trade-off; until a Member-aware `IChatPrincipalAccessor` ships, keeping member-only documents out of the search index is the supported mitigation.
