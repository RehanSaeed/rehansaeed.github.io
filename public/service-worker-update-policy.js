// Gridsome auto-approves updates; only the new reader prompt may activate a waiting worker.
self.addEventListener("message", (event) => {
  if (
    event.data?.type === "SKIP_WAITING" &&
    event.data.readerApproved !== true
  ) {
    event.stopImmediatePropagation();
  }
});
