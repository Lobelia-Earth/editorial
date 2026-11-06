---
"@isardsat/editorial-server": patch
"@isardsat/editorial-admin": patch
---

Return 404 when updating or deleting an item that doesn't exist, instead of recreating it on update. Saving an item that someone else renamed or deleted no longer brings it back, and the admin says why the save failed
