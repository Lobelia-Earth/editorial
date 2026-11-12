---
"@isardsat/editorial-server": minor
"@isardsat/editorial-common": minor
---

Lock items while they are being edited. The new `/locks/{itemType}/{id}` routes take, renew, release and report a lock held by a browser tab, which expires after 5 minutes without renewal. Updates and deletes sent with the `Editorial-Session` header return 423 while another tab holds the lock; writes without it, from API clients, work as before
