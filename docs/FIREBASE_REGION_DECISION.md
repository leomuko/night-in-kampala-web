# Firebase topology decision — P1.13

The owner approved this topology on **16 November 2026**. Preview and production use the same Firebase project, `night-in-kampala`.

| Resource | Approved placement |
| --- | --- |
| Cloud Functions | `europe-west1` |
| Default Firestore database | `eur3` (Europe multi-region, Native mode, Standard edition) |
| Storage | Existing `night-in-kampala.firebasestorage.app` bucket in `US-EAST1`, regional, default class `REGIONAL` |
| Hosting | A preview channel for review and the live channel for production |

Earlier read-only CLI checks verified the Firestore and bucket metadata. The owner retained the bucket and selected the Functions region. This decision records placement and access boundaries. Cloud deployment, live security checks and real-device testing are pending.

A Hosting preview channel shares Firestore, Storage, Authentication and project-wide callable Functions with the live site. Preview data remains in the project until cleanup. Deploying callable Functions, indexes or rules can affect all clients using the project. Clear reviewed test data before launch and avoid preview writes against live customer data afterward. [Firebase Hosting preview channels](https://firebase.google.com/docs/hosting/test-preview-deploy).

The US bucket and European Firestore/database path can add latency and network charges to media reads and publication. Europe-west1 is the documented Functions proximity choice for Firestore eur3. Measure actual image delivery in P1.14. [Functions locations](https://firebase.google.com/docs/functions/locations), [Firestore locations](https://firebase.google.com/docs/firestore/locations), [Storage locations](https://cloud.google.com/storage/docs/locations).

P1.14 still needs the owner’s permission for the first preview, confirmation that the live Storage test-mode rules are closed, and verification of the shared backend and Hosting rewrites. P1.15 requires the owner’s real-phone WhatsApp check. [Deployment preparation](DEPLOYMENT_PREPARATION.md).
