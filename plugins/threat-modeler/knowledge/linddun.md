# LINDDUN — the privacy axis (a second non-STRIDE intelligence source)

LINDDUN is to privacy what STRIDE is to security: a category checklist. We carry it to prove the
threat-map is open to MULTIPLE frameworks, not only STRIDE, and to seed a future `privacy/*` detection
class. (linddun.org.)

The seven categories:
- **L**inkability — can two records be tied to the same subject?
- **I**dentifiability — can a subject be singled out (names, emails, IPs)?
- **N**on-repudiation — can a subject be denied plausible deniability? (privacy sense)
- **D**etectability — can the existence of a record be observed?
- **D**isclosure of information — unauthorized access to data (overlaps STRIDE-I).
- **U**nawareness — is the subject uninformed about processing?
- **N**on-compliance — does it breach GDPR/CCPA/HIPAA obligations?

Statically detectable slices relevant to agent skills (candidate `privacy/*` probes, PARKED for now):
- **PII in fixtures / logs / committed data** — real emails, names, phone numbers shipped in a skill
  (Identifiability + Disclosure). A deterministic pattern probe, fits T0.
- A skill that quietly logs user prompts to disk/network (Detectability + Unawareness).

LINDDUN runs *alongside* STRIDE; for a skill subject to GDPR/CCPA it produces a privacy threat list that
maps to regulatory obligations. Keep it as a documented future axis so the gap ritual can graduate a
`privacy` detection class when there is corpus evidence for it.
