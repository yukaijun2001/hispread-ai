# REA evidence ledger

Static application evidence: `ev_4f7e8b9fe952757f9d2da9e8284bd623ae10426c4a9dbb0b7767628ad1ca0f0c`.
Summary projection: `ev_9f458e7f8b191a2d06b7cfb817ba794ec6e447e85aae137101288ef2d2fb1bb3`.
Artifact SHA256: `aa0aa2aa9010228fbd08d1203043fbc08ccec9b9f110255e5f9eec641bf2a88d`.
Five explicit paths were selected, including main/index, login particle artwork, workbench and quotes. REA parsed three JS files. The bundled vendor-heavy index exceeded the worker heap; 80 other inventoried files were outside this REA call. Thus graph coverage is partial, not proof of full behavioral equivalence. All 84 readable JavaScript modules were separately inventoried and read by domain; see evidence-core.md, evidence-domain.md, source-inventory.json.

Controlled runtime evidence: `ev_f77d75e2f149aa6b5c60e6e76bebf0fee285d213a8b06393d978b094ee155b56`.
REA opened https://supplier.hispread.com/, waited for login, clicked registration and observed the confirmation-password field at 1920×1000, Chinese locale, Asia/Shanghai. All declared actions completed. Some network requests were unfinished when the capture ended, so network capture is incomplete. No business record was modified.

Authorized session GET responses were separately collected in runtime-fixtures.json. Source screenshots were captured through Ego Browser, using the same viewport as local comparison. Live RPM, time and unread state can vary from the supplied historical screenshots.

2026-11-13 native-client follow-up: REA selected the previously captured `ccmax-public-client.js` from the local acceptance artifact directory. The analyzer timed out at its 45-second source budget; partial Evidence `ev_ee5a2946bcee12ba619be32b60bfafc5b23d8c27d7be1bf5e9f0fb5b96bedf3d` was retained and inspected through summary Evidence `ev_97bd758f48c526807b838ece75a4f75c144ed8f1cfb4a40c18190466ba4d6377`. No parsed-module or complete call-graph claim is made for this result. The quota correction described in `ccmax-native-integration.md` is based on separately read client text and authenticated live account/list/log responses, followed by HTTP/PostgreSQL regression and an isolated real-upstream Vue browser test. These observations must not be relabeled as successful REA runtime analysis.
