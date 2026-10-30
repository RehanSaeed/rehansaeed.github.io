# Article traffic history

Article pages can display **page views**, including repeat views, from
Google Analytics 4. These are not visits, sessions or unique visitors.

The site stays statically hosted on GitHub Pages. During generation, the
`blog-content` module authenticates to Google's Data API, exports
`screenPageViews` and `userEngagementDuration` grouped by `date` and `pagePath`,
aggregates them by month, and writes
`/post-traffic.json`, retaining monthly history and only the latest 30 calendar
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

To preview real data before merging, manually run **Build** on the trusted
feature branch, not `main`. Unlike pull-request-triggered builds, this manual
run can use the reporting secret. It produces the `playwright-site` artifact
without deploying; extract its `playwright-site.tar` and serve `dist` locally.
Running on `main` can deploy the site and is not a preview-only operation.

### Identifiers and credentials

The numeric GA4 property ID identifies the property; it does not authorise
reporting access. Keep it in `GA4_PROPERTY_ID` rather than hardcoding it.
It is not included in the public traffic snapshot. The browser's `G-`
measurement ID is intentionally public and is not a reporting credential.
Neither ID grants access to private GA4 reports.

The service-account JSON contains a private key and must remain an Actions
**secret**. Never publish it, access tokens or Measurement Protocol API secrets.
Other identifiers and API keys must be assessed individually, not assumed safe
because they are called an ID. The per-article counts and engagement aggregates
in `/post-traffic.json` are intentionally public.

## Coverage and accuracy

- Only published article permalinks are exported. Hostname filtering excludes
  other sites in the property; trailing-slash variants are combined. Drafts and
  arbitrary paths never appear in the public snapshot.
- Coverage begins at the later of publication and `GA4_START_DATE`. Earlier
  history is labelled unavailable. GA4 cannot reconstruct traffic from before
  collection began, and this does not import Universal Analytics archives.
  Articles published before that start date show the site's standard warning
  callout above the statistics, naming Google Analytics and explaining that
  **All time** covers only recorded history, not the article's full lifetime.
  The warning explicitly includes any initial spike at publication in the
  missing history, without asserting that such a spike occurred.
  Changing the selected range does not hide it.
- Daily report rows before an article's publication date are excluded, including
  rows in its first month. Only aggregated counts and foreground seconds are
  published, not users, sessions or individual events.
- Exports include **today** in the property's reporting timezone, which is
  displayed with the chart. There is no artificial processing delay or fixed
  final date. The API request uses `today`, then pins pagination and snapshot
  coverage to that calendar date using the returned reporting timezone.
  Recent figures are **provisional** while Google Analytics processes incoming
  data; they can be incomplete or revised, including initially reported zeros.
  The concise source tooltip explains page views (including repeats), average
  foreground time per view and the provisional figures, and includes the source,
  update date and reporting timezone. Detailed collection limitations remain here
  rather than in that tooltip. A newly published article can have a chart
  in the next export, even if no views have been reported yet.
- The first and last monthly buckets may be partial. Months without report rows
  inside the declared tracking interval count as zero. Tracking outages must not
  be misrepresented by choosing an inaccurate start date.
- **All time**, **Last year** and **Last month** select all available monthly
  history, the last 12 monthly buckets, or the last 30 calendar days
  with daily points, respectively. The buttons sit below the statistics row and
  above the chart. When daily data covers the entire history (up to 30 days),
  default to **Last month** and hide both longer presets. Otherwise, when the
  history contains at most 12 monthly buckets, default to **Last year** and hide
  **All time**. Longer histories default to **All time** with all presets visible.
  These thresholds follow the preset windows, not calendar anniversaries, so the
  default always includes every recorded view. Preset visibility depends on the
  full available history, not the selected range or the number of nonzero buckets.
  Presets end at the snapshot's latest included date (today
  when exported, not a live feed) and never split a monthly aggregate or invent
  earlier coverage. The
  chart's date labels, total, engagement and plot update together. There is no
  separate date-range summary above the chart. Short histories
  retain their real start date. A legacy snapshot without daily data explicitly
  disables Last month until refreshed; short legacy histories use Last year
  instead so their monthly counts remain accessible.
- **Average engagement per view** is total GA4 `userEngagementDuration`
  (foreground seconds) divided by total `screenPageViews` in the selected range,
  rounded once to the nearest second. It is not an average of monthly averages,
  GA4's per-active-user engagement metric, reading completion or a session
  duration. It is unavailable when there are no recorded views or when a
  last-good snapshot predates engagement reporting. Decimal seconds are retained
  during aggregation.
- **Traffic / Engagement** buttons select one metric at a time, defaulting to
  Traffic. The chart uses page-view counts or average foreground seconds per
  view on its y-axis, retaining the selected date range and update annotations.
  The weighted summary is retained; each engagement point is that bucket's
  foreground seconds divided by its views. Zero-view buckets have no average
  and leave gaps in the engagement line, rather than becoming invented
  zero-second observations. Missing engagement or a zero-view range shows an
  explicit unavailable message without resetting the selected metric or range.
  Page views and weighted engagement use the shared `UStatistic` component:
  semantic description lists with matching large values and labels below,
  left-aligned in a two-column grid with a 3rem column gap and stacking with a
  1.5rem row gap on small screens. The parent formats and calculates the
  values. Date and metric controls use `UButton`'s bordered and filled-purple
  primary variants, retaining native pressed states and shared focus styling.
  Neither chart has a visible plot title; engagement axis ticks retain their
  duration units, and accessibility labels and tooltips identify the metric.
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
- Chart points and the source information use the shared `UTooltip` component
  for themed top-layer bubbles, directional arrows, viewport collision handling
  and Escape dismissal. The chart supplies a controlled point anchor and
  structured content; the source button also toggles on tap.
- The chart appears below GitHub comments, with per-bucket tooltips available
  by pointer, touch or keyboard focus. Tab enters the point group; arrow keys,
  Home and End inspect points, and Escape dismisses the tooltip. Point tooltips
  show a date header and compact labelled view/engagement values, rather than
  a long sentence; missing averages say **Unavailable**. Each point retains an
  accessible date and count. The info icon shows a floating source tooltip
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
Snapshots ending before today in the property's timezone are refreshed even
within that 24-hour window, including snapshots from the former four-day delay.
The same applies when a newly published article is missing. A failed refresh
retains the original snapshot without padding its dates or inventing counts for
new articles. Snapshots without recent daily coverage are also refreshed. Daily buckets are
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
at once. Each card's Traffic / Engagement buttons switch the plotted metric;
the update-label control compares a label below versus beside its line inside
the plot. Area fills and stepped treatments work with either metric.
The blog's own styles are isolated inside preview frames. Experimental
styles are not shipped as article options or a public design-lab route.

To exercise the review tool, set `TRAFFIC_DESIGNS_URL` and `BASE_URL` to
`http://127.0.0.1:8084`, then run
`npx playwright test traffic-designs.spec.ts --project=edge --project=firefox`.
These optional cases are skipped by ordinary site tests unless the design URL
is provided.
