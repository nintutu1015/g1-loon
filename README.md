# Google One SKU Inspector for Loon

Requires Loon 3.5.1 (983) or later.

Plugin subscription URL:
https://raw.githubusercontent.com/nintutu1015/g1-loon/main/G1-SKU.plugin

Enable the plugin, Script and MitM; install and trust the Loon root certificate on your own device. Open Google One normally, then view the local report at https://one.google.com/g1-sku-report or export JSON at https://one.google.com/g1-sku-report?format=json.

Read-only SKU collection, no subscription ID or price modification, no external reporting, no global UDP 443 rule. Local simulation tests pass; not tested on an actual Loon device. To test: `node --test test.cjs`.

Reference project: https://github.com/crhywun/g1-acq
