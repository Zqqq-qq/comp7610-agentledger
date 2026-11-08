# Reproducing the report review PDF

The v1.0 delivery-candidate PDF is generated from `docs/project/REPORT.md` and `docs/assets/architecture.svg` with the adjacent `render-report-review.py`. The English text uses standard PDF fonts; no external font, wallet, RPC or browser is required.

```sh
python3 -m pip install reportlab==4.4.9
python3 docs/project/render-report-review.py
```

The script writes `docs/project/REPORT.pdf`. It implements the Markdown/SVG subset used by this report and is a document-generation utility, not part of the DApp. It does not execute acceptance scenarios.

The repository's existing `scripts/report-pdf.mjs` Chrome generator remains available; it can produce the same report content with different pagination. Do not expect identical bytes between PDF renderers. Inspect the result after changes and refresh release hashes after merge under Issue #11.
