# Article traffic history

Article pages can display **page views**, including repeat views, from
Google Analytics 4. These are not visits, sessions or unique visitors.

The site stays statically hosted on GitHub Pages. During generation, the
`blog-content` module authenticates to Google's Data API, exports
`screenPageViews` and `userEngagementDuration` grouped by `date` and `pagePath`,
aggregates them by month, and writes
`/post-traffic.json`, retaining monthly history and only the latest 30 processed
days as daily aggregates. The chart fetches this same-origin static snapshot; no
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
  rows in its first month. Only aggregated counts and foreground seconds are
  published, not users, sessions or individual events.
- The end date is four UTC calendar days before generation, allowing more than
  48 hours for processing even in property timezones behind UTC. Reporting
  uses the property's timezone, which is displayed with the chart.
- The first and last monthly buckets may be partial. Months without report rows
  inside the declared tracking interval count as zero. Tracking outages must not
  be misrepresented by choosing an inaccurate start date.
- **All time**, **Last year** and **Last month** select all available monthly
  history, the last 12 monthly buckets, or the last 30 processed calendar days
  with daily points, respectively. The buttons sit below the statistics row and
  above the chart. Presets end at the snapshot's reporting cutoff, not today's
  date, and never split a monthly aggregate or invent earlier coverage. The
  displayed dates, total, engagement and plot update together. Short histories
  retain their real start date. A legacy snapshot without daily data explicitly
  disables Last month until refreshed.
- **Average engagement per view** is total GA4 `userEngagementDuration`
  (foreground seconds) divided by total `screenPageViews` in the selected range,
  rounded once to the nearest second. It is not an average of monthly averages,
  GA4's per-active-user engagement metric, reading completion or a session
  duration. It is unavailable when there are no recorded views or when a
  last-good snapshot predates engagement reporting. Decimal seconds are retained
  during aggregation.
- Engagement is plotted over time, either on the **Same chart** with a labelled
  right-hand seconds-per-view axis and a contrasting dashed line, or in
  **Separate charts**. Both views use the same date buckets. The weighted
  summary is retained; each plotted value is that bucket's foreground seconds
  divided by its views. Zero-view buckets have no average and leave gaps in
  the engagement line, rather than becoming invented zero-second observations.
- Dotted vertical annotations mark only the latest substantive update recorded
  in `dateModified`, when it falls within displayed coverage. Its exact date
  appears below the chart and in the relevant point tooltip. In a monthly view
  the marker identifies a month, not a daily traffic measurement or evidence
  that an update caused a change. The publication marker is intentionally
  omitted. Older update dates are not inferred from article text.
- Reports with sampling, thresholding or high-cardinality data loss are rejected
  rather than publishing misleading zero-filled histories. Pagination retrieves
  all report rows. Blockers, consent choices and collection configuration can
  still cause undercounting; verify hard loads and Nuxt client navigation in GA4.
- The chart appears below GitHub comments, with per-bucket tooltips available
  by pointer, touch or keyboard focus. Tab enters the point group; arrow keys,
  Home and End inspect points, and Escape dismisses the tooltip. Each point has
  an accessible date and count. The info icon shows a floating source tooltip
  on hover, focus or tap without shifting the chart. It stays available while
  hovered or focused and dismisses on Escape, loss of hover/focus or an outside
  tap.
  No charting library or third-party browser request is needed.

## Refresh and failures

`.data/blog-traffic.json` caches aggregates and their source settings for 24 hours.
The Build workflow restores and saves that file using Actions cache. Failed
requests retain a compatible last-good snapshot with a build warning and the
original visible update date. Without a snapshot, reporting failures fail the
build. Invalid configuration never falls back to another property's data.
View-only caches are refreshed even within 24 hours to add engagement; if that
refresh fails, their view history remains usable and engagement is explicitly
unavailable rather than fabricated.
Snapshots without recent daily coverage are also refreshed. Daily buckets are
validated for continuity, publication/cutoff bounds and consistency with monthly
counts. They come from the same paginated GA4 report, not a second API query.

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

## Local design review

Run `node scripts/traffic-designs.mjs` with the repository's supported Node
version, then open <http://127.0.0.1:8084/>. This builds the actual Vue traffic
component into a self-contained `.data/traffic-designs.html` with synthetic
counts, engagement and update dates, using the existing Vite/Vue tooling. The
helper serves only that artifact on loopback; no GA4 credentials, remote fonts
or additional dependencies are needed.

The twelve treatments explore line/area fills, statistics placement, chart
height and framing. Controls compare light/dark themes, desktop/mobile widths,
fill opacity, points and gridlines; **Show all twelve** displays every treatment
at once. Additional controls compare engagement on one versus two charts and
the latest-update label below versus beside its line inside the plot.
The blog's own styles are isolated inside preview frames. Experimental
styles are not shipped as article options or a public design-lab route.

To exercise the review tool, set `TRAFFIC_DESIGNS_URL` and `BASE_URL` to
`http://127.0.0.1:8084`, then run
`npx playwright test traffic-designs.spec.ts --project=edge --project=firefox`.
These optional cases are skipped by ordinary site tests unless the design URL
is provided.
