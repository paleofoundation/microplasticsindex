# Microplastics Reference Library

ORDER MPI-BUILD-1. Domain: https://microplasticsindex.com.

This repository starts from `paleofoundation/heavymetalindex` main commit `c8df8ecee3144135aeb727c4aee0c526b9a8cb4c`, preserving its Git ancestry. The implementation tree retains the source visual templates and a neutral research image. All inherited scientific pages, datasets, certification surfaces, analytics, APIs, cron jobs, and operational tools are removed.

The selected literature collection covers all 17 requested library categories, led by plastic food storage. It includes 49 source records, 80 traced results/method-scope values, product and ingredient directories, exposure topics, a regulatory source guide, and search. All 433 supplied PDFs were inventoried, hash-checked and screened; selected sources received deeper methods/results review. This is not an exhaustive systematic review. Infant puree has review context only and an explicit direct-evidence gap.

## Run

```sh
npm ci
npm run build:theme
npm run build
npm test
npm run serve
```

Open http://127.0.0.1:4317. Node 22 or later is required. The stylesheet is committed so the ordinary static build requires no compiler at runtime. `build:theme` regenerates it from the retained HMI Sass sources and the narrow topic adapter.

## Authoring

`content/pages.json` holds page content and metadata. `data/sources.json` holds source records. `data/claims.json` holds exact reported results, methods, conditions, units, locators, and primary artifact hashes. `{{claim:id}}` renders a verified measurement and `{{cite:source-id}}` generates first-appearance reference numbering and DOI bibliography entries.

Product and ingredient articles use the same `article()` template in `templates/site.mjs`, including the masthead, section navigation, reading column, evidence table, source references, and citation apparatus. Product, ingredient and exposure-topic directories link every category. Source pages display exact reported values with their original document locations.

See [template mapping](docs/template-port.md), [scientific review](docs/full-library-review.md), [acceptance](docs/acceptance.md), and [scope](docs/mpi-build-1-contract.md).

## Hosting boundary

Only a protected Vercel preview is authorized. Automatic Git deployment is disabled in `vercel.json`. No domain has been assigned. Elon reviews and merges; Rae handles DNS. The requested baby-wipes cross-contaminant report uses the owner-supplied canonical URL; its apex DNS fix is external to this build.
