import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import {
    assertNoPageErrors,
    waitForWorkerActivation,
} from "./parity/browser-checks.mts";

class FixtureWorker extends EventTarget {
    state: ServiceWorkerState = "installed";

    change(state: ServiceWorkerState) {
        this.state = state;
        this.dispatchEvent(new Event("statechange"));
    }
}

const activation = (worker: FixtureWorker, timeout = 1000): Promise<void> => {
    class Registration {
        waiting = worker;
        installing = null;
        active = null;
    }
    const result: unknown = runInNewContext(
        `(${waitForWorkerActivation.toString()})(timeout)`,
        {
            self: { registration: new Registration() },
            ServiceWorkerRegistration: Registration,
            setTimeout,
            clearTimeout,
            timeout,
        },
    );
    return Promise.resolve(result).then(() => {});
};

await test("parity checks fail on page errors instead of printing a success", () => {
    assert.doesNotThrow(() => {
        assertNoPageErrors([]);
    });
    const cause = new Error("Hydration failed");
    assert.throws(
        () => {
            assertNoPageErrors([cause]);
        },
        (error: unknown) => {
            assert(error instanceof AggregateError);
            assert.deepEqual(error.errors, [cause]);
            return true;
        },
    );
});

await test("activation waits for activated, not the beginning of activate", async () => {
    const worker = new FixtureWorker();
    let resolved = false;
    const completed = activation(worker).then(() => {
        resolved = true;
    });
    worker.change("activating");
    await Promise.resolve();
    assert.equal(resolved, false);
    worker.change("activated");
    await completed;
    assert.equal(resolved, true);
});

await test("already activated workers complete immediately", async () => {
    const worker = new FixtureWorker();
    worker.change("activated");
    await activation(worker);
});

await test("activation fails when the worker becomes redundant or never activates", async () => {
    const worker = new FixtureWorker();
    const completed = activation(worker);
    worker.change("redundant");
    await assert.rejects(completed, /became redundant/);
    await assert.rejects(
        activation(new FixtureWorker(), 10),
        /activation timed out/,
    );
});
