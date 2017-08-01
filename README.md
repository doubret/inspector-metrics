# inspector-metrics
Typescript Metrics Library (copied from http://metrics.dropwizard.io)

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-metrics">
        <img src="https://img.shields.io/npm/v/inspector-metrics.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-metrics">
        <img src="https://img.shields.io/npm/l/inspector-metrics.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-metrics">
        <img src="http://img.shields.io/travis/rstiller/inspector-metrics/master.svg" alt="Build Status">
    </a>
    <a href="https://david-dm.org/rstiller/inspector-metrics">
        <img src="https://img.shields.io/david/rstiller/inspector-metrics.svg" alt="Dependencies Status">
    </a>
</p>

## install

This library is meant to be used with `typescript` / `nodejs`.

`npm install --save inspector-metrics`

## basic usage

At least a `MetricRegistry`, a `Metric` and a `MetricReporter` is necessary
to use the library.

Supported metric types:
* Counter
* Gauge
* Histogram
* Meter
* Timer

The library ships with a default `console` `MetricReporter`.

Some other reporter:
* [Influx](https://github.com/rstiller/inspector-influx)

```typescript
import { LoggerReporter, MetricRegistry, Timer } from "inspector-metrics";

// a registry is a collection of metric objects
const registry = new MetricRegistry();
// the reporter prints the stats
const reporter = new LoggerReporter(global.console);
// a new timer instance
const requests: Timer = registry.newTimer("requests");

reporter.addMetricRegistry(registry);
reporter.start();

// example usage
setInterval(() => {
    // should report a few milliseconds
    requests.time(() => {
        let a = 0;
        let b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
    });
}, 100);
```

### Counter

```typescript
import { Counter, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
const requestCount: Counter = registry.newCounter("requestCount");

// +1
requestCount.increment(1);

// -1
requestCount.decrement(1);

// =0
requestCount.getCount();

requestCount.reset();
```

### Gauge

```typescript
import { BaseMetric, Gauge, MetricRegistry, SimpleGauge } from "inspector-metrics";

class ArrayLengthGauge extends BaseMetric implements Gauge<number> {

    public constructor(name: string, private a: Array<any>) {
        super();
        this.name = name;
    }

    public getValue(): number {
        return this.a.length;
    }

}

const registry = new MetricRegistry();
const queueSize: Gauge<number> = new SimpleGauge("requestCount");
let myArray: number[] = [];
const arrayLength: Gauge<number> = new ArrayLengthGauge("arrayLength", myArray);

registry.registerMetric(queueSize);
registry.registerMetric(arrayLength);

queueSize.setValue(12345);

// 12345
queueSize.getValue();

myArray.push(1);
myArray.push(2);
myArray.push(3);

// 3
arrayLength.getValue();
```

### Histogram

```typescript
import { Histogram, MetricRegistry, Snapshot } from "inspector-metrics";

const registry = new MetricRegistry();
const entityCount: Histogram = registry.newHistogram("requestCount");

entityCount.update(12345);

// 12345
entityCount.getValue();

const snapshot: Snapshot = entityCount.getSnapshot();

// mean count
const mean: number = snapshot.getMean();
```

### Meter

```typescript
import { Meter, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
const callCount: Meter = registry.newMeter("callCount");

callCount.mark(1);

const count: number = callCount.getCount();
const m15: number = callCount.get15MinuteRate();
const m5: number = callCount.get5MinuteRate();
const m1: number = callCount.get1MinuteRate();
const mean: number = callCount.getMeanRate();
```

### Timer

```typescript
import { MetricRegistry, MILLISECOND, Snapshot, StopWatch, Timer } from "inspector-metrics";

const registry = new MetricRegistry();
const callStats: Timer = registry.newTimer("callStats");

callStats.addDuration(100, MILLISECOND);

// 1
const count: number = callStats.getCount();
// ~1
const m15: number = callStats.get15MinuteRate();
// ~1
const m5: number = callStats.get5MinuteRate();
// ~1
const m1: number = callStats.get1MinuteRate();
// ~1
const mean: number = callStats.getMeanRate();

let snapshot: Snapshot = callStats.getSnapshot();

// some value around 100000000 (100ms in nanoseconds)
const mean: number = snapshot.getMean();

const timer: StopWatch = callStats.newStopWatch();

timer.start();
// 100ms has passed
timer.stop();

snapshot = callStats.getSnapshot();
// snapshot gets updated through stop-watch ...
snapshot.getMean();

callStats.time(() => {
    // some time has passed
});

snapshot = callStats.getSnapshot();
// snapshot gets updated through time function ...
snapshot.getMean();
```

### MetricListeners

```typescript
import { Metric, MetricRegistry, MetricRegistryListener, MetricRegistryListenerRegistration } from "inspector-metrics";

class Listener implements MetricRegistryListener {

    public metricAdded(name: string, metric: Metric): void {
        console.log(`added metric ${name}: ${metric}`);
    }

    public metricRemoved(name: string, metric: Metric): void {
        console.log(`removed metric ${name}: ${metric}`);
    }

}

const registry = new MetricRegistry();
const registration: MetricRegistryListenerRegistration = registry.addListener(new Listener());

// prints "added metric requests: Counter..." via console
registry.newCounter("requests");

// removes the listener
registration.remove();
```

### Metric Groups

Each metric can have a group, which is used to gather different metrics
within metric reporter instances. E.g. if only gauges are used
to gather metrics data a group can be used to report them all as one
measure point with different fields.

```typescript
import { Gauge, MetricRegistry } from "inspector-metrics";

const registry = new MetricRegistry();
// reports the internal storage capacity of a queue
const capacity: Gauge<number> = ...;
// reports the element count in the queue
const queueSize: Gauge<number> = ...;

// all values grouped as buffer
registry.registerMetric(queueSize, "buffer");
registry.registerMetric(capacity, "buffer");
// counts the number of allocations during the execution of the application
registry.newCounter("newAllocations", "buffer");

// the reporter can now report the values as a single measurement point if supported ...
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
