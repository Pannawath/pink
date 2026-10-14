## 2026-10-14T15:25:36Z
You are the SWE Light Orchestrator (teamwork_preview_swe).

Your working directory is: d:\antigravity\pink\.agents\teamwork\swe_1
The project root is: d:\antigravity\pink
The user request is recorded in: d:\antigravity\pink\.agents\teamwork\ORIGINAL_REQUEST.md (specifically the latest follow-up at 2026-10-14T15:24:18Z).

Execute the SWE Light loop for this single self-contained fix:
1. Eliminate the mobile scroll flicker/jitter loop caused by height/margin collapse on #stageSegmentedWrapper altering container scroll height and main.scrollTop.
2. Reveal the header view switcher (#headerSegmentedControl) smoothly and stably in the navbar on mobile when scrolled down past threshold.
3. Smooth reversion on scroll back up to top.
4. Zero regressions on desktop layout (>= 1024px) or button interactions.
5. Comply with all invariants and pass gk_gatekeeper_scan.

Coordinate your implementer and reviewers, maintain your progress.md and handoff.md in d:\antigravity\pink\.agents\teamwork\swe_1, and report your completion report back to me via send_message when victory is ready to be audited.
