# Firebase locations: existing Firestore and remaining services — P1.13

Status: **Firestore already selected and created by the owner; preserve it.** Read-only CLI inspection confirmed the default database in `eur3` (Europe multi-region), Native mode, Standard edition. Do not create a replacement database or reconsider its location implicitly. Functions/Storage placement and staging deployment remain separate later tasks.

Project **night-in-kampala** and its web app are configured; see [FIREBASE_SETUP.md](FIREBASE_SETUP.md). The owner confirmed Firestore creation and CLI inspection verified `projects/night-in-kampala/databases/(default)` with `locationId: eur3`, `type: FIRESTORE_NATIVE`, `databaseEdition: STANDARD`. Staging/production role and other services' settings remain unconfirmed. No document contents were read or changed.

Cloud Firestore documents that an instance's location cannot be changed after provisioning. A migration is a separate project, not a later configuration edit. Inspect existing project resources before assuming a new default database location remains free to choose. [Firestore location documentation](https://firebase.google.com/docs/firestore/locations).

## Remaining location work

1. Retain the existing default Firestore database in `eur3` and confirm its intended role. Cloud staging and production must use distinct projects/origins; supply/select a separate staging project before synthetic cloud data is introduced. No new project/database has been created. Current code protects `night-in-kampala` from staging use while its intended production role is confirmed.
2. Inspect any existing Storage bucket and Functions deployments before choosing their locations. The configured bucket name alone does not confirm that the bucket exists or reveal its location.
3. Use Firebase's documented `eur3` → `europe-west1` mapping as the Functions proposal. Verify the intended Functions generation and Hosting rewrite support, and account for any existing Storage location. This is a service-proximity recommendation, not a measured Kampala latency result.
4. Record the remaining concrete topology, costs/constraints and staging arrangement before provisioning or deployment. Obtain approval for any new resource placement; Firestore's existing owner selection needs no repeat approval.

Firebase identifies `eur3` as Europe multi-region and maps it to `europe-west1` for the nearest supported Functions region. Do not pass `eur3` itself as a Functions region. [Firestore locations](https://firebase.google.com/docs/firestore/locations), [Functions mapping](https://firebase.google.com/docs/functions/locations), [Storage locations](https://cloud.google.com/storage/docs/locations), [Hosting integration constraints](https://firebase.google.com/docs/hosting/functions).

## Record to complete at P1.13

| Field | Current value |
| --- | --- |
| Connected owner project | `night-in-kampala`; web app configured; Firestore metadata verified through authenticated CLI |
| Staging / production role | Not yet confirmed |
| Firestore database | `(default)`, Native mode, Standard edition; existing owner-created database |
| Firestore location | `eur3` (Europe multi-region), confirmed; preserve it |
| Functions region and generation | `europe-west1` proposed from the official mapping; not configured/deployed as a cloud resource |
| Storage bucket location | Not inspected; configured name is `night-in-kampala.firebasestorage.app` |
| Hosting rewrite compatibility | Not verified for a selected topology |
| Uganda / international latency evidence | Not collected |
| Cost and location requirements | Not confirmed |
| Owner location approval | Firestore selection already confirmed by owner; remaining placements need a concrete proposal |

Acceptance for the remaining P1.13 work: retain verified Firestore settings, resolve supported Functions/Storage placement and staging role, then ensure deployment configuration matches the approved remaining topology. P1.14 staging still depends on that work. Local development can continue without creating or changing cloud resources.

[DEPLOYMENT_PREPARATION.md](DEPLOYMENT_PREPARATION.md) now describes explicit build targets, approved profile validation and matched region/build predeploy hooks. Their local tests do not approve a topology, create resources or complete P1.13/P1.14. Real project roles, credentials/access, regions, billing and deployed behaviour still need verification.
