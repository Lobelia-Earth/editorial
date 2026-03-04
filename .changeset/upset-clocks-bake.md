---
"@isardsat/editorial-admin": minor
"@isardsat/editorial-cli": minor
"@isardsat/editorial-client": minor
"@isardsat/editorial-common": minor
"@isardsat/create-editorial": minor
"@isardsat/editorial-react-toolkit": minor
"@isardsat/editorial-server": minor
---

- Inject Firebase token on each request.
- Verify Firebase token on the server using Google public keys, requiring no extra configuration on Editorial.
- Add firebaseAuth middleware to protect routes.
