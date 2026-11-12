# Firebase region decision — P1.13

Status: **not selected; required before any cloud database/bucket creation or staging deployment**. Local emulator work does not select a real database location. This record prevents the deployment task from choosing a default implicitly.

Cloud Firestore documents that an instance's location cannot be changed after provisioning. A migration is a separate project, not a later configuration edit. Inspect existing project resources before assuming a new default database location remains free to choose. [Firestore location documentation](https://firebase.google.com/docs/firestore/locations).

## Decision procedure

1. Identify the intended staging and production projects and inspect any existing databases, storage buckets and location dependencies. Do not provision resources to discover defaults.
2. Compare service support and latency from the intended Ugandan networks and an initial international market. Include operation/storage costs and any business requirements about data location. Geographic distance alone is not a measured latency result.
3. Check the current supported-location lists for Firestore, the intended Functions generation, Cloud Storage and Hosting-to-Functions rewrites. The services have separate configuration; an available Firestore region alone does not prove that the whole proposed deployment is supported there.
4. Write down the exact Firestore database location, Functions region, Storage bucket location and Hosting rewrite arrangement, the evidence/rationale, and whether staging and production use the same topology. Prefer sensible colocation where supported; explain any split rather than accepting defaults.
5. Present the concrete location choice to the owner and record the decision before provisioning. The subsequent deployment task uses those explicit settings and refuses a missing decision.

Firestore's current list includes Johannesburg (`africa-south1`) and Belgium (`europe-west1`) as candidates to evaluate; no claim is made here about which is faster from Kampala or supported by every other service. [Firestore locations](https://firebase.google.com/docs/firestore/locations), [Functions locations and service proximity](https://firebase.google.com/docs/functions/locations), [Storage locations](https://cloud.google.com/storage/docs/locations), [Hosting integration constraints](https://firebase.google.com/docs/hosting/functions).

## Record to complete at P1.13

| Field | Current value |
| --- | --- |
| Staging project / existing resources | Not supplied / not inspected |
| Production project / existing resources | Not supplied / not inspected |
| Firestore location | Not selected |
| Functions region and generation | Not selected |
| Storage bucket location | Not selected |
| Hosting rewrite compatibility | Not verified for a selected topology |
| Uganda / international latency evidence | Not collected |
| Cost and location requirements | Not confirmed |
| Owner location approval | Pending a concrete proposal |

Acceptance: the record contains supported explicit locations and rationale, the owner has approved the proposal, and deployment configuration will match it. Until then P1.14 staging is blocked, while local P1.01–P1.12 work can proceed after the separate spacing gate.
