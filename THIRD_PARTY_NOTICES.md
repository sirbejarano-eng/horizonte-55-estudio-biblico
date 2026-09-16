# Third-party Bible text notices

The original software code of Horizonte 55 is licensed under MIT; see `LICENSE`. Original non-code study material remains all rights reserved unless expressly licensed otherwise. Bible translations and their derived catalogs retain their own terms and are not relicensed under MIT.

## Biblica® Open Nueva Biblia Viva™ (`spaonbv`)

Copyright © 2006, 2008 by Biblica, Inc. Used by permission. Licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). Biblica does not endorse or sponsor Horizonte 55.

Source: <https://open.bible/bibles/biblica-open-nueva-biblia-viva>

Horizonte 55 converts the official USFM package to its internal JSON structure. Formatting markers, footnotes and cross-references are not displayed as reading verses. The conversion rules are documented in `tools/convert-onbv.js`.

## Die Schlachter-Bibel 1951 (`deu1951`)

Copyright © 1951 Genfer Bibelgesellschaft (Geneva Bible Society). Translation by Franz-Eugen Schlachter. Made available under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

Source: <https://ebible.org/Bible/details.php?id=deu1951>

Horizonte 55 converts the official USFM package to its internal JSON structure. Formatting markers, footnotes and cross-references are omitted from the reading catalog. No biblical sentence is translated, summarized or rewritten by Horizonte 55.

## Santa Biblia — Reina Valera 1909 (`spaRV1909`)

Public Domain. Source: <https://ebible.org/Bible/details.php?id=spaRV1909>

The official USFM package is converted structurally to JSON. Formatting metadata, Strong attributes, footnotes and cross-references are omitted from the reading catalog. Explicit empty verse markers are omitted without renumbering or inventing text.

## World English Bible British Edition (`engwebpb`)

Public Domain. This is the 66-book British/International English edition. “World English Bible” is a trademark. Horizonte 55 does not rewrite the biblical text and does not use the trademark to identify a modified translation.

Source: <https://ebible.org/bible/details.php?id=engwebpb>

The official USFM package is converted structurally to JSON. Formatting metadata, Strong attributes, footnotes and cross-references are omitted from the reading catalog. Explicit empty verse markers are omitted without renumbering or inventing text.

Exact source packages, retrieval date, SHA-256 hashes and transformation descriptions are recorded in `vendor/SOURCES.json`.
