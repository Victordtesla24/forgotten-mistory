# W1-MV4 — the two occlusion failures are not this change

Both were measured on this branch's build and on a build of `origin/main`
(afad076) in the same session, on the same server (`:5632`), with the system
Chrome.

| test | this branch (b4e4b79, base e90c4e4) | origin/main afad076 |
|---|---|---|
| `TC-MV-OCCLUDE-01` text under the launcher clears AA | FAIL — `scrollY 14348: 4.00:1 (needs 4.5) … span.Skills_caveat__AOTAH … ink rgb(125,125,125) on launcher-painted ground rgb(31,31,31)` (reproduced 3×) | PASS |
| `TC-MV-OCCLUDE-02` the closed launcher never paints a light surface at 390 | FAIL — `the brightest ground the closed launcher paints at 390 is rgb(182,182,182) … ceiling 0.0968` | FAIL, identical |
| `MONO-MV-02` @390 / @640 launcher label at AA | PASS | PASS |

`TC-MV-OCCLUDE-01` is already fixed on main by a commit this branch's base
predates:

```
git diff e90c4e4 afad076 -- components/sections/Skills/Skills.module.css
-    color: var(--ink-300);
+    color: var(--mist-400);
```

That is the ink the test samples. `TC-MV-OCCLUDE-02` fails on main as well and
is about the closed launcher's own plate — neither is touched by this change,
which only moves the *open* panel (`.minivic-panel`, `lib/minivicPlacement.ts`).
