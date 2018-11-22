/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import {
    Clock,
    Logger,
    LoggerReporter,
    MetricRegistry,
    MILLISECOND,
    SimpleGauge,
    Time,
} from "../../../lib/metrics/";

import { Scheduler } from "../../../lib/metrics/reporter/scheduler";

chai.use(sinonChai);

const expect = chai.expect;

export class MockedLogger implements Logger {
    public log(): void {}
    public error(): void {}
    public warn(): void {}
    public info(): void {}
    public debug(): void {}
    public trace(): void {}
}

export class MockedClock implements Clock {

    private currentTime: Time;

    public time(): Time {
        return this.currentTime;
    }

    public setCurrentTime(time: Time): void {
        this.currentTime = time;
    }

}

@suite
export class LoggerReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private logger: Logger;
    private loggerSpy: SinonSpy;
    private internalCallback: () => Promise<any>;
    private scheduler: Scheduler;
    private schedulerSpy: SinonSpy;
    private reporter: LoggerReporter;

    public before(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });

        this.registry = new MetricRegistry();
        this.logger = new MockedLogger();
        this.loggerSpy = spy(this.logger.info);
        this.logger.info = this.loggerSpy;
        this.scheduler = (prog: () => Promise<any>, interval: number): NodeJS.Timer => {
            this.internalCallback = prog;
            return null;
        };
        this.schedulerSpy = spy(this.scheduler);
        this.reporter = new LoggerReporter({
            clock: this.clock,
            log: this.logger,
            reportInterval: 1000,
            scheduler: this.schedulerSpy,
            tags: new Map(),
            unit: MILLISECOND,
        });

        this.registry.setDefaultClock(this.clock);
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public "remove metric-registry which was not added"(): void {
        this.reporter.removeMetricRegistry(this.registry);
        this.reporter.removeMetricRegistry(this.registry);

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        this.reporter.start();

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.have.been.called;
    }

    @test
    public async "no metric-registries added"() {
        this.reporter.removeMetricRegistry(this.registry);

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        if (!!this.internalCallback) {
            await this.internalCallback();
        }
        expect(this.loggerSpy).to.not.have.been.called;
    }

    @test
    public async "counter reporting"() {
        this.registry.newCounter("counter1");
        this.registry.newMonotoneCounter("monotone-counter1");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(2);
        let logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("monotone-counter1");
        expect(logMetadata.measurement_type).to.equal("counter");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;

        logMetadata = this.loggerSpy.getCall(1).args[1];
        expect(logMetadata.measurement).to.equal("counter1");
        expect(logMetadata.measurement_type).to.equal("counter");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
    }

    @test
    public async "gauge reporting"() {
        this.registry.registerMetric(new SimpleGauge("gauge1"));

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("gauge1");
        expect(logMetadata.measurement_type).to.equal("gauge");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
    }

    @test
    public async "histogram reporting"() {
        this.registry.newHistogram("histogram1");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("histogram1");
        expect(logMetadata.measurement_type).to.equal("histogram");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
    }

    @test
    public async "meter reporting"() {
        this.registry.newMeter("meter1");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("meter1");
        expect(logMetadata.measurement_type).to.equal("meter");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
    }

    @test
    public async "timer reporting"() {
        this.registry.newTimer("timer1");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("timer1");
        expect(logMetadata.measurement_type).to.equal("timer");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
    }

    @test
    public async "registry tags"() {
        this.registry.newCounter("counter1");
        this.registry.setTag("application", "app");
        this.registry.setTag("mode", "dev");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("counter1");
        expect(logMetadata.measurement_type).to.equal("counter");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
        expect(logMetadata.tags["application"]).to.equal("app");
        expect(logMetadata.tags["mode"]).to.equal("dev");
    }

    @test
    public async "metric tags"() {
        const counter = this.registry.newCounter("counter1");
        counter.setTag("application", "app");
        counter.setTag("mode", "dev");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("counter1");
        expect(logMetadata.measurement_type).to.equal("counter");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
        expect(logMetadata.tags["application"]).to.equal("app");
        expect(logMetadata.tags["mode"]).to.equal("dev");
    }

    @test
    public async "registry and metric tags"() {
        const counter = this.registry.newCounter("counter1");
        this.registry.setTag("application", "app");
        this.registry.setTag("mode", "dev");
        counter.setTag("mode", "test");
        counter.setTag("component", "main");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy.callCount).to.equal(1);
        const logMetadata = this.loggerSpy.getCall(0).args[1];
        expect(logMetadata.measurement).to.equal("counter1");
        expect(logMetadata.measurement_type).to.equal("counter");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags).to.not.be.null;
        expect(logMetadata.tags["application"]).to.equal("app");
        expect(logMetadata.tags["mode"]).to.equal("test");
        expect(logMetadata.tags["component"]).to.equal("main");
    }

}
