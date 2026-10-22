# Microplastics Index

ORDER MPI-BUILD-1. Domain: https://microplasticsindex.com.

This repository starts from `paleofoundation/heavymetalindex` main commit `c8df8ecee3144135aeb727c4aee0c526b9a8cb4c`, preserving its Git ancestry. The implementation tree retains the source visual templates and a neutral research image. All inherited scientific pages, datasets, certification surfaces, analytics, APIs, cron jobs, and operational tools are removed.

The first review slice is plastic food storage. It includes five research-paper source records, two agency-context records, exact source-bound measurements, a methods guide, product/ingredient directory templates, and search. The remaining 16 product categories are not implemented. This is not a completed 17-category release.

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

Product and ingredient articles use the same `article()` template in `templates/site.mjs`, including the masthead, section navigation, reading column, evidence table, source references, and citation apparatus. The empty ingredient directory is an explicit coverage state, not a completed ingredient review.

See [template mapping](docs/template-port.md), [scientific review](docs/food-storage-evidence-review.md), [acceptance](docs/acceptance.md), and [scope](docs/mpi-build-1-contract.md).

## Hosting boundary

Only a protected Vercel preview is authorized. Automatic Git deployment is disabled in `vercel.json`. No domain has been assigned. Elon reviews and merges; Rae handles DNS. A merge should not be treated as scientific approval of the unresolved items in the acceptance record.
