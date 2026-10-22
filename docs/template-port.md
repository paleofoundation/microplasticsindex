# Retained template mapping

Source: paleofoundation/heavymetalindex main c8df8ecee3144135aeb727c4aee0c526b9a8cb4c. Exact retained file hashes are in templates/hmi/source-manifest.json.

| Source | Destination and adaptation |
| --- | --- |
| quartz/styles/proof-design.scss | Retained legacy reading grid, section navigation, rail, tables, citations, and tokens. |
| quartz/styles/v3-type.scss and v3-chrome.scss | Retained type system, header, footer, and responsive chrome. |
| quartz/styles/home-v3.scss | Retained home hero, paper ledger, start rows, split narrative, and registry cards. |
| quartz/components/styles/heroBand.scss and quartz/styles/article-layout.scss | Retained full-width research masthead and aligned article columns. |
| quartz/styles/references-v3.scss | Retained numbered reference cards with source type and DOI metadata. |
| quartz/components/styles/topNav.scss | Retained responsive header; the Sass variables import points to its new adjacent location. |
| quartz/components/styles/footer.scss | Retained footer geometry. |
| quartz/static/heroes/research-glassware-notebook-sampling-spoon.webp | Retained neutral laboratory scene, with topic-neutral accessible description. |
| TopNav, HeroBand, renderPage, Snav, Rail, Footer, reference-generation markup | Ported matching DOM/class contracts into templates/site.mjs. Topic labels and working destinations replace inherited links. Account, AI, operational, and certification actions are omitted because there is no corresponding v1 surface. |

The static template build replaces the source's evidence-heavy Quartz runtime. It keeps its visual source files and layout contracts without carrying the original data, generated scientific components, operational endpoints, scheduled jobs, or external service calls. This is a deliberate implementation simplification, not a claim of full runtime parity with HMI.

`templates/_mpi.scss` supplies the minimal base reset, static search dialog, page citation control, and responsive containment. Mobile tables scroll within their own region. The original source palette, Inter/Lora/IBM Plex Mono, masthead geometry, home sections, and reading columns remain.

Source styles remain verbatim except the one relocated Sass import; their original comments may identify their provenance. Source labels and scientific material are excluded from built public pages by the release check.
