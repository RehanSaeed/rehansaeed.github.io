# Article traffic history

Article pages can display monthly **page views**, including repeat views, from
Google Analytics 4. These are not visits, sessions or unique visitors.

The site stays statically hosted on GitHub Pages. During generation, the
`blog-content` module authenticates to Google's Data API, exports monthly
`screenPageViews` grouped by `date` and `pagePath`, aggregates them by month, and writes
`/post-traffic.json`. The chart fetches this same-origin static snapshot; no
analytics credentials or private reporting API calls reach the browser.

## Configuration

1. Enable the Google Analytics Data API in a Google Cloud project.
2. Create a service account and grant its email **Viewer** access to the GA4
   property. Keep its JSON key in the repository Actions secret
   `GA4_SERVICE_ACCOUNT_JSON`. Do not commit the key.
3. Set repository Actions variable `GA4_PROPERTY_ID` to the numeric property ID,
   not the `G-` measurement ID used for collection.
4. Set repository Actions variable `GA4_START_DATE` to the first date of
   **reliable, continuous tracking**, in `YYYY-MM-DD` format. Verify the available
   history in GA4 first. This declares coverage; the API cannot prove that missing
   historical rows mean no traffic rather than missing tracking.
5. Run the Build workflow manually on `main`. Its daily schedule subsequently
   refreshes and redeploys the snapshot. GitHub may delay scheduled runs or
   disable schedules on inactive public repositories. Scheduled builds are
   skipped until `GA4_PROPERTY_ID` is configured.

For local generation, set the same server-only environment variables using
`.env.example`. The public `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` controls collection
separately. Reporting credentials are deliberately unavailable to PR builds.
If all reporting settings are absent, the build logs that reporting is disabled,
publishes a null snapshot, and shows no traffic cards. Partial or invalid
configuration fails the build.

## Coverage and accuracy

- Only published article permalinks are exported. Hostname filtering excludes
  other sites in the property; trailing-slash variants are combined. Drafts and
  arbitrary paths never appear in the public snapshot.
- Coverage begins at the later of publication and `GA4_START_DATE`. Earlier
  history is labelled unavailable. GA4 cannot reconstruct traffic from before
  collection began, and this does not import Universal Analytics archives.
- Daily report rows before an article's publication date are excluded, including
  rows in its first month. Only monthly aggregates are published.
- The end date is four UTC calendar days before generation, allowing more than
  48 hours for processing even in property timezones behind UTC. Reporting
  uses the property's timezone, which is displayed with the chart.
- The first and last monthly buckets may be partial. Months without report rows
  inside the declared tracking interval count as zero. Tracking outages must not
  be misrepresented by choosing an inaccurate start date.
- Reports with sampling, thresholding or high-cardinality data loss are rejected
  rather than publishing misleading zero-filled histories. Pagination retrieves
  all report rows. Blockers, consent choices and collection configuration can
  still cause undercounting; verify hard loads and Nuxt client navigation in GA4.
- The chart appears below GitHub comments, with monthly point tooltips available
  by pointer, touch or keyboard focus. Tab enters the point group; arrow keys,
  Home and End inspect months, and Escape dismisses the tooltip. Each point has
  an accessible date and count. The info icon reveals source and coverage notes.
  No charting library or third-party browser request is needed.

## Refresh and failures

`.data/blog-traffic.json` caches aggregates and their source settings for 24 hours.
The Build workflow restores and saves that file using Actions cache. Failed
requests retain a compatible last-good snapshot with a build warning and the
original visible update date. Without a snapshot, reporting failures fail the
build. Invalid configuration never falls back to another property's data.

Actions cache is **not a permanent analytics archive** and can be evicted.
Each refresh queries the full configured history from GA4. Long-term retention
independent of GA4 would need a separately backed-up archive; no Cloudflare
storage is provisioned by this feature. The snapshot is precached alongside
other static JSON for offline use and updates with the site's deployment/PWA.

## References

- [GA4 Data API reports](https://developers.google.com/analytics/devguides/reporting/data/v1/basics)
- [Dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [Data freshness](https://support.google.com/analytics/answer/11198161)
- [API quotas](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas)
