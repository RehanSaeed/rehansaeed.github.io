export const assertNoPageErrors = (errors: readonly Error[]) => {
    if (errors.length) {
        throw new AggregateError(
            errors,
            "Parity browser pages reported JavaScript errors.",
        );
    }
};

// Passed directly to Playwright's worker.evaluate; keep this function self-contained.
export const waitForWorkerActivation = (timeout: number): Promise<void> =>
    new Promise((resolve, reject) => {
        if (
            !("registration" in self) ||
            !(self.registration instanceof ServiceWorkerRegistration)
        ) {
            throw new Error("Service-worker registration is unavailable.");
        }
        const registration = self.registration;
        const worker =
            registration.waiting ??
            registration.installing ??
            registration.active;
        if (!worker) {
            throw new Error("Service worker is unavailable.");
        }
        const complete = (error?: Error) => {
            clearTimeout(timer);
            worker.removeEventListener("statechange", changed);
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        };
        const changed = () => {
            if (worker.state === "activated") {
                complete();
            } else if (worker.state === "redundant") {
                complete(
                    new Error(
                        "Service worker became redundant before activation.",
                    ),
                );
            }
        };
        const timer = setTimeout(() => {
            complete(new Error("Service-worker activation timed out."));
        }, timeout);
        worker.addEventListener("statechange", changed);
        changed();
    });
