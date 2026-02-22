var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// ../../node_modules/.pnpm/@cloudflare+unenv-preset@2.12.1_unenv@2.0.0-rc.24_workerd@1.20260212.0/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../../node_modules/.pnpm/@cloudflare+unenv-preset@2.12.1_unenv@2.0.0-rc.24_workerd@1.20260212.0/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// ../../node_modules/.pnpm/@cloudflare+unenv-preset@2.12.1_unenv@2.0.0-rc.24_workerd@1.20260212.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "../../node_modules/.pnpm/@cloudflare+unenv-preset@2.12.1_unenv@2.0.0-rc.24_workerd@1.20260212.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// ../../node_modules/.pnpm/wrangler@4.65.0_@cloudflare+workers-types@4.20260214.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../node_modules/.pnpm/wrangler@4.65.0_@cloudflare+workers-types@4.20260214.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// ../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// ../../node_modules/.pnpm/@cloudflare+unenv-preset@2.12.1_unenv@2.0.0-rc.24_workerd@1.20260212.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, unenvProcess, exit, features, platform, _channel, _debugEnd, _debugProcess, _disconnect, _events, _eventsCount, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _handleQueue, _kill, _linkedBinding, _maxListeners, _pendingMessage, _preload_modules, _rawDebug, _send, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, assert2, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, disconnect, dlopen, domain, emit, emitWarning, env, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, hrtime3, initgroups, kill, listenerCount, listeners, loadEnvFile, mainModule, memoryUsage, moduleLoadList, nextTick, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "../../node_modules/.pnpm/@cloudflare+unenv-preset@2.12.1_unenv@2.0.0-rc.24_workerd@1.20260212.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      _channel,
      _debugEnd,
      _debugProcess,
      _disconnect,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _handleQueue,
      _kill,
      _linkedBinding,
      _maxListeners,
      _pendingMessage,
      _preload_modules,
      _rawDebug,
      _send,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert2,
      availableMemory,
      binding,
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      disconnect,
      dlopen,
      domain,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime: hrtime3,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      mainModule,
      memoryUsage,
      moduleLoadList,
      nextTick,
      off,
      on,
      once,
      openStdin,
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// ../../node_modules/.pnpm/wrangler@4.65.0_@cloudflare+workers-types@4.20260214.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../node_modules/.pnpm/wrangler@4.65.0_@cloudflare+workers-types@4.20260214.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/compose.js
var compose;
var init_compose = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/compose.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
      return (context2, next) => {
        let index = -1;
        return dispatch(0);
        async function dispatch(i) {
          if (i <= index) {
            throw new Error("next() called multiple times");
          }
          index = i;
          let res;
          let isError = false;
          let handler;
          if (middleware[i]) {
            handler = middleware[i][0][0];
            context2.req.routeIndex = i;
          } else {
            handler = i === middleware.length && next || void 0;
          }
          if (handler) {
            try {
              res = await handler(context2, () => dispatch(i + 1));
            } catch (err) {
              if (err instanceof Error && onError) {
                context2.error = err;
                res = await onError(err, context2);
                isError = true;
              } else {
                throw err;
              }
            }
          } else {
            if (context2.finalized === false && onNotFound) {
              res = await onNotFound(context2);
            }
          }
          if (res && (context2.finalized === false || isError)) {
            context2.res = res;
          }
          return context2;
        }
        __name(dispatch, "dispatch");
      };
    }, "compose");
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/http-exception.js
var HTTPException;
var init_http_exception = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/http-exception.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    HTTPException = class extends Error {
      static {
        __name(this, "HTTPException");
      }
      res;
      status;
      /**
       * Creates an instance of `HTTPException`.
       * @param status - HTTP status code for the exception. Defaults to 500.
       * @param options - Additional options for the exception.
       */
      constructor(status = 500, options) {
        super(options?.message, { cause: options?.cause });
        this.res = options?.res;
        this.status = status;
      }
      /**
       * Returns the response object associated with the exception.
       * If a response object is not provided, a new response is created with the error message and status code.
       * @returns The response object.
       */
      getResponse() {
        if (this.res) {
          const newResponse = new Response(this.res.body, {
            status: this.status,
            headers: this.res.headers
          });
          return newResponse;
        }
        return new Response(this.message, {
          status: this.status
        });
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT;
var init_constants = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/request/constants.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    GET_MATCH_RESULT = /* @__PURE__ */ Symbol();
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/body.js
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var parseBody, handleParsingAllValues, handleParsingNestedValues;
var init_body = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/body.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_request();
    parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
      const { all = false, dot = false } = options;
      const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
      const contentType = headers.get("Content-Type");
      if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
        return parseFormData(request, { all, dot });
      }
      return {};
    }, "parseBody");
    __name(parseFormData, "parseFormData");
    __name(convertFormDataToBodyData, "convertFormDataToBodyData");
    handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
      if (form[key] !== void 0) {
        if (Array.isArray(form[key])) {
          ;
          form[key].push(value);
        } else {
          form[key] = [form[key], value];
        }
      } else {
        if (!key.endsWith("[]")) {
          form[key] = value;
        } else {
          form[key] = [value];
        }
      }
    }, "handleParsingAllValues");
    handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
      let nestedForm = form;
      const keys = key.split(".");
      keys.forEach((key2, index) => {
        if (index === keys.length - 1) {
          nestedForm[key2] = value;
        } else {
          if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
            nestedForm[key2] = /* @__PURE__ */ Object.create(null);
          }
          nestedForm = nestedForm[key2];
        }
      });
    }, "handleParsingNestedValues");
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/url.js
var splitPath, splitRoutingPath, extractGroupsFromPath, replaceGroupMarks, patternCache, getPattern, tryDecode, tryDecodeURI, getPath, getPathNoStrict, mergePath, checkOptionalParameter, _decodeURI, _getQueryParam, getQueryParam, getQueryParams, decodeURIComponent_;
var init_url = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/url.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    splitPath = /* @__PURE__ */ __name((path) => {
      const paths = path.split("/");
      if (paths[0] === "") {
        paths.shift();
      }
      return paths;
    }, "splitPath");
    splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
      const { groups, path } = extractGroupsFromPath(routePath);
      const paths = splitPath(path);
      return replaceGroupMarks(paths, groups);
    }, "splitRoutingPath");
    extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
      const groups = [];
      path = path.replace(/\{[^}]+\}/g, (match2, index) => {
        const mark = `@${index}`;
        groups.push([mark, match2]);
        return mark;
      });
      return { groups, path };
    }, "extractGroupsFromPath");
    replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
      for (let i = groups.length - 1; i >= 0; i--) {
        const [mark] = groups[i];
        for (let j = paths.length - 1; j >= 0; j--) {
          if (paths[j].includes(mark)) {
            paths[j] = paths[j].replace(mark, groups[i][1]);
            break;
          }
        }
      }
      return paths;
    }, "replaceGroupMarks");
    patternCache = {};
    getPattern = /* @__PURE__ */ __name((label, next) => {
      if (label === "*") {
        return "*";
      }
      const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      if (match2) {
        const cacheKey = `${label}#${next}`;
        if (!patternCache[cacheKey]) {
          if (match2[2]) {
            patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
          } else {
            patternCache[cacheKey] = [label, match2[1], true];
          }
        }
        return patternCache[cacheKey];
      }
      return null;
    }, "getPattern");
    tryDecode = /* @__PURE__ */ __name((str, decoder2) => {
      try {
        return decoder2(str);
      } catch {
        return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
          try {
            return decoder2(match2);
          } catch {
            return match2;
          }
        });
      }
    }, "tryDecode");
    tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
    getPath = /* @__PURE__ */ __name((request) => {
      const url = request.url;
      const start = url.indexOf("/", url.indexOf(":") + 4);
      let i = start;
      for (; i < url.length; i++) {
        const charCode = url.charCodeAt(i);
        if (charCode === 37) {
          const queryIndex = url.indexOf("?", i);
          const hashIndex = url.indexOf("#", i);
          const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
          const path = url.slice(start, end);
          return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
        } else if (charCode === 63 || charCode === 35) {
          break;
        }
      }
      return url.slice(start, i);
    }, "getPath");
    getPathNoStrict = /* @__PURE__ */ __name((request) => {
      const result = getPath(request);
      return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
    }, "getPathNoStrict");
    mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
      if (rest.length) {
        sub = mergePath(sub, ...rest);
      }
      return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
    }, "mergePath");
    checkOptionalParameter = /* @__PURE__ */ __name((path) => {
      if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
        return null;
      }
      const segments = path.split("/");
      const results = [];
      let basePath = "";
      segments.forEach((segment) => {
        if (segment !== "" && !/\:/.test(segment)) {
          basePath += "/" + segment;
        } else if (/\:/.test(segment)) {
          if (/\?/.test(segment)) {
            if (results.length === 0 && basePath === "") {
              results.push("/");
            } else {
              results.push(basePath);
            }
            const optionalSegment = segment.replace("?", "");
            basePath += "/" + optionalSegment;
            results.push(basePath);
          } else {
            basePath += "/" + segment;
          }
        }
      });
      return results.filter((v, i, a) => a.indexOf(v) === i);
    }, "checkOptionalParameter");
    _decodeURI = /* @__PURE__ */ __name((value) => {
      if (!/[%+]/.test(value)) {
        return value;
      }
      if (value.indexOf("+") !== -1) {
        value = value.replace(/\+/g, " ");
      }
      return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
    }, "_decodeURI");
    _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
      let encoded;
      if (!multiple && key && !/[%+]/.test(key)) {
        let keyIndex2 = url.indexOf("?", 8);
        if (keyIndex2 === -1) {
          return void 0;
        }
        if (!url.startsWith(key, keyIndex2 + 1)) {
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        while (keyIndex2 !== -1) {
          const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
          if (trailingKeyCode === 61) {
            const valueIndex = keyIndex2 + key.length + 2;
            const endIndex = url.indexOf("&", valueIndex);
            return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
          } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
            return "";
          }
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) {
          return void 0;
        }
      }
      const results = {};
      encoded ??= /[%+]/.test(url);
      let keyIndex = url.indexOf("?", 8);
      while (keyIndex !== -1) {
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
          valueIndex = -1;
        }
        let name = url.slice(
          keyIndex + 1,
          valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
        );
        if (encoded) {
          name = _decodeURI(name);
        }
        keyIndex = nextKeyIndex;
        if (name === "") {
          continue;
        }
        let value;
        if (valueIndex === -1) {
          value = "";
        } else {
          value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
          if (encoded) {
            value = _decodeURI(value);
          }
        }
        if (multiple) {
          if (!(results[name] && Array.isArray(results[name]))) {
            results[name] = [];
          }
          ;
          results[name].push(value);
        } else {
          results[name] ??= value;
        }
      }
      return key ? results[key] : results;
    }, "_getQueryParam");
    getQueryParam = _getQueryParam;
    getQueryParams = /* @__PURE__ */ __name((url, key) => {
      return _getQueryParam(url, key, true);
    }, "getQueryParams");
    decodeURIComponent_ = decodeURIComponent;
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/request.js
var tryDecodeURIComponent, HonoRequest;
var init_request = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/request.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_http_exception();
    init_constants();
    init_body();
    init_url();
    tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
    HonoRequest = class {
      static {
        __name(this, "HonoRequest");
      }
      /**
       * `.raw` can get the raw Request object.
       *
       * @see {@link https://hono.dev/docs/api/request#raw}
       *
       * @example
       * ```ts
       * // For Cloudflare Workers
       * app.post('/', async (c) => {
       *   const metadata = c.req.raw.cf?.hostMetadata?
       *   ...
       * })
       * ```
       */
      raw;
      #validatedData;
      // Short name of validatedData
      #matchResult;
      routeIndex = 0;
      /**
       * `.path` can get the pathname of the request.
       *
       * @see {@link https://hono.dev/docs/api/request#path}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const pathname = c.req.path // `/about/me`
       * })
       * ```
       */
      path;
      bodyCache = {};
      constructor(request, path = "/", matchResult = [[]]) {
        this.raw = request;
        this.path = path;
        this.#matchResult = matchResult;
        this.#validatedData = {};
      }
      param(key) {
        return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
      }
      #getDecodedParam(key) {
        const paramKey = this.#matchResult[0][this.routeIndex][1][key];
        const param = this.#getParamValue(paramKey);
        return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
      }
      #getAllDecodedParams() {
        const decoded = {};
        const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
        for (const key of keys) {
          const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
          if (value !== void 0) {
            decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
          }
        }
        return decoded;
      }
      #getParamValue(paramKey) {
        return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
      }
      query(key) {
        return getQueryParam(this.url, key);
      }
      queries(key) {
        return getQueryParams(this.url, key);
      }
      header(name) {
        if (name) {
          return this.raw.headers.get(name) ?? void 0;
        }
        const headerData = {};
        this.raw.headers.forEach((value, key) => {
          headerData[key] = value;
        });
        return headerData;
      }
      async parseBody(options) {
        return this.bodyCache.parsedBody ??= await parseBody(this, options);
      }
      #cachedBody = /* @__PURE__ */ __name((key) => {
        const { bodyCache, raw: raw2 } = this;
        const cachedBody = bodyCache[key];
        if (cachedBody) {
          return cachedBody;
        }
        const anyCachedKey = Object.keys(bodyCache)[0];
        if (anyCachedKey) {
          return bodyCache[anyCachedKey].then((body) => {
            if (anyCachedKey === "json") {
              body = JSON.stringify(body);
            }
            return new Response(body)[key]();
          });
        }
        return bodyCache[key] = raw2[key]();
      }, "#cachedBody");
      /**
       * `.json()` can parse Request body of type `application/json`
       *
       * @see {@link https://hono.dev/docs/api/request#json}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.json()
       * })
       * ```
       */
      json() {
        return this.#cachedBody("text").then((text) => JSON.parse(text));
      }
      /**
       * `.text()` can parse Request body of type `text/plain`
       *
       * @see {@link https://hono.dev/docs/api/request#text}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.text()
       * })
       * ```
       */
      text() {
        return this.#cachedBody("text");
      }
      /**
       * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
       *
       * @see {@link https://hono.dev/docs/api/request#arraybuffer}
       *
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.arrayBuffer()
       * })
       * ```
       */
      arrayBuffer() {
        return this.#cachedBody("arrayBuffer");
      }
      /**
       * Parses the request body as a `Blob`.
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.blob();
       * });
       * ```
       * @see https://hono.dev/docs/api/request#blob
       */
      blob() {
        return this.#cachedBody("blob");
      }
      /**
       * Parses the request body as `FormData`.
       * @example
       * ```ts
       * app.post('/entry', async (c) => {
       *   const body = await c.req.formData();
       * });
       * ```
       * @see https://hono.dev/docs/api/request#formdata
       */
      formData() {
        return this.#cachedBody("formData");
      }
      /**
       * Adds validated data to the request.
       *
       * @param target - The target of the validation.
       * @param data - The validated data to add.
       */
      addValidatedData(target, data) {
        this.#validatedData[target] = data;
      }
      valid(target) {
        return this.#validatedData[target];
      }
      /**
       * `.url()` can get the request url strings.
       *
       * @see {@link https://hono.dev/docs/api/request#url}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const url = c.req.url // `http://localhost:8787/about/me`
       *   ...
       * })
       * ```
       */
      get url() {
        return this.raw.url;
      }
      /**
       * `.method()` can get the method name of the request.
       *
       * @see {@link https://hono.dev/docs/api/request#method}
       *
       * @example
       * ```ts
       * app.get('/about/me', (c) => {
       *   const method = c.req.method // `GET`
       * })
       * ```
       */
      get method() {
        return this.raw.method;
      }
      get [GET_MATCH_RESULT]() {
        return this.#matchResult;
      }
      /**
       * `.matchedRoutes()` can return a matched route in the handler
       *
       * @deprecated
       *
       * Use matchedRoutes helper defined in "hono/route" instead.
       *
       * @see {@link https://hono.dev/docs/api/request#matchedroutes}
       *
       * @example
       * ```ts
       * app.use('*', async function logger(c, next) {
       *   await next()
       *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
       *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
       *     console.log(
       *       method,
       *       ' ',
       *       path,
       *       ' '.repeat(Math.max(10 - path.length, 0)),
       *       name,
       *       i === c.req.routeIndex ? '<- respond from here' : ''
       *     )
       *   })
       * })
       * ```
       */
      get matchedRoutes() {
        return this.#matchResult[0].map(([[, route]]) => route);
      }
      /**
       * `routePath()` can retrieve the path registered within the handler
       *
       * @deprecated
       *
       * Use routePath helper defined in "hono/route" instead.
       *
       * @see {@link https://hono.dev/docs/api/request#routepath}
       *
       * @example
       * ```ts
       * app.get('/posts/:id', (c) => {
       *   return c.json({ path: c.req.routePath })
       * })
       * ```
       */
      get routePath() {
        return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase, raw, resolveCallback;
var init_html = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/html.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    HtmlEscapedCallbackPhase = {
      Stringify: 1,
      BeforeStream: 2,
      Stream: 3
    };
    raw = /* @__PURE__ */ __name((value, callbacks) => {
      const escapedString = new String(value);
      escapedString.isEscaped = true;
      escapedString.callbacks = callbacks;
      return escapedString;
    }, "raw");
    resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
      if (typeof str === "object" && !(str instanceof String)) {
        if (!(str instanceof Promise)) {
          str = str.toString();
        }
        if (str instanceof Promise) {
          str = await str;
        }
      }
      const callbacks = str.callbacks;
      if (!callbacks?.length) {
        return Promise.resolve(str);
      }
      if (buffer) {
        buffer[0] += str;
      } else {
        buffer = [str];
      }
      const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
        (res) => Promise.all(
          res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
        ).then(() => buffer[0])
      );
      if (preserveCallbacks) {
        return raw(await resStr, callbacks);
      } else {
        return resStr;
      }
    }, "resolveCallback");
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/context.js
var TEXT_PLAIN, setDefaultContentType, Context;
var init_context = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/context.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_request();
    init_html();
    TEXT_PLAIN = "text/plain; charset=UTF-8";
    setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
      return {
        "Content-Type": contentType,
        ...headers
      };
    }, "setDefaultContentType");
    Context = class {
      static {
        __name(this, "Context");
      }
      #rawRequest;
      #req;
      /**
       * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
       *
       * @see {@link https://hono.dev/docs/api/context#env}
       *
       * @example
       * ```ts
       * // Environment object for Cloudflare Workers
       * app.get('*', async c => {
       *   const counter = c.env.COUNTER
       * })
       * ```
       */
      env = {};
      #var;
      finalized = false;
      /**
       * `.error` can get the error object from the middleware if the Handler throws an error.
       *
       * @see {@link https://hono.dev/docs/api/context#error}
       *
       * @example
       * ```ts
       * app.use('*', async (c, next) => {
       *   await next()
       *   if (c.error) {
       *     // do something...
       *   }
       * })
       * ```
       */
      error;
      #status;
      #executionCtx;
      #res;
      #layout;
      #renderer;
      #notFoundHandler;
      #preparedHeaders;
      #matchResult;
      #path;
      /**
       * Creates an instance of the Context class.
       *
       * @param req - The Request object.
       * @param options - Optional configuration options for the context.
       */
      constructor(req, options) {
        this.#rawRequest = req;
        if (options) {
          this.#executionCtx = options.executionCtx;
          this.env = options.env;
          this.#notFoundHandler = options.notFoundHandler;
          this.#path = options.path;
          this.#matchResult = options.matchResult;
        }
      }
      /**
       * `.req` is the instance of {@link HonoRequest}.
       */
      get req() {
        this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
        return this.#req;
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#event}
       * The FetchEvent associated with the current request.
       *
       * @throws Will throw an error if the context does not have a FetchEvent.
       */
      get event() {
        if (this.#executionCtx && "respondWith" in this.#executionCtx) {
          return this.#executionCtx;
        } else {
          throw Error("This context has no FetchEvent");
        }
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#executionctx}
       * The ExecutionContext associated with the current request.
       *
       * @throws Will throw an error if the context does not have an ExecutionContext.
       */
      get executionCtx() {
        if (this.#executionCtx) {
          return this.#executionCtx;
        } else {
          throw Error("This context has no ExecutionContext");
        }
      }
      /**
       * @see {@link https://hono.dev/docs/api/context#res}
       * The Response object for the current request.
       */
      get res() {
        return this.#res ||= new Response(null, {
          headers: this.#preparedHeaders ??= new Headers()
        });
      }
      /**
       * Sets the Response object for the current request.
       *
       * @param _res - The Response object to set.
       */
      set res(_res) {
        if (this.#res && _res) {
          _res = new Response(_res.body, _res);
          for (const [k, v] of this.#res.headers.entries()) {
            if (k === "content-type") {
              continue;
            }
            if (k === "set-cookie") {
              const cookies = this.#res.headers.getSetCookie();
              _res.headers.delete("set-cookie");
              for (const cookie of cookies) {
                _res.headers.append("set-cookie", cookie);
              }
            } else {
              _res.headers.set(k, v);
            }
          }
        }
        this.#res = _res;
        this.finalized = true;
      }
      /**
       * `.render()` can create a response within a layout.
       *
       * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
       *
       * @example
       * ```ts
       * app.get('/', (c) => {
       *   return c.render('Hello!')
       * })
       * ```
       */
      render = /* @__PURE__ */ __name((...args) => {
        this.#renderer ??= (content) => this.html(content);
        return this.#renderer(...args);
      }, "render");
      /**
       * Sets the layout for the response.
       *
       * @param layout - The layout to set.
       * @returns The layout function.
       */
      setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
      /**
       * Gets the current layout for the response.
       *
       * @returns The current layout function.
       */
      getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
      /**
       * `.setRenderer()` can set the layout in the custom middleware.
       *
       * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
       *
       * @example
       * ```tsx
       * app.use('*', async (c, next) => {
       *   c.setRenderer((content) => {
       *     return c.html(
       *       <html>
       *         <body>
       *           <p>{content}</p>
       *         </body>
       *       </html>
       *     )
       *   })
       *   await next()
       * })
       * ```
       */
      setRenderer = /* @__PURE__ */ __name((renderer) => {
        this.#renderer = renderer;
      }, "setRenderer");
      /**
       * `.header()` can set headers.
       *
       * @see {@link https://hono.dev/docs/api/context#header}
       *
       * @example
       * ```ts
       * app.get('/welcome', (c) => {
       *   // Set headers
       *   c.header('X-Message', 'Hello!')
       *   c.header('Content-Type', 'text/plain')
       *
       *   return c.body('Thank you for coming')
       * })
       * ```
       */
      header = /* @__PURE__ */ __name((name, value, options) => {
        if (this.finalized) {
          this.#res = new Response(this.#res.body, this.#res);
        }
        const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
        if (value === void 0) {
          headers.delete(name);
        } else if (options?.append) {
          headers.append(name, value);
        } else {
          headers.set(name, value);
        }
      }, "header");
      status = /* @__PURE__ */ __name((status) => {
        this.#status = status;
      }, "status");
      /**
       * `.set()` can set the value specified by the key.
       *
       * @see {@link https://hono.dev/docs/api/context#set-get}
       *
       * @example
       * ```ts
       * app.use('*', async (c, next) => {
       *   c.set('message', 'Hono is hot!!')
       *   await next()
       * })
       * ```
       */
      set = /* @__PURE__ */ __name((key, value) => {
        this.#var ??= /* @__PURE__ */ new Map();
        this.#var.set(key, value);
      }, "set");
      /**
       * `.get()` can use the value specified by the key.
       *
       * @see {@link https://hono.dev/docs/api/context#set-get}
       *
       * @example
       * ```ts
       * app.get('/', (c) => {
       *   const message = c.get('message')
       *   return c.text(`The message is "${message}"`)
       * })
       * ```
       */
      get = /* @__PURE__ */ __name((key) => {
        return this.#var ? this.#var.get(key) : void 0;
      }, "get");
      /**
       * `.var` can access the value of a variable.
       *
       * @see {@link https://hono.dev/docs/api/context#var}
       *
       * @example
       * ```ts
       * const result = c.var.client.oneMethod()
       * ```
       */
      // c.var.propName is a read-only
      get var() {
        if (!this.#var) {
          return {};
        }
        return Object.fromEntries(this.#var);
      }
      #newResponse(data, arg, headers) {
        const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
        if (typeof arg === "object" && "headers" in arg) {
          const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
          for (const [key, value] of argHeaders) {
            if (key.toLowerCase() === "set-cookie") {
              responseHeaders.append(key, value);
            } else {
              responseHeaders.set(key, value);
            }
          }
        }
        if (headers) {
          for (const [k, v] of Object.entries(headers)) {
            if (typeof v === "string") {
              responseHeaders.set(k, v);
            } else {
              responseHeaders.delete(k);
              for (const v2 of v) {
                responseHeaders.append(k, v2);
              }
            }
          }
        }
        const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
        return new Response(data, { status, headers: responseHeaders });
      }
      newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
      /**
       * `.body()` can return the HTTP response.
       * You can set headers with `.header()` and set HTTP status code with `.status`.
       * This can also be set in `.text()`, `.json()` and so on.
       *
       * @see {@link https://hono.dev/docs/api/context#body}
       *
       * @example
       * ```ts
       * app.get('/welcome', (c) => {
       *   // Set headers
       *   c.header('X-Message', 'Hello!')
       *   c.header('Content-Type', 'text/plain')
       *   // Set HTTP status code
       *   c.status(201)
       *
       *   // Return the response body
       *   return c.body('Thank you for coming')
       * })
       * ```
       */
      body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
      /**
       * `.text()` can render text as `Content-Type:text/plain`.
       *
       * @see {@link https://hono.dev/docs/api/context#text}
       *
       * @example
       * ```ts
       * app.get('/say', (c) => {
       *   return c.text('Hello!')
       * })
       * ```
       */
      text = /* @__PURE__ */ __name((text, arg, headers) => {
        return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
          text,
          arg,
          setDefaultContentType(TEXT_PLAIN, headers)
        );
      }, "text");
      /**
       * `.json()` can render JSON as `Content-Type:application/json`.
       *
       * @see {@link https://hono.dev/docs/api/context#json}
       *
       * @example
       * ```ts
       * app.get('/api', (c) => {
       *   return c.json({ message: 'Hello!' })
       * })
       * ```
       */
      json = /* @__PURE__ */ __name((object, arg, headers) => {
        return this.#newResponse(
          JSON.stringify(object),
          arg,
          setDefaultContentType("application/json", headers)
        );
      }, "json");
      html = /* @__PURE__ */ __name((html, arg, headers) => {
        const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
        return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
      }, "html");
      /**
       * `.redirect()` can Redirect, default status code is 302.
       *
       * @see {@link https://hono.dev/docs/api/context#redirect}
       *
       * @example
       * ```ts
       * app.get('/redirect', (c) => {
       *   return c.redirect('/')
       * })
       * app.get('/redirect-permanently', (c) => {
       *   return c.redirect('/', 301)
       * })
       * ```
       */
      redirect = /* @__PURE__ */ __name((location, status) => {
        const locationString = String(location);
        this.header(
          "Location",
          // Multibyes should be encoded
          // eslint-disable-next-line no-control-regex
          !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
        );
        return this.newResponse(null, status ?? 302);
      }, "redirect");
      /**
       * `.notFound()` can return the Not Found Response.
       *
       * @see {@link https://hono.dev/docs/api/context#notfound}
       *
       * @example
       * ```ts
       * app.get('/notfound', (c) => {
       *   return c.notFound()
       * })
       * ```
       */
      notFound = /* @__PURE__ */ __name(() => {
        this.#notFoundHandler ??= () => new Response();
        return this.#notFoundHandler(this);
      }, "notFound");
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router.js
var METHOD_NAME_ALL, METHOD_NAME_ALL_LOWERCASE, METHODS, MESSAGE_MATCHER_IS_ALREADY_BUILT, UnsupportedPathError;
var init_router = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    METHOD_NAME_ALL = "ALL";
    METHOD_NAME_ALL_LOWERCASE = "all";
    METHODS = ["get", "post", "put", "delete", "options", "patch"];
    MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
    UnsupportedPathError = class extends Error {
      static {
        __name(this, "UnsupportedPathError");
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER;
var init_constants2 = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/constants.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    COMPOSED_HANDLER = "__COMPOSED_HANDLER";
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/hono-base.js
var notFoundHandler, errorHandler, Hono;
var init_hono_base = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/hono-base.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_compose();
    init_context();
    init_router();
    init_constants2();
    init_url();
    notFoundHandler = /* @__PURE__ */ __name((c) => {
      return c.text("404 Not Found", 404);
    }, "notFoundHandler");
    errorHandler = /* @__PURE__ */ __name((err, c) => {
      if ("getResponse" in err) {
        const res = err.getResponse();
        return c.newResponse(res.body, res);
      }
      console.error(err);
      return c.text("Internal Server Error", 500);
    }, "errorHandler");
    Hono = class _Hono {
      static {
        __name(this, "_Hono");
      }
      get;
      post;
      put;
      delete;
      options;
      patch;
      all;
      on;
      use;
      /*
        This class is like an abstract class and does not have a router.
        To use it, inherit the class and implement router in the constructor.
      */
      router;
      getPath;
      // Cannot use `#` because it requires visibility at JavaScript runtime.
      _basePath = "/";
      #path = "/";
      routes = [];
      constructor(options = {}) {
        const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
        allMethods.forEach((method) => {
          this[method] = (args1, ...args) => {
            if (typeof args1 === "string") {
              this.#path = args1;
            } else {
              this.#addRoute(method, this.#path, args1);
            }
            args.forEach((handler) => {
              this.#addRoute(method, this.#path, handler);
            });
            return this;
          };
        });
        this.on = (method, path, ...handlers) => {
          for (const p of [path].flat()) {
            this.#path = p;
            for (const m of [method].flat()) {
              handlers.map((handler) => {
                this.#addRoute(m.toUpperCase(), this.#path, handler);
              });
            }
          }
          return this;
        };
        this.use = (arg1, ...handlers) => {
          if (typeof arg1 === "string") {
            this.#path = arg1;
          } else {
            this.#path = "*";
            handlers.unshift(arg1);
          }
          handlers.forEach((handler) => {
            this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
          });
          return this;
        };
        const { strict, ...optionsWithoutStrict } = options;
        Object.assign(this, optionsWithoutStrict);
        this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
      }
      #clone() {
        const clone = new _Hono({
          router: this.router,
          getPath: this.getPath
        });
        clone.errorHandler = this.errorHandler;
        clone.#notFoundHandler = this.#notFoundHandler;
        clone.routes = this.routes;
        return clone;
      }
      #notFoundHandler = notFoundHandler;
      // Cannot use `#` because it requires visibility at JavaScript runtime.
      errorHandler = errorHandler;
      /**
       * `.route()` allows grouping other Hono instance in routes.
       *
       * @see {@link https://hono.dev/docs/api/routing#grouping}
       *
       * @param {string} path - base Path
       * @param {Hono} app - other Hono instance
       * @returns {Hono} routed Hono instance
       *
       * @example
       * ```ts
       * const app = new Hono()
       * const app2 = new Hono()
       *
       * app2.get("/user", (c) => c.text("user"))
       * app.route("/api", app2) // GET /api/user
       * ```
       */
      route(path, app2) {
        const subApp = this.basePath(path);
        app2.routes.map((r) => {
          let handler;
          if (app2.errorHandler === errorHandler) {
            handler = r.handler;
          } else {
            handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
            handler[COMPOSED_HANDLER] = r.handler;
          }
          subApp.#addRoute(r.method, r.path, handler);
        });
        return this;
      }
      /**
       * `.basePath()` allows base paths to be specified.
       *
       * @see {@link https://hono.dev/docs/api/routing#base-path}
       *
       * @param {string} path - base Path
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * const api = new Hono().basePath('/api')
       * ```
       */
      basePath(path) {
        const subApp = this.#clone();
        subApp._basePath = mergePath(this._basePath, path);
        return subApp;
      }
      /**
       * `.onError()` handles an error and returns a customized Response.
       *
       * @see {@link https://hono.dev/docs/api/hono#error-handling}
       *
       * @param {ErrorHandler} handler - request Handler for error
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * app.onError((err, c) => {
       *   console.error(`${err}`)
       *   return c.text('Custom Error Message', 500)
       * })
       * ```
       */
      onError = /* @__PURE__ */ __name((handler) => {
        this.errorHandler = handler;
        return this;
      }, "onError");
      /**
       * `.notFound()` allows you to customize a Not Found Response.
       *
       * @see {@link https://hono.dev/docs/api/hono#not-found}
       *
       * @param {NotFoundHandler} handler - request handler for not-found
       * @returns {Hono} changed Hono instance
       *
       * @example
       * ```ts
       * app.notFound((c) => {
       *   return c.text('Custom 404 Message', 404)
       * })
       * ```
       */
      notFound = /* @__PURE__ */ __name((handler) => {
        this.#notFoundHandler = handler;
        return this;
      }, "notFound");
      /**
       * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
       *
       * @see {@link https://hono.dev/docs/api/hono#mount}
       *
       * @param {string} path - base Path
       * @param {Function} applicationHandler - other Request Handler
       * @param {MountOptions} [options] - options of `.mount()`
       * @returns {Hono} mounted Hono instance
       *
       * @example
       * ```ts
       * import { Router as IttyRouter } from 'itty-router'
       * import { Hono } from 'hono'
       * // Create itty-router application
       * const ittyRouter = IttyRouter()
       * // GET /itty-router/hello
       * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
       *
       * const app = new Hono()
       * app.mount('/itty-router', ittyRouter.handle)
       * ```
       *
       * @example
       * ```ts
       * const app = new Hono()
       * // Send the request to another application without modification.
       * app.mount('/app', anotherApp, {
       *   replaceRequest: (req) => req,
       * })
       * ```
       */
      mount(path, applicationHandler, options) {
        let replaceRequest;
        let optionHandler;
        if (options) {
          if (typeof options === "function") {
            optionHandler = options;
          } else {
            optionHandler = options.optionHandler;
            if (options.replaceRequest === false) {
              replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
            } else {
              replaceRequest = options.replaceRequest;
            }
          }
        }
        const getOptions = optionHandler ? (c) => {
          const options2 = optionHandler(c);
          return Array.isArray(options2) ? options2 : [options2];
        } : (c) => {
          let executionContext = void 0;
          try {
            executionContext = c.executionCtx;
          } catch {
          }
          return [c.env, executionContext];
        };
        replaceRequest ||= (() => {
          const mergedPath = mergePath(this._basePath, path);
          const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
          return (request) => {
            const url = new URL(request.url);
            url.pathname = url.pathname.slice(pathPrefixLength) || "/";
            return new Request(url, request);
          };
        })();
        const handler = /* @__PURE__ */ __name(async (c, next) => {
          const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
          if (res) {
            return res;
          }
          await next();
        }, "handler");
        this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
        return this;
      }
      #addRoute(method, path, handler) {
        method = method.toUpperCase();
        path = mergePath(this._basePath, path);
        const r = { basePath: this._basePath, path, method, handler };
        this.router.add(method, path, [handler, r]);
        this.routes.push(r);
      }
      #handleError(err, c) {
        if (err instanceof Error) {
          return this.errorHandler(err, c);
        }
        throw err;
      }
      #dispatch(request, executionCtx, env2, method) {
        if (method === "HEAD") {
          return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
        }
        const path = this.getPath(request, { env: env2 });
        const matchResult = this.router.match(method, path);
        const c = new Context(request, {
          path,
          matchResult,
          env: env2,
          executionCtx,
          notFoundHandler: this.#notFoundHandler
        });
        if (matchResult[0].length === 1) {
          let res;
          try {
            res = matchResult[0][0][0][0](c, async () => {
              c.res = await this.#notFoundHandler(c);
            });
          } catch (err) {
            return this.#handleError(err, c);
          }
          return res instanceof Promise ? res.then(
            (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
          ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
        }
        const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
        return (async () => {
          try {
            const context2 = await composed(c);
            if (!context2.finalized) {
              throw new Error(
                "Context is not finalized. Did you forget to return a Response object or `await next()`?"
              );
            }
            return context2.res;
          } catch (err) {
            return this.#handleError(err, c);
          }
        })();
      }
      /**
       * `.fetch()` will be entry point of your app.
       *
       * @see {@link https://hono.dev/docs/api/hono#fetch}
       *
       * @param {Request} request - request Object of request
       * @param {Env} Env - env Object
       * @param {ExecutionContext} - context of execution
       * @returns {Response | Promise<Response>} response of request
       *
       */
      fetch = /* @__PURE__ */ __name((request, ...rest) => {
        return this.#dispatch(request, rest[1], rest[0], request.method);
      }, "fetch");
      /**
       * `.request()` is a useful method for testing.
       * You can pass a URL or pathname to send a GET request.
       * app will return a Response object.
       * ```ts
       * test('GET /hello is ok', async () => {
       *   const res = await app.request('/hello')
       *   expect(res.status).toBe(200)
       * })
       * ```
       * @see https://hono.dev/docs/api/hono#request
       */
      request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
        if (input instanceof Request) {
          return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
        }
        input = input.toString();
        return this.fetch(
          new Request(
            /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
            requestInit
          ),
          Env,
          executionCtx
        );
      }, "request");
      /**
       * `.fire()` automatically adds a global fetch event listener.
       * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
       * @deprecated
       * Use `fire` from `hono/service-worker` instead.
       * ```ts
       * import { Hono } from 'hono'
       * import { fire } from 'hono/service-worker'
       *
       * const app = new Hono()
       * // ...
       * fire(app)
       * ```
       * @see https://hono.dev/docs/api/hono#fire
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
       * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
       */
      fire = /* @__PURE__ */ __name(() => {
        addEventListener("fetch", (event) => {
          event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
        });
      }, "fire");
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/matcher.js
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
var emptyParam;
var init_matcher = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/matcher.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router();
    emptyParam = [];
    __name(match, "match");
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/node.js
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var LABEL_REG_EXP_STR, ONLY_WILDCARD_REG_EXP_STR, TAIL_WILDCARD_REG_EXP_STR, PATH_ERROR, regExpMetaChars, Node;
var init_node = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/node.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    LABEL_REG_EXP_STR = "[^/]+";
    ONLY_WILDCARD_REG_EXP_STR = ".*";
    TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
    PATH_ERROR = /* @__PURE__ */ Symbol();
    regExpMetaChars = new Set(".\\+*[^]$()");
    __name(compareKey, "compareKey");
    Node = class _Node {
      static {
        __name(this, "_Node");
      }
      #index;
      #varIndex;
      #children = /* @__PURE__ */ Object.create(null);
      insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
        if (tokens.length === 0) {
          if (this.#index !== void 0) {
            throw PATH_ERROR;
          }
          if (pathErrorCheckOnly) {
            return;
          }
          this.#index = index;
          return;
        }
        const [token, ...restTokens] = tokens;
        const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        let node;
        if (pattern) {
          const name = pattern[1];
          let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
          if (name && pattern[2]) {
            if (regexpStr === ".*") {
              throw PATH_ERROR;
            }
            regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
            if (/\((?!\?:)/.test(regexpStr)) {
              throw PATH_ERROR;
            }
          }
          node = this.#children[regexpStr];
          if (!node) {
            if (Object.keys(this.#children).some(
              (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
            )) {
              throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
              return;
            }
            node = this.#children[regexpStr] = new _Node();
            if (name !== "") {
              node.#varIndex = context2.varIndex++;
            }
          }
          if (!pathErrorCheckOnly && name !== "") {
            paramMap.push([name, node.#varIndex]);
          }
        } else {
          node = this.#children[token];
          if (!node) {
            if (Object.keys(this.#children).some(
              (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
            )) {
              throw PATH_ERROR;
            }
            if (pathErrorCheckOnly) {
              return;
            }
            node = this.#children[token] = new _Node();
          }
        }
        node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
      }
      buildRegExpStr() {
        const childKeys = Object.keys(this.#children).sort(compareKey);
        const strList = childKeys.map((k) => {
          const c = this.#children[k];
          return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
        });
        if (typeof this.#index === "number") {
          strList.unshift(`#${this.#index}`);
        }
        if (strList.length === 0) {
          return "";
        }
        if (strList.length === 1) {
          return strList[0];
        }
        return "(?:" + strList.join("|") + ")";
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie;
var init_trie = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/trie.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_node();
    Trie = class {
      static {
        __name(this, "Trie");
      }
      #context = { varIndex: 0 };
      #root = new Node();
      insert(path, index, pathErrorCheckOnly) {
        const paramAssoc = [];
        const groups = [];
        for (let i = 0; ; ) {
          let replaced = false;
          path = path.replace(/\{[^}]+\}/g, (m) => {
            const mark = `@\\${i}`;
            groups[i] = [mark, m];
            i++;
            replaced = true;
            return mark;
          });
          if (!replaced) {
            break;
          }
        }
        const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
        for (let i = groups.length - 1; i >= 0; i--) {
          const [mark] = groups[i];
          for (let j = tokens.length - 1; j >= 0; j--) {
            if (tokens[j].indexOf(mark) !== -1) {
              tokens[j] = tokens[j].replace(mark, groups[i][1]);
              break;
            }
          }
        }
        this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
        return paramAssoc;
      }
      buildRegExp() {
        let regexp = this.#root.buildRegExpStr();
        if (regexp === "") {
          return [/^$/, [], []];
        }
        let captureIndex = 0;
        const indexReplacementMap = [];
        const paramReplacementMap = [];
        regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
          if (handlerIndex !== void 0) {
            indexReplacementMap[++captureIndex] = Number(handlerIndex);
            return "$()";
          }
          if (paramIndex !== void 0) {
            paramReplacementMap[Number(paramIndex)] = ++captureIndex;
            return "";
          }
          return "";
        });
        return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/router.js
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var nullMatcher, wildcardRegExpCache, RegExpRouter;
var init_router2 = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router();
    init_url();
    init_matcher();
    init_node();
    init_trie();
    nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
    wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
    __name(buildWildcardRegExp, "buildWildcardRegExp");
    __name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
    __name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
    __name(findMiddleware, "findMiddleware");
    RegExpRouter = class {
      static {
        __name(this, "RegExpRouter");
      }
      name = "RegExpRouter";
      #middleware;
      #routes;
      constructor() {
        this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
        this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
      }
      add(method, path, handler) {
        const middleware = this.#middleware;
        const routes = this.#routes;
        if (!middleware || !routes) {
          throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        if (!middleware[method]) {
          ;
          [middleware, routes].forEach((handlerMap) => {
            handlerMap[method] = /* @__PURE__ */ Object.create(null);
            Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
              handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
            });
          });
        }
        if (path === "/*") {
          path = "*";
        }
        const paramCount = (path.match(/\/:/g) || []).length;
        if (/\*$/.test(path)) {
          const re = buildWildcardRegExp(path);
          if (method === METHOD_NAME_ALL) {
            Object.keys(middleware).forEach((m) => {
              middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
            });
          } else {
            middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
          }
          Object.keys(middleware).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              Object.keys(middleware[m]).forEach((p) => {
                re.test(p) && middleware[m][p].push([handler, paramCount]);
              });
            }
          });
          Object.keys(routes).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              Object.keys(routes[m]).forEach(
                (p) => re.test(p) && routes[m][p].push([handler, paramCount])
              );
            }
          });
          return;
        }
        const paths = checkOptionalParameter(path) || [path];
        for (let i = 0, len = paths.length; i < len; i++) {
          const path2 = paths[i];
          Object.keys(routes).forEach((m) => {
            if (method === METHOD_NAME_ALL || method === m) {
              routes[m][path2] ||= [
                ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
              ];
              routes[m][path2].push([handler, paramCount - len + i + 1]);
            }
          });
        }
      }
      match = match;
      buildAllMatchers() {
        const matchers = /* @__PURE__ */ Object.create(null);
        Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
          matchers[method] ||= this.#buildMatcher(method);
        });
        this.#middleware = this.#routes = void 0;
        clearWildcardRegExpCache();
        return matchers;
      }
      #buildMatcher(method) {
        const routes = [];
        let hasOwnRoute = method === METHOD_NAME_ALL;
        [this.#middleware, this.#routes].forEach((r) => {
          const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
          if (ownRoute.length !== 0) {
            hasOwnRoute ||= true;
            routes.push(...ownRoute);
          } else if (method !== METHOD_NAME_ALL) {
            routes.push(
              ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
            );
          }
        });
        if (!hasOwnRoute) {
          return null;
        } else {
          return buildMatcherFromPreprocessedRoutes(routes);
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/prepared-router.js
var init_prepared_router = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/prepared-router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router();
    init_matcher();
    init_router2();
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/index.js
var init_reg_exp_router = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/reg-exp-router/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router2();
    init_prepared_router();
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter;
var init_router3 = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/smart-router/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router();
    SmartRouter = class {
      static {
        __name(this, "SmartRouter");
      }
      name = "SmartRouter";
      #routers = [];
      #routes = [];
      constructor(init) {
        this.#routers = init.routers;
      }
      add(method, path, handler) {
        if (!this.#routes) {
          throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
        }
        this.#routes.push([method, path, handler]);
      }
      match(method, path) {
        if (!this.#routes) {
          throw new Error("Fatal error");
        }
        const routers = this.#routers;
        const routes = this.#routes;
        const len = routers.length;
        let i = 0;
        let res;
        for (; i < len; i++) {
          const router = routers[i];
          try {
            for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
              router.add(...routes[i2]);
            }
            res = router.match(method, path);
          } catch (e) {
            if (e instanceof UnsupportedPathError) {
              continue;
            }
            throw e;
          }
          this.match = router.match.bind(router);
          this.#routers = [router];
          this.#routes = void 0;
          break;
        }
        if (i === len) {
          throw new Error("Fatal error");
        }
        this.name = `SmartRouter + ${this.activeRouter.name}`;
        return res;
      }
      get activeRouter() {
        if (this.#routes || this.#routers.length !== 1) {
          throw new Error("No active router has been determined yet.");
        }
        return this.#routers[0];
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/smart-router/index.js
var init_smart_router = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/smart-router/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router3();
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/trie-router/node.js
var emptyParams, Node2;
var init_node2 = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/trie-router/node.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router();
    init_url();
    emptyParams = /* @__PURE__ */ Object.create(null);
    Node2 = class _Node2 {
      static {
        __name(this, "_Node");
      }
      #methods;
      #children;
      #patterns;
      #order = 0;
      #params = emptyParams;
      constructor(method, handler, children) {
        this.#children = children || /* @__PURE__ */ Object.create(null);
        this.#methods = [];
        if (method && handler) {
          const m = /* @__PURE__ */ Object.create(null);
          m[method] = { handler, possibleKeys: [], score: 0 };
          this.#methods = [m];
        }
        this.#patterns = [];
      }
      insert(method, path, handler) {
        this.#order = ++this.#order;
        let curNode = this;
        const parts = splitRoutingPath(path);
        const possibleKeys = [];
        for (let i = 0, len = parts.length; i < len; i++) {
          const p = parts[i];
          const nextP = parts[i + 1];
          const pattern = getPattern(p, nextP);
          const key = Array.isArray(pattern) ? pattern[0] : p;
          if (key in curNode.#children) {
            curNode = curNode.#children[key];
            if (pattern) {
              possibleKeys.push(pattern[1]);
            }
            continue;
          }
          curNode.#children[key] = new _Node2();
          if (pattern) {
            curNode.#patterns.push(pattern);
            possibleKeys.push(pattern[1]);
          }
          curNode = curNode.#children[key];
        }
        curNode.#methods.push({
          [method]: {
            handler,
            possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
            score: this.#order
          }
        });
        return curNode;
      }
      #getHandlerSets(node, method, nodeParams, params) {
        const handlerSets = [];
        for (let i = 0, len = node.#methods.length; i < len; i++) {
          const m = node.#methods[i];
          const handlerSet = m[method] || m[METHOD_NAME_ALL];
          const processedSet = {};
          if (handlerSet !== void 0) {
            handlerSet.params = /* @__PURE__ */ Object.create(null);
            handlerSets.push(handlerSet);
            if (nodeParams !== emptyParams || params && params !== emptyParams) {
              for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
                const key = handlerSet.possibleKeys[i2];
                const processed = processedSet[handlerSet.score];
                handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
                processedSet[handlerSet.score] = true;
              }
            }
          }
        }
        return handlerSets;
      }
      search(method, path) {
        const handlerSets = [];
        this.#params = emptyParams;
        const curNode = this;
        let curNodes = [curNode];
        const parts = splitPath(path);
        const curNodesQueue = [];
        for (let i = 0, len = parts.length; i < len; i++) {
          const part = parts[i];
          const isLast = i === len - 1;
          const tempNodes = [];
          for (let j = 0, len2 = curNodes.length; j < len2; j++) {
            const node = curNodes[j];
            const nextNode = node.#children[part];
            if (nextNode) {
              nextNode.#params = node.#params;
              if (isLast) {
                if (nextNode.#children["*"]) {
                  handlerSets.push(
                    ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
                  );
                }
                handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
              } else {
                tempNodes.push(nextNode);
              }
            }
            for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
              const pattern = node.#patterns[k];
              const params = node.#params === emptyParams ? {} : { ...node.#params };
              if (pattern === "*") {
                const astNode = node.#children["*"];
                if (astNode) {
                  handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
                  astNode.#params = params;
                  tempNodes.push(astNode);
                }
                continue;
              }
              const [key, name, matcher] = pattern;
              if (!part && !(matcher instanceof RegExp)) {
                continue;
              }
              const child = node.#children[key];
              const restPathString = parts.slice(i).join("/");
              if (matcher instanceof RegExp) {
                const m = matcher.exec(restPathString);
                if (m) {
                  params[name] = m[0];
                  handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
                  if (Object.keys(child.#children).length) {
                    child.#params = params;
                    const componentCount = m[0].match(/\//)?.length ?? 0;
                    const targetCurNodes = curNodesQueue[componentCount] ||= [];
                    targetCurNodes.push(child);
                  }
                  continue;
                }
              }
              if (matcher === true || matcher.test(part)) {
                params[name] = part;
                if (isLast) {
                  handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
                  if (child.#children["*"]) {
                    handlerSets.push(
                      ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                    );
                  }
                } else {
                  child.#params = params;
                  tempNodes.push(child);
                }
              }
            }
          }
          curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
        }
        if (handlerSets.length > 1) {
          handlerSets.sort((a, b) => {
            return a.score - b.score;
          });
        }
        return [handlerSets.map(({ handler, params }) => [handler, params])];
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter;
var init_router4 = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/trie-router/router.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_url();
    init_node2();
    TrieRouter = class {
      static {
        __name(this, "TrieRouter");
      }
      name = "TrieRouter";
      #node;
      constructor() {
        this.#node = new Node2();
      }
      add(method, path, handler) {
        const results = checkOptionalParameter(path);
        if (results) {
          for (let i = 0, len = results.length; i < len; i++) {
            this.#node.insert(method, results[i], handler);
          }
          return;
        }
        this.#node.insert(method, path, handler);
      }
      match(method, path) {
        return this.#node.search(method, path);
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/trie-router/index.js
var init_trie_router = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/router/trie-router/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_router4();
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/hono.js
var Hono2;
var init_hono = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/hono.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hono_base();
    init_reg_exp_router();
    init_smart_router();
    init_trie_router();
    Hono2 = class extends Hono {
      static {
        __name(this, "Hono");
      }
      /**
       * Creates an instance of the Hono class.
       *
       * @param options - Optional configuration options for the Hono instance.
       */
      constructor(options = {}) {
        super(options);
        this.router = options.router ?? new SmartRouter({
          routers: [new RegExpRouter(), new TrieRouter()]
        });
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/index.js
var init_dist = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hono();
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/helper/factory/index.js
var createMiddleware;
var init_factory = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/helper/factory/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hono();
    createMiddleware = /* @__PURE__ */ __name((middleware) => middleware, "createMiddleware");
  }
});

// src/middleware/error-handler.ts
var ApiError, errorHandler2;
var init_error_handler = __esm({
  "src/middleware/error-handler.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_factory();
    init_http_exception();
    ApiError = class extends Error {
      constructor(statusCode, message2, code) {
        super(message2);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "ApiError";
      }
      static {
        __name(this, "ApiError");
      }
    };
    errorHandler2 = createMiddleware(
      async (c, next) => {
        try {
          await next();
        } catch (error3) {
          const requestId2 = c.get("requestId") || "unknown";
          console.error(JSON.stringify({
            level: "error",
            requestId: requestId2,
            path: c.req.path,
            method: c.req.method,
            error: error3 instanceof Error ? error3.message : "Unknown error",
            stack: error3 instanceof Error ? error3.stack : void 0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }));
          if (error3 instanceof ApiError) {
            return c.json({
              success: false,
              error: error3.message,
              code: error3.code,
              meta: {
                requestId: requestId2,
                timestamp: Date.now(),
                version: c.env.API_VERSION
              }
            }, error3.statusCode);
          }
          if (error3 instanceof HTTPException) {
            return c.json({
              success: false,
              error: error3.message,
              meta: {
                requestId: requestId2,
                timestamp: Date.now(),
                version: c.env.API_VERSION
              }
            }, error3.status);
          }
          return c.json({
            success: false,
            error: c.env.ENVIRONMENT === "production" ? "Internal Server Error" : error3 instanceof Error ? error3.message : "Unknown error",
            meta: {
              requestId: requestId2,
              timestamp: Date.now(),
              version: c.env.API_VERSION
            }
          }, 500);
        }
      }
    );
  }
});

// src/utils/tunnel-client.ts
function createTunnelClient(env2, callerName, timeoutMs) {
  if (!env2.TUNNEL_URL) {
    throw new Error("TUNNEL_URL environment variable is required");
  }
  if (!env2.WORKER_SHARED_SECRET) {
    throw new Error("WORKER_SHARED_SECRET environment variable is required");
  }
  return new TunnelClient({
    baseUrl: env2.TUNNEL_URL,
    sharedSecret: env2.WORKER_SHARED_SECRET,
    callerName,
    timeoutMs
  });
}
var TunnelClient;
var init_tunnel_client = __esm({
  "src/utils/tunnel-client.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    TunnelClient = class {
      static {
        __name(this, "TunnelClient");
      }
      config;
      constructor(config2) {
        this.config = {
          timeoutMs: 55e3,
          // 55 seconds
          ...config2
        };
      }
      /**
       * Make a signed POST request through Cloudflare Tunnel to Azure VM
       * 
       * @param path - Endpoint path (e.g., '/internal/generate')
       * @param body - Request body (will be JSON stringified)
       * @param options - Override default timeout
       * @returns Result with success flag, data, and latency
       */
      async call(path, body, options) {
        const startTime = Date.now();
        const timestamp = Date.now();
        const payload = JSON.stringify(body);
        const signature = await this.sign(timestamp, payload);
        const controller = new AbortController();
        const timeoutMs = options?.timeoutMs || this.config.timeoutMs;
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const url = `${this.config.baseUrl}${path}`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Worker-Signature": signature,
              "X-Worker-Timestamp": String(timestamp),
              "X-Worker-Caller": this.config.callerName
            },
            body: payload,
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (!response.ok) {
            const errorBody = await response.text();
            console.error(JSON.stringify({
              type: "log",
              level: "error",
              action: "tunnel.call.failed",
              path,
              statusCode: response.status,
              errorBody: errorBody.slice(0, 500),
              latencyMs: Date.now() - startTime
            }));
            return {
              success: false,
              error: `Tunnel returned ${response.status}: ${errorBody.slice(0, 200)}`,
              latencyMs: Date.now() - startTime,
              statusCode: response.status
            };
          }
          const data = await response.json();
          return {
            success: true,
            data,
            latencyMs: Date.now() - startTime,
            statusCode: response.status
          };
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === "AbortError") {
            console.error(JSON.stringify({
              type: "log",
              level: "error",
              action: "tunnel.call.timeout",
              path,
              timeoutMs,
              latencyMs: Date.now() - startTime
            }));
            return {
              success: false,
              error: `Tunnel request timed out after ${timeoutMs}ms`,
              latencyMs: Date.now() - startTime
            };
          }
          console.error(JSON.stringify({
            type: "log",
            level: "error",
            action: "tunnel.call.error",
            path,
            error: err.message,
            latencyMs: Date.now() - startTime
          }));
          return {
            success: false,
            error: `Tunnel request failed: ${err.message}`,
            latencyMs: Date.now() - startTime
          };
        }
      }
      /**
       * Make a signed GET request to Azure VM via tunnel
       */
      async get(path, options) {
        const startTime = Date.now();
        const timestamp = Date.now();
        const signature = await this.sign(timestamp, path);
        const controller = new AbortController();
        const timeoutMs = options?.timeoutMs || this.config.timeoutMs;
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const url = `${this.config.baseUrl}${path}`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "X-Worker-Signature": signature,
              "X-Worker-Timestamp": String(timestamp),
              "X-Worker-Caller": this.config.callerName
            },
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (!response.ok) {
            const errorBody = await response.text();
            return {
              success: false,
              error: `Tunnel returned ${response.status}: ${errorBody.slice(0, 200)}`,
              latencyMs: Date.now() - startTime,
              statusCode: response.status
            };
          }
          const data = await response.json();
          return {
            success: true,
            data,
            latencyMs: Date.now() - startTime,
            statusCode: response.status
          };
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === "AbortError") {
            return {
              success: false,
              error: `Tunnel request timed out after ${timeoutMs}ms`,
              latencyMs: Date.now() - startTime
            };
          }
          return {
            success: false,
            error: `Tunnel request failed: ${err.message}`,
            latencyMs: Date.now() - startTime
          };
        }
      }
      /**
       * Check if Azure VM endpoint is healthy
       */
      async healthCheck() {
        const result = await this.get("/internal/health", { timeoutMs: 5e3 });
        return {
          healthy: result.success && result.data?.status === "ok",
          latencyMs: result.latencyMs,
          error: result.error
        };
      }
      /**
       * Sign a request using HMAC-SHA256
       * Format: HMAC(timestamp:caller:payload)
       */
      async sign(timestamp, payload) {
        const data = `${timestamp}:${this.config.callerName}:${payload}`;
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(this.config.sharedSecret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(data)
        );
        return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    };
    __name(createTunnelClient, "createTunnelClient");
  }
});

// src/middleware/rate-limit.ts
function getCurrentDay() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
}
function getClientIP(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
function getRateLimiter(env2, plan) {
  switch (plan) {
    case "free":
      return env2.RATE_LIMITER_FREE;
    case "creator":
      return env2.RATE_LIMITER_CREATOR;
    case "team":
      return env2.RATE_LIMITER_TEAM;
    case "enterprise":
      return null;
  }
}
function getQuotaTypeFromPath(path) {
  if (path.includes("/generate") && !path.includes("/status")) return "generation";
  if (path.includes("/execute")) return "execution";
  return null;
}
async function incrementQuota(env2, quotaKey) {
  if (!quotaKey) return;
  try {
    const current = parseInt(await env2.RATE_LIMITS.get(quotaKey) || "0");
    await env2.RATE_LIMITS.put(quotaKey, String(current + 1), {
      expirationTtl: 86400
    });
  } catch (err) {
    console.error("Failed to increment quota:", quotaKey, err);
  }
}
async function getQuotaInfo(env2, userId, plan, quotaType) {
  const dailyLimit = DAILY_QUOTAS[quotaType][plan];
  if (dailyLimit === -1) {
    return { remaining: Infinity, limit: Infinity, exceeded: false };
  }
  const dayKey = `quota:${quotaType}:${userId}:${getCurrentDay()}`;
  const used = parseInt(await env2.RATE_LIMITS.get(dayKey) || "0");
  return {
    remaining: Math.max(0, dailyLimit - used),
    limit: dailyLimit,
    exceeded: used >= dailyLimit
  };
}
var DAILY_QUOTAS, rateLimiter;
var init_rate_limit = __esm({
  "src/middleware/rate-limit.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_factory();
    init_error_handler();
    DAILY_QUOTAS = {
      generation: {
        free: 5,
        creator: 100,
        team: 500,
        enterprise: -1
      },
      execution: {
        free: 200,
        creator: 2e3,
        team: 1e4,
        enterprise: -1
      }
    };
    __name(getCurrentDay, "getCurrentDay");
    __name(getClientIP, "getClientIP");
    __name(getRateLimiter, "getRateLimiter");
    __name(getQuotaTypeFromPath, "getQuotaTypeFromPath");
    rateLimiter = createMiddleware(async (c, next) => {
      if (c.req.method === "GET" && c.req.path.includes("/status")) {
        await next();
        return;
      }
      const auth = c.get("auth");
      const plan = auth?.plan || "free";
      const limiter = getRateLimiter(c.env, plan);
      if (limiter) {
        const identifier = auth?.userId || getClientIP(c.req.raw);
        const { success } = await limiter.limit({ key: identifier });
        if (!success) {
          throw new ApiError(
            429,
            "Rate limit exceeded. Please try again later.",
            "RATE_LIMIT_MINUTE"
          );
        }
      }
      const quotaType = getQuotaTypeFromPath(c.req.path);
      if (quotaType && auth) {
        const dailyLimit = DAILY_QUOTAS[quotaType][plan];
        if (dailyLimit !== -1) {
          const dayKey = `quota:${quotaType}:${auth.userId}:${getCurrentDay()}`;
          const used = parseInt(await c.env.RATE_LIMITS.get(dayKey) || "0");
          if (used >= dailyLimit) {
            throw new ApiError(
              429,
              `Daily ${quotaType} limit exceeded (${used}/${dailyLimit}). Upgrade for more.`,
              "QUOTA_EXCEEDED"
            );
          }
          c.set("quotaKey", dayKey);
          c.header("X-Quota-Limit", String(dailyLimit));
          c.header("X-Quota-Remaining", String(Math.max(0, dailyLimit - used)));
          c.header("X-Quota-Type", quotaType);
        }
      }
      await next();
    });
    __name(incrementQuota, "incrementQuota");
    __name(getQuotaInfo, "getQuotaInfo");
  }
});

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/body-limit/index.js
var ERROR_MESSAGE, BodyLimitError, bodyLimit;
var init_body_limit = __esm({
  "../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/body-limit/index.js"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_http_exception();
    ERROR_MESSAGE = "Payload Too Large";
    BodyLimitError = class extends Error {
      static {
        __name(this, "BodyLimitError");
      }
      constructor(message2) {
        super(message2);
        this.name = "BodyLimitError";
      }
    };
    bodyLimit = /* @__PURE__ */ __name((options) => {
      const onError = options.onError || (() => {
        const res = new Response(ERROR_MESSAGE, {
          status: 413
        });
        throw new HTTPException(413, { res });
      });
      const maxSize = options.maxSize;
      return /* @__PURE__ */ __name(async function bodyLimit2(c, next) {
        if (!c.req.raw.body) {
          return next();
        }
        const hasTransferEncoding = c.req.raw.headers.has("transfer-encoding");
        const hasContentLength = c.req.raw.headers.has("content-length");
        if (hasTransferEncoding && hasContentLength) {
        }
        if (hasContentLength && !hasTransferEncoding) {
          const contentLength = parseInt(c.req.raw.headers.get("content-length") || "0", 10);
          return contentLength > maxSize ? onError(c) : next();
        }
        let size = 0;
        const rawReader = c.req.raw.body.getReader();
        const reader = new ReadableStream({
          async start(controller) {
            try {
              for (; ; ) {
                const { done, value } = await rawReader.read();
                if (done) {
                  break;
                }
                size += value.length;
                if (size > maxSize) {
                  controller.error(new BodyLimitError(ERROR_MESSAGE));
                  break;
                }
                controller.enqueue(value);
              }
            } finally {
              controller.close();
            }
          }
        });
        const requestInit = { body: reader, duplex: "half" };
        c.req.raw = new Request(c.req.raw, requestInit);
        await next();
        if (c.error instanceof BodyLimitError) {
          c.res = await onError(c);
        }
      }, "bodyLimit2");
    }, "bodyLimit");
  }
});

// src/middleware/body-limit.ts
var LIMITS, executeLimit, generateLimit, defaultBodyLimit;
var init_body_limit2 = __esm({
  "src/middleware/body-limit.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_body_limit();
    init_error_handler();
    LIMITS = {
      EXECUTE: 100 * 1024,
      // 100KB
      GENERATE: 512 * 1024,
      // 512KB
      DEFAULT: 1024 * 1024
      // 1MB
    };
    executeLimit = bodyLimit({
      maxSize: LIMITS.EXECUTE,
      onError: /* @__PURE__ */ __name(() => {
        throw new ApiError(413, "Request body too large. Maximum 100KB for execution.", "BODY_TOO_LARGE");
      }, "onError")
    });
    generateLimit = bodyLimit({
      maxSize: LIMITS.GENERATE,
      onError: /* @__PURE__ */ __name(() => {
        throw new ApiError(413, "Request body too large. Maximum 512KB for generation.", "BODY_TOO_LARGE");
      }, "onError")
    });
    defaultBodyLimit = bodyLimit({
      maxSize: LIMITS.DEFAULT,
      onError: /* @__PURE__ */ __name(() => {
        throw new ApiError(413, "Request body too large. Maximum 1MB.", "BODY_TOO_LARGE");
      }, "onError")
    });
  }
});

// src/utils/analytics-buffer.ts
var analytics_buffer_exports = {};
__export(analytics_buffer_exports, {
  flushEventBuffer: () => flushEventBuffer,
  trackEvent: () => trackEvent2,
  trackExecution: () => trackExecution
});
async function trackEvent2(env2, event) {
  try {
    const key = `events:buffer:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
    await env2.CACHE.put(key, JSON.stringify({
      ...event,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), { expirationTtl: 3600 });
  } catch (err) {
    console.error("Analytics buffer write failed:", err);
  }
}
async function flushEventBuffer(env2) {
  let flushed = 0;
  let errors = 0;
  try {
    const list = await env2.CACHE.list({ prefix: "events:buffer:" });
    if (list.keys.length === 0) {
      return { flushed: 0, errors: 0 };
    }
    const batchSize = 50;
    const keys = list.keys;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const events = [];
      const keysToDelete = [];
      for (const key of batch) {
        try {
          const value = await env2.CACHE.get(key.name, "json");
          if (value) {
            events.push(value);
            keysToDelete.push(key.name);
          }
        } catch {
          errors++;
        }
      }
      if (events.length === 0) continue;
      try {
        const stmt = env2.DB.prepare(`
          INSERT INTO capsule_events (id, capsule_id, user_id, event_type, metadata, session_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const statements = events.map(
          (e) => stmt.bind(
            crypto.randomUUID().replace(/-/g, "").slice(0, 24),
            e.capsule_id,
            e.user_id || null,
            e.event_type,
            e.metadata || null,
            e.session_id || null,
            e.timestamp
          )
        );
        await env2.DB.batch(statements);
        flushed += events.length;
        for (const key of keysToDelete) {
          await env2.CACHE.delete(key);
        }
      } catch (err) {
        console.error("D1 batch insert failed:", err);
        errors += events.length;
      }
    }
  } catch (err) {
    console.error("Event buffer flush failed:", err);
  }
  console.log(JSON.stringify({
    type: "metric",
    name: "analytics.flush",
    flushed,
    errors,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
  return { flushed, errors };
}
async function trackExecution(env2, userId, language, success, executionTime, tier) {
  console.log(JSON.stringify({
    type: "metric",
    name: "execution",
    tags: { language, success: String(success), tier },
    value: executionTime,
    timestamp: Date.now()
  }));
  if (Math.random() < 0.2) {
    await trackEvent2(env2, {
      capsule_id: "system:execution",
      user_id: userId,
      event_type: "run",
      metadata: JSON.stringify({ language, success, executionTime, tier })
    });
  }
}
var init_analytics_buffer = __esm({
  "src/utils/analytics-buffer.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(trackEvent2, "trackEvent");
    __name(flushEventBuffer, "flushEventBuffer");
    __name(trackExecution, "trackExecution");
  }
});

// src/routes/execute.ts
async function executeSQL(env2, code) {
  try {
    const statements = code.split(";").filter((s) => s.trim());
    const results = [];
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      const allowed = /^(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|DROP\s+TABLE|ALTER)/i;
      if (!allowed.test(trimmed)) {
        throw new Error(`Statement not allowed: ${trimmed.slice(0, 50)}`);
      }
      const result = await env2.DB.prepare(trimmed).all();
      results.push(result.results);
    }
    return {
      success: true,
      stdout: JSON.stringify(results, null, 2),
      stderr: "",
      exit_code: 0
    };
  } catch (error3) {
    return {
      success: false,
      stdout: "",
      stderr: error3 instanceof Error ? error3.message : "SQL execution failed",
      exit_code: 1
    };
  }
}
async function executeOnPiston(env2, language, code, input, timeLimit, memoryLimit) {
  const mapping = PISTON_LANGUAGE_MAP[language];
  if (!mapping) {
    return {
      success: false,
      stdout: "",
      stderr: `No Piston mapping for language: ${language}`,
      exit_code: 1
    };
  }
  try {
    const pistonUrl = env2.PISTON_URL;
    if (!pistonUrl) {
      throw new Error("PISTON_URL not configured");
    }
    const response = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: mapping.runtime,
        version: "*",
        files: [{ name: mapping.fileName, content: code }],
        stdin: input,
        args: [],
        compile_timeout: timeLimit * 1e3,
        run_timeout: timeLimit * 1e3,
        run_memory_limit: memoryLimit * 1024 * 1024
        // MB → bytes
      })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown");
      throw new Error(`Piston returned ${response.status}: ${errText.slice(0, 200)}`);
    }
    const pistonResult = await response.json();
    if (pistonResult.compile && pistonResult.compile.code !== 0) {
      return {
        success: false,
        stdout: pistonResult.compile.stdout || "",
        stderr: pistonResult.compile.stderr || pistonResult.compile.output || "Compilation failed",
        exit_code: pistonResult.compile.code ?? 1
      };
    }
    const run = pistonResult.run;
    return {
      success: run.code === 0,
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      exit_code: run.code ?? 1
    };
  } catch (error3) {
    return {
      success: false,
      stdout: "",
      stderr: error3 instanceof Error ? error3.message : "Piston execution failed",
      exit_code: 1
    };
  }
}
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
function generateBatchedTestHarness(language, userCode, functionName, testCases) {
  const testDataB64 = utf8ToBase64(JSON.stringify(
    testCases.map((tc, i) => ({
      id: i + 1,
      input_args: tc.input_args,
      expected_output: tc.expected_output,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || "unknown"
    }))
  ));
  if (language === "python") {
    return `
# Force determinism
import random
random.seed(42)
try:
    import numpy as np
    np.random.seed(42)
except ImportError:
    pass

# User code
${userCode}

# --- HIDDEN TEST HARNESS ---
import json
import base64

def _normalize(obj):
    """Normalize for comparison: tuples->lists, sets->sorted lists, round floats."""
    if isinstance(obj, tuple):
        return [_normalize(x) for x in obj]
    if isinstance(obj, set):
        return sorted([_normalize(x) for x in obj], key=lambda x: json.dumps(x, default=str))
    if isinstance(obj, dict):
        return {k: _normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_normalize(x) for x in obj]
    if isinstance(obj, float):
        return round(obj, 6)
    return obj

_tests = json.loads(base64.b64decode("${testDataB64}").decode('utf-8'))
_results = []

for _t in _tests:
    _res = {"id": _t["id"], "passed": False, "actual": None, "error": None, "type": _t.get("type", "unknown")}
    try:
        _val = ${functionName}(*_t["input_args"])
        _norm_actual = _normalize(_val)
        _norm_expected = _normalize(_t["expected_output"])
        if _norm_actual == _norm_expected:
            _res["passed"] = True
        _res["actual"] = json.dumps(_norm_actual, default=str)
        _res["expected"] = json.dumps(_norm_expected, default=str)
    except Exception as _e:
        import traceback
        _res["error"] = str(_e)
    _results.append(_res)

print("---JSON_START---")
print(json.dumps(_results))
`;
  }
  if (language === "javascript") {
    return `
// User code
${userCode}

// --- HIDDEN TEST HARNESS ---
function _normalize(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'number') return Math.round(obj * 1e6) / 1e6;
    if (Array.isArray(obj)) return obj.map(_normalize);
    if (typeof obj === 'object') {
        const out = {};
        for (const k of Object.keys(obj).sort()) out[k] = _normalize(obj[k]);
        return out;
    }
    return obj;
}

const _tests = JSON.parse(atob("${testDataB64}"));
const _results = [];

for (const _t of _tests) {
    const _res = { id: _t.id, passed: false, actual: null, error: null, type: _t.type || "unknown" };
    try {
        const _val = ${functionName}(..._t.input_args);
        const _normActual = _normalize(_val);
        const _normExpected = _normalize(_t.expected_output);
        if (JSON.stringify(_normActual) === JSON.stringify(_normExpected)) {
            _res.passed = true;
        }
        _res.actual = JSON.stringify(_normActual);
        _res.expected = JSON.stringify(_normExpected);
    } catch (_e) {
        _res.error = _e.message || String(_e);
    }
    _results.push(_res);
}

console.log("---JSON_START---");
console.log(JSON.stringify(_results));
`;
  }
  return userCode;
}
function parseBatchedResults(pistonResult, testCases) {
  const stdout2 = (pistonResult.stdout || "").trim();
  const stderr2 = (pistonResult.stderr || "").trim();
  if (!pistonResult.success && !stdout2.includes("---JSON_START---")) {
    return testCases.map((tc, i) => ({
      testCase: i + 1,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || "unknown",
      passed: false,
      output: null,
      expected: tc.expected_output,
      executionTime: 0,
      error: stderr2 || `Execution failed (exit code ${pistonResult.exit_code})`
    }));
  }
  const parts = stdout2.split("---JSON_START---");
  if (parts.length < 2) {
    return testCases.map((tc, i) => ({
      testCase: i + 1,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || "unknown",
      passed: false,
      output: stdout2 || null,
      expected: tc.expected_output,
      executionTime: 0,
      error: stderr2 || "Code crashed before test harness could run. Check for syntax errors or import issues."
    }));
  }
  const _userLogs = parts[0].trim();
  const jsonStr = parts[1].trim();
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed.map((r, i) => {
      const tc = testCases[i] || {};
      return {
        testCase: r.id || i + 1,
        description: tc.description || `Test ${r.id || i + 1}`,
        type: r.type || tc.type || "unknown",
        passed: r.passed,
        output: r.actual || null,
        expected: r.expected || tc.expected_output,
        executionTime: 0,
        error: r.error || void 0
      };
    });
  } catch (parseError) {
    return testCases.map((tc, i) => ({
      testCase: i + 1,
      description: tc.description || `Test ${i + 1}`,
      type: tc.type || "unknown",
      passed: false,
      output: jsonStr.substring(0, 200),
      expected: tc.expected_output,
      executionTime: 0,
      error: `Failed to parse test results JSON: ${parseError instanceof Error ? parseError.message : "unknown"}`
    }));
  }
}
var executeRoutes, EDGE_LANGUAGES, PISTON_LANGUAGES, ALL_LANGUAGES, PISTON_LANGUAGE_MAP;
var init_execute = __esm({
  "src/routes/execute.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_dist();
    init_error_handler();
    init_analytics_buffer();
    init_rate_limit();
    init_body_limit2();
    executeRoutes = new Hono2();
    executeRoutes.use("*", executeLimit);
    EDGE_LANGUAGES = ["sql"];
    PISTON_LANGUAGES = ["python", "javascript", "java", "cpp", "c"];
    ALL_LANGUAGES = [...EDGE_LANGUAGES, ...PISTON_LANGUAGES];
    PISTON_LANGUAGE_MAP = {
      python: { runtime: "python", fileName: "main.py" },
      javascript: { runtime: "javascript", fileName: "main.js" },
      java: { runtime: "java", fileName: "Main.java" },
      cpp: { runtime: "c++", fileName: "main.cpp" },
      c: { runtime: "c", fileName: "main.c" }
    };
    executeRoutes.post("/", async (c) => {
      const body = await c.req.json();
      const {
        source_code,
        language,
        input = "",
        time_limit = 10,
        memory_limit = 128
      } = body;
      if (!source_code || typeof source_code !== "string") {
        throw new ApiError(400, "source_code is required");
      }
      if (!language || typeof language !== "string") {
        throw new ApiError(400, "language is required");
      }
      const lang = language.toLowerCase();
      if (!ALL_LANGUAGES.includes(lang)) {
        throw new ApiError(400, `Unsupported language. Supported: ${ALL_LANGUAGES.join(", ")}`);
      }
      if (source_code.length > 5e4) {
        throw new ApiError(400, "Code too long. Maximum 50KB.");
      }
      if (time_limit < 1 || time_limit > 30) {
        throw new ApiError(400, "time_limit must be between 1 and 30 seconds");
      }
      if (lang === "sql") {
        const startTime = Date.now();
        const result = await executeSQL(c.env, source_code);
        const executionTime = Date.now() - startTime;
        const auth2 = c.get("auth");
        trackExecution(c.env, auth2?.userId, lang, result.success, executionTime, "edge");
        if (result.success) {
          await incrementQuota(c.env, c.get("quotaKey"));
        }
        return c.json({
          success: result.success,
          stdout: result.stdout,
          stderr: result.stderr,
          exit_code: result.exit_code,
          execution_time: executionTime,
          tier: "edge",
          // No jobId for sync — result is inline
          meta: {
            requestId: c.get("requestId"),
            timestamp: Date.now(),
            version: c.env.API_VERSION
          }
        });
      }
      const jobId = crypto.randomUUID();
      const auth = c.get("auth");
      const job = {
        jobId,
        type: "run",
        language: lang,
        sourceCode: source_code,
        input,
        timeLimit: time_limit,
        memoryLimit: memory_limit,
        userId: auth?.userId,
        quotaKey: c.get("quotaKey"),
        requestId: c.get("requestId"),
        timestamp: Date.now()
      };
      const initialStatus = {
        jobId,
        status: "queued",
        type: "run",
        createdAt: Date.now()
      };
      await c.env.JOB_PROGRESS.put(
        `exec:${jobId}`,
        JSON.stringify(initialStatus),
        { expirationTtl: 300 }
        // 5 min TTL
      );
      await c.env.EXECUTION_QUEUE.send(job);
      return c.json({
        success: true,
        jobId,
        status: "queued",
        statusUrl: `/api/v1/execute/runs/${jobId}`,
        meta: {
          requestId: c.get("requestId"),
          timestamp: Date.now(),
          version: c.env.API_VERSION
        }
      }, 202);
    });
    executeRoutes.post("/tests", async (c) => {
      const body = await c.req.json();
      const { userCode, testCases, language, functionName } = body;
      if (!userCode || !testCases || !language || !functionName) {
        throw new ApiError(400, "userCode, testCases, language, and functionName are required");
      }
      const lang = language.toLowerCase();
      const cappedCases = testCases.slice(0, 5);
      if (lang === "sql") {
        const startTime = Date.now();
        const results = [];
        let passedCount = 0;
        for (let i = 0; i < cappedCases.length; i++) {
          const tc = cappedCases[i];
          const sqlResult = await executeSQL(c.env, userCode);
          const passed = sqlResult.success;
          results.push({
            testCase: i + 1,
            description: tc.description || `Test ${i + 1}`,
            type: tc.type || "unknown",
            passed,
            output: sqlResult.stdout,
            expected: tc.expected_output,
            executionTime: 0,
            error: sqlResult.stderr || void 0
          });
          if (passed) passedCount++;
        }
        return c.json({
          success: true,
          summary: {
            totalTests: cappedCases.length,
            passedTests: passedCount,
            failedTests: cappedCases.length - passedCount,
            successRate: Math.round(passedCount / cappedCases.length * 100),
            allPassed: passedCount === cappedCases.length,
            totalTime: Date.now() - startTime
          },
          results,
          meta: { requestId: c.get("requestId"), timestamp: Date.now(), version: c.env.API_VERSION }
        });
      }
      const jobId = crypto.randomUUID();
      const auth = c.get("auth");
      const job = {
        jobId,
        type: "tests",
        language: lang,
        sourceCode: "",
        // not used for tests — userCode is used instead
        input: "",
        timeLimit: 3,
        memoryLimit: 128,
        userCode,
        functionName,
        testCases: cappedCases,
        userId: auth?.userId,
        quotaKey: c.get("quotaKey"),
        requestId: c.get("requestId"),
        timestamp: Date.now()
      };
      const initialStatus = {
        jobId,
        status: "queued",
        type: "tests",
        createdAt: Date.now()
      };
      await c.env.JOB_PROGRESS.put(
        `exec:${jobId}`,
        JSON.stringify(initialStatus),
        { expirationTtl: 300 }
      );
      await c.env.EXECUTION_QUEUE.send(job);
      return c.json({
        success: true,
        jobId,
        status: "queued",
        statusUrl: `/api/v1/execute/runs/${jobId}`,
        meta: { requestId: c.get("requestId"), timestamp: Date.now(), version: c.env.API_VERSION }
      }, 202);
    });
    executeRoutes.get("/runs/:jobId", async (c) => {
      const { jobId } = c.req.param();
      if (!jobId || jobId.length > 50) {
        throw new ApiError(400, "Invalid jobId");
      }
      const raw2 = await c.env.JOB_PROGRESS.get(`exec:${jobId}`);
      if (!raw2) {
        throw new ApiError(404, "Job not found or expired");
      }
      const jobResult = JSON.parse(raw2);
      return c.json({
        success: true,
        ...jobResult,
        meta: {
          requestId: c.get("requestId"),
          timestamp: Date.now(),
          version: c.env.API_VERSION
        }
      });
    });
    __name(executeSQL, "executeSQL");
    __name(executeOnPiston, "executeOnPiston");
    __name(utf8ToBase64, "utf8ToBase64");
    __name(generateBatchedTestHarness, "generateBatchedTestHarness");
    __name(parseBatchedResults, "parseBatchedResults");
  }
});

// src/queues/execution-consumer.ts
var execution_consumer_exports = {};
__export(execution_consumer_exports, {
  processExecutionQueue: () => processExecutionQueue
});
async function processExecutionQueue(batch, env2) {
  console.log(JSON.stringify({
    type: "info",
    action: "execution_queue.batch_received",
    batchSize: batch.messages.length,
    timestamp: Date.now()
  }));
  const promises = batch.messages.map(async (msg) => {
    const job = msg.body;
    const kvKey = `exec:${job.jobId}`;
    try {
      await env2.JOB_PROGRESS.put(
        kvKey,
        JSON.stringify({
          jobId: job.jobId,
          status: "running",
          type: job.type,
          createdAt: job.timestamp
        }),
        { expirationTtl: 300 }
      );
      if (job.type === "run") {
        await processRunJob(job, env2, kvKey);
      } else if (job.type === "tests") {
        await processTestJob(job, env2, kvKey);
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }
      msg.ack();
    } catch (error3) {
      const errMsg = error3 instanceof Error ? error3.message : "Unknown error";
      console.error(JSON.stringify({
        type: "error",
        action: "execution_queue.job_failed",
        jobId: job.jobId,
        jobType: job.type,
        error: errMsg,
        attempt: msg.attempts
      }));
      await env2.JOB_PROGRESS.put(
        kvKey,
        JSON.stringify({
          jobId: job.jobId,
          status: "failed",
          type: job.type,
          error: errMsg,
          createdAt: job.timestamp,
          completedAt: Date.now()
        }),
        { expirationTtl: 300 }
      );
      if (msg.attempts < 2) {
        msg.retry();
      } else {
        msg.ack();
      }
    }
  });
  await Promise.allSettled(promises);
}
async function processRunJob(job, env2, kvKey) {
  const startTime = Date.now();
  const result = await executeOnPiston(
    env2,
    job.language,
    job.sourceCode,
    job.input,
    job.timeLimit,
    job.memoryLimit
  );
  const executionTime = Date.now() - startTime;
  trackExecution(env2, job.userId, job.language, result.success, executionTime, "piston");
  if (result.success && job.quotaKey) {
    await incrementQuota(env2, job.quotaKey);
  }
  const completed = {
    jobId: job.jobId,
    status: "completed",
    type: "run",
    result: {
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exit_code,
      execution_time: executionTime,
      tier: "piston"
    },
    createdAt: job.timestamp,
    completedAt: Date.now()
  };
  await env2.JOB_PROGRESS.put(kvKey, JSON.stringify(completed), {
    expirationTtl: 300
    // 5 min — client should have polled by then
  });
  console.log(JSON.stringify({
    type: "info",
    action: "execution_queue.run_completed",
    jobId: job.jobId,
    language: job.language,
    success: result.success,
    executionTime
  }));
}
async function processTestJob(job, env2, kvKey) {
  if (!job.userCode || !job.functionName || !job.testCases) {
    throw new Error("Test job missing userCode, functionName, or testCases");
  }
  const startTime = Date.now();
  const cappedCases = job.testCases.slice(0, 5);
  const harnessCode = generateBatchedTestHarness(
    job.language,
    job.userCode,
    job.functionName,
    cappedCases
  );
  console.log(JSON.stringify({
    type: "debug",
    action: "execution_queue.test_harness",
    jobId: job.jobId,
    language: job.language,
    functionName: job.functionName,
    harnessLength: harnessCode.length,
    testCaseCount: cappedCases.length
  }));
  const pistonResult = await executeOnPiston(
    env2,
    job.language,
    harnessCode,
    "",
    job.timeLimit,
    job.memoryLimit
  );
  const totalTime = Date.now() - startTime;
  const results = parseBatchedResults(pistonResult, cappedCases);
  const passedCount = results.filter((r) => r.passed).length;
  if (job.quotaKey) {
    await incrementQuota(env2, job.quotaKey);
  }
  const completed = {
    jobId: job.jobId,
    status: "completed",
    type: "tests",
    testResult: {
      success: results.every((r) => r.passed),
      summary: {
        totalTests: cappedCases.length,
        passedTests: passedCount,
        failedTests: cappedCases.length - passedCount,
        successRate: Math.round(passedCount / cappedCases.length * 100),
        allPassed: passedCount === cappedCases.length,
        totalTime
      },
      results
    },
    createdAt: job.timestamp,
    completedAt: Date.now()
  };
  await env2.JOB_PROGRESS.put(kvKey, JSON.stringify(completed), {
    expirationTtl: 300
  });
  console.log(JSON.stringify({
    type: "info",
    action: "execution_queue.tests_completed",
    jobId: job.jobId,
    language: job.language,
    passed: passedCount,
    total: cappedCases.length,
    totalTime
  }));
}
var init_execution_consumer = __esm({
  "src/queues/execution-consumer.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_execute();
    init_analytics_buffer();
    init_rate_limit();
    __name(processExecutionQueue, "processExecutionQueue");
    __name(processRunJob, "processRunJob");
    __name(processTestJob, "processTestJob");
  }
});

// src/queues/generation-consumer.ts
var generation_consumer_exports = {};
__export(generation_consumer_exports, {
  default: () => generation_consumer_default,
  processGenerationQueue: () => processGenerationQueue
});
function calculateCost(model, usage) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o-mini"];
  return usage.prompt_tokens * pricing.input + usage.completion_tokens * pricing.output;
}
async function processGenerationQueue(batch, env2) {
  console.log(JSON.stringify({
    type: "log",
    level: "info",
    action: "queue.batch_received",
    messageCount: batch.messages.length,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
  let tunnel;
  try {
    tunnel = createTunnelClient(env2, "generation-consumer", 55e3);
  } catch (err) {
    console.error(JSON.stringify({
      type: "alert",
      level: "error",
      action: "queue.tunnel_client_failed",
      error: err instanceof Error ? err.message : String(err),
      envKeys: {
        hasTunnelUrl: !!env2.TUNNEL_URL,
        hasSharedSecret: !!env2.WORKER_SHARED_SECRET
      }
    }));
    for (const message2 of batch.messages) {
      const job = message2.body;
      await updateProgress(env2, job.jobId, {
        status: "failed",
        progress: 0,
        currentStep: "Configuration error \u2014 unable to connect to AI pipeline",
        error: "Internal configuration error. Please contact support."
      });
      message2.ack();
    }
    return;
  }
  for (const message2 of batch.messages) {
    const job = message2.body;
    const startTime = Date.now();
    console.log(JSON.stringify({
      type: "log",
      level: "info",
      action: "generation.start",
      jobId: job.jobId,
      userId: job.userId,
      language: job.language,
      difficulty: job.difficulty,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }));
    try {
      const killSwitch = await env2.CACHE.get("system:generation:enabled");
      if (killSwitch === "false") {
        console.log(JSON.stringify({
          type: "log",
          level: "warn",
          action: "generation.killed",
          jobId: job.jobId,
          reason: "Kill switch is active"
        }));
        await updateProgress(env2, job.jobId, {
          status: "failed",
          progress: 0,
          currentStep: "AI generation is temporarily paused",
          error: "AI generation is temporarily paused. Please try again later."
        });
        message2.ack();
        continue;
      }
      const cacheKey = await hashForCache(job.userId, job.prompt, job.language);
      const cached = await env2.CACHE.get(`gen:cache:${cacheKey}`, "json");
      if (cached) {
        console.log(JSON.stringify({
          type: "metric",
          name: "generation.cache_hit",
          jobId: job.jobId,
          language: job.language
        }));
        await updateProgress(env2, job.jobId, {
          status: "completed",
          progress: 100,
          currentStep: "Retrieved from cache!",
          steps: ["Cache Hit \u2713"],
          result: {
            capsule: {
              ...cached.capsule,
              id: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
              fromCache: true
            },
            qualityScore: cached.qualityScore || 0.8,
            generationTime: Date.now() - startTime,
            fromCache: true
          }
        });
        await logGenerationCost(env2, job, 0, 0, 0, 0, true, Date.now() - startTime);
        message2.ack();
        continue;
      }
      await updateProgress(env2, job.jobId, {
        status: "processing",
        progress: 5,
        currentStep: "Queued for AI generation...",
        steps: ["Queue"]
      });
      await updateProgress(env2, job.jobId, {
        status: "processing",
        progress: 15,
        currentStep: "AI agents are working on your exercise...",
        steps: ["Queue \u2713", "AI Pipeline"]
      });
      const pipelineResult = await tunnel.call(
        "/internal/generate",
        {
          jobId: job.jobId,
          userId: job.userId,
          prompt: job.prompt,
          language: job.language,
          difficulty: job.difficulty,
          type: job.type || "code"
        },
        { timeoutMs: 55e3 }
        // Pipeline typically takes ~60s, we wait 55s
      );
      if (!pipelineResult.success) {
        await trackCircuitBreakerFailure(env2);
        throw new Error(pipelineResult.error || "Pipeline request failed");
      }
      if (!pipelineResult.data?.success) {
        await trackCircuitBreakerFailure(env2);
        throw new Error(
          pipelineResult.data?.error || "Generation pipeline failed"
        );
      }
      await env2.CACHE.delete("system:circuit:failures");
      const result = pipelineResult.data;
      await updateProgress(env2, job.jobId, {
        status: "processing",
        progress: 90,
        currentStep: "Finalizing your capsule...",
        steps: [
          "Queue \u2713",
          "Pedagogist \u2713",
          "Coder \u2713",
          "Debugger \u2713",
          "Finalizing"
        ]
      });
      const pedagogistCost = calculateCost(
        result.tokenUsage.pedagogist.model,
        result.tokenUsage.pedagogist
      );
      const coderCost = calculateCost(
        result.tokenUsage.coder.model,
        result.tokenUsage.coder
      );
      const debuggerCost = calculateCost(
        result.tokenUsage.debugger.model,
        result.tokenUsage.debugger
      );
      const totalCost = pedagogistCost + coderCost + debuggerCost;
      const pedagogistTokens = result.tokenUsage.pedagogist.prompt_tokens + result.tokenUsage.pedagogist.completion_tokens;
      const coderTokens = result.tokenUsage.coder.prompt_tokens + result.tokenUsage.coder.completion_tokens;
      const debuggerTokens = result.tokenUsage.debugger.prompt_tokens + result.tokenUsage.debugger.completion_tokens;
      await logGenerationCost(
        env2,
        job,
        pedagogistTokens,
        coderTokens,
        debuggerTokens,
        totalCost,
        false,
        result.generationTimeMs
      );
      const DAILY_AI_BUDGET_USD = parseFloat(
        await env2.CACHE.get("system:ai:daily_budget") || "15"
      );
      const dailySpend = parseFloat(
        await env2.CACHE.get("system:ai:daily_spend") || "0"
      );
      const newDailySpend = dailySpend + totalCost;
      await env2.CACHE.put("system:ai:daily_spend", String(newDailySpend), {
        expirationTtl: 86400
        // Reset after 24 hours
      });
      if (newDailySpend > DAILY_AI_BUDGET_USD) {
        await env2.CACHE.put("system:generation:enabled", "false", {
          expirationTtl: 3600
          // Auto-re-enable after 1 hour
        });
        console.log(JSON.stringify({
          type: "alert",
          name: "ai.budget.exceeded",
          dailySpend: newDailySpend,
          budget: DAILY_AI_BUDGET_USD,
          action: "generation_paused_1hr"
        }));
      }
      await env2.CACHE.put(
        `gen:cache:${cacheKey}`,
        JSON.stringify({
          capsule: result.capsule,
          qualityScore: result.qualityScore,
          pipeline: result.pipeline
        }),
        { expirationTtl: 3600 }
        // 1 hour cache
      );
      await updateProgress(env2, job.jobId, {
        status: "completed",
        progress: 100,
        currentStep: "Done!",
        steps: [
          "Queue \u2713",
          "Pedagogist \u2713",
          "Coder \u2713",
          "Debugger \u2713",
          "Quality Check \u2713"
        ],
        result: {
          capsule: result.capsule,
          qualityScore: result.qualityScore,
          generationTime: result.generationTimeMs,
          costBreakdown: {
            pedagogist: {
              cost: pedagogistCost,
              model: result.tokenUsage.pedagogist.model,
              tokens: pedagogistTokens
            },
            coder: {
              cost: coderCost,
              model: result.tokenUsage.coder.model,
              tokens: coderTokens
            },
            debugger: {
              cost: debuggerCost,
              model: result.tokenUsage.debugger.model,
              tokens: debuggerTokens
            },
            totalCostUSD: totalCost
          },
          pipeline: result.pipeline
        }
      });
      await decrementQueueDepth(env2);
      console.log(JSON.stringify({
        type: "metric",
        name: "generation.complete",
        jobId: job.jobId,
        durationMs: Date.now() - startTime,
        tunnelDurationMs: pipelineResult.latencyMs,
        pipelineDurationMs: result.generationTimeMs,
        costUSD: totalCost,
        qualityScore: result.qualityScore,
        language: job.language,
        difficulty: job.difficulty
      }));
      message2.ack();
    } catch (error3) {
      const errorMessage = error3 instanceof Error ? error3.message : "Unknown error";
      console.error(JSON.stringify({
        type: "log",
        level: "error",
        action: "generation.failed",
        jobId: job.jobId,
        attempt: message2.attempts,
        maxAttempts: 3,
        error: errorMessage,
        durationMs: Date.now() - startTime
      }));
      if (message2.attempts < 3) {
        const delay = 5 * message2.attempts;
        await updateProgress(env2, job.jobId, {
          status: "processing",
          progress: 5,
          currentStep: `Retrying (attempt ${message2.attempts + 1}/3)...`,
          error: errorMessage
        });
        message2.retry({ delaySeconds: delay });
      } else {
        await updateProgress(env2, job.jobId, {
          status: "failed",
          progress: 0,
          currentStep: "Generation failed after 3 attempts",
          error: "We couldn't generate your exercise. Please try again or use a different prompt."
        });
        await decrementQueueDepth(env2);
        console.error(JSON.stringify({
          type: "alert",
          name: "generation.dlq",
          jobId: job.jobId,
          userId: job.userId,
          prompt: job.prompt.slice(0, 100),
          error: errorMessage
        }));
        message2.ack();
      }
    }
  }
}
async function updateProgress(env2, jobId, data) {
  try {
    await env2.JOB_PROGRESS.put(`job:${jobId}`, JSON.stringify({
      ...data,
      updatedAt: Date.now()
    }), { expirationTtl: 600 });
  } catch (err) {
    console.error("Failed to update progress:", err);
  }
}
async function hashForCache(_userId, prompt, language) {
  const normalizedPrompt = prompt.trim().toLowerCase().slice(0, 200);
  const data = `${normalizedPrompt}:${language}`;
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
async function logGenerationCost(env2, job, pedagogistTokens, coderTokens, debuggerTokens, totalCostUSD, cached, generationTimeMs) {
  try {
    await env2.DB.prepare(`
      INSERT INTO generation_logs (
        id, user_id, job_id, prompt, language,
        pedagogist_tokens, coder_tokens, debugger_tokens,
        total_cost_usd, pedagogist_model, coder_model, debugger_model,
        generation_time_ms, cached, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      crypto.randomUUID().slice(0, 24),
      job.userId,
      job.jobId,
      job.prompt.slice(0, 500),
      job.language,
      pedagogistTokens,
      coderTokens,
      debuggerTokens,
      totalCostUSD,
      "gpt-4o-mini",
      "gpt-4o",
      "gpt-4o-mini",
      generationTimeMs,
      cached ? 1 : 0
    ).run();
  } catch (err) {
    console.error("Failed to log generation cost:", err);
  }
}
async function decrementQueueDepth(env2) {
  try {
    const current = parseInt(await env2.CACHE.get("system:queue:depth") || "1");
    await env2.CACHE.put(
      "system:queue:depth",
      String(Math.max(0, current - 1)),
      { expirationTtl: 600 }
    );
  } catch (err) {
    console.error("Failed to decrement queue depth:", err);
  }
}
async function trackCircuitBreakerFailure(env2) {
  try {
    const failures = parseInt(await env2.CACHE.get("system:circuit:failures") || "0") + 1;
    await env2.CACHE.put("system:circuit:failures", String(failures), { expirationTtl: 600 });
    if (failures >= 5) {
      await env2.CACHE.put("system:circuit:generation", "open", { expirationTtl: 300 });
      console.error(JSON.stringify({
        type: "alert",
        name: "circuit_breaker.tripped",
        consecutiveFailures: failures,
        action: "generation_blocked_5min"
      }));
    }
  } catch (err) {
    console.error("Failed to track circuit breaker:", err);
  }
}
var MODEL_PRICING, generation_consumer_default;
var init_generation_consumer = __esm({
  "src/queues/generation-consumer.ts"() {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tunnel_client();
    MODEL_PRICING = {
      "gpt-4o": { input: 2.5 / 1e6, output: 10 / 1e6 },
      "gpt-4o-mini": { input: 0.15 / 1e6, output: 0.6 / 1e6 }
    };
    __name(calculateCost, "calculateCost");
    __name(processGenerationQueue, "processGenerationQueue");
    __name(updateProgress, "updateProgress");
    __name(hashForCache, "hashForCache");
    __name(logGenerationCost, "logGenerationCost");
    __name(decrementQueueDepth, "decrementQueueDepth");
    __name(trackCircuitBreakerFailure, "trackCircuitBreakerFailure");
    generation_consumer_default = {
      async queue(batch, env2) {
        return processGenerationQueue(batch, env2);
      }
    };
  }
});

// src/index.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/cors/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/logger/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/color.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function getColorEnabled() {
  const { process, Deno } = globalThis;
  const isNoColor = typeof Deno?.noColor === "boolean" ? Deno.noColor : process !== void 0 ? (
    // eslint-disable-next-line no-unsafe-optional-chaining
    "NO_COLOR" in process?.env
  ) : false;
  return !isNoColor;
}
__name(getColorEnabled, "getColorEnabled");
async function getColorEnabledAsync() {
  const { navigator } = globalThis;
  const cfWorkers = "cloudflare:workers";
  const isNoColor = navigator !== void 0 && navigator.userAgent === "Cloudflare-Workers" ? await (async () => {
    try {
      return "NO_COLOR" in ((await import(cfWorkers)).env ?? {});
    } catch {
      return false;
    }
  })() : !getColorEnabled();
  return !isNoColor;
}
__name(getColorEnabledAsync, "getColorEnabledAsync");

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/logger/index.js
var humanize = /* @__PURE__ */ __name((times) => {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) => v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + delimiter));
  return orderTimes.join(separator);
}, "humanize");
var time3 = /* @__PURE__ */ __name((start) => {
  const delta = Date.now() - start;
  return humanize([delta < 1e3 ? delta + "ms" : Math.round(delta / 1e3) + "s"]);
}, "time");
var colorStatus = /* @__PURE__ */ __name(async (status) => {
  const colorEnabled = await getColorEnabledAsync();
  if (colorEnabled) {
    switch (status / 100 | 0) {
      case 5:
        return `\x1B[31m${status}\x1B[0m`;
      case 4:
        return `\x1B[33m${status}\x1B[0m`;
      case 3:
        return `\x1B[36m${status}\x1B[0m`;
      case 2:
        return `\x1B[32m${status}\x1B[0m`;
    }
  }
  return `${status}`;
}, "colorStatus");
async function log3(fn, prefix, method, path, status = 0, elapsed) {
  const out = prefix === "<--" ? `${prefix} ${method} ${path}` : `${prefix} ${method} ${path} ${await colorStatus(status)} ${elapsed}`;
  fn(out);
}
__name(log3, "log");
var logger = /* @__PURE__ */ __name((fn = console.log) => {
  return /* @__PURE__ */ __name(async function logger2(c, next) {
    const { method, url } = c.req;
    const path = url.slice(url.indexOf("/", 8));
    await log3(fn, "<--", method, path);
    const start = Date.now();
    await next();
    await log3(fn, "-->", method, path, c.res.status, time3(start));
  }, "logger2");
}, "logger");

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/secure-headers/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/secure-headers/secure-headers.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/utils/encode.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/hono@4.11.9/node_modules/hono/dist/middleware/secure-headers/secure-headers.js
var HEADERS_MAP = {
  crossOriginEmbedderPolicy: ["Cross-Origin-Embedder-Policy", "require-corp"],
  crossOriginResourcePolicy: ["Cross-Origin-Resource-Policy", "same-origin"],
  crossOriginOpenerPolicy: ["Cross-Origin-Opener-Policy", "same-origin"],
  originAgentCluster: ["Origin-Agent-Cluster", "?1"],
  referrerPolicy: ["Referrer-Policy", "no-referrer"],
  strictTransportSecurity: ["Strict-Transport-Security", "max-age=15552000; includeSubDomains"],
  xContentTypeOptions: ["X-Content-Type-Options", "nosniff"],
  xDnsPrefetchControl: ["X-DNS-Prefetch-Control", "off"],
  xDownloadOptions: ["X-Download-Options", "noopen"],
  xFrameOptions: ["X-Frame-Options", "SAMEORIGIN"],
  xPermittedCrossDomainPolicies: ["X-Permitted-Cross-Domain-Policies", "none"],
  xXssProtection: ["X-XSS-Protection", "0"]
};
var DEFAULT_OPTIONS = {
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: true,
  crossOriginOpenerPolicy: true,
  originAgentCluster: true,
  referrerPolicy: true,
  strictTransportSecurity: true,
  xContentTypeOptions: true,
  xDnsPrefetchControl: true,
  xDownloadOptions: true,
  xFrameOptions: true,
  xPermittedCrossDomainPolicies: true,
  xXssProtection: true,
  removePoweredBy: true,
  permissionsPolicy: {}
};
var secureHeaders = /* @__PURE__ */ __name((customOptions) => {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const headersToSet = getFilteredHeaders(options);
  const callbacks = [];
  if (options.contentSecurityPolicy) {
    const [callback, value] = getCSPDirectives(options.contentSecurityPolicy);
    if (callback) {
      callbacks.push(callback);
    }
    headersToSet.push(["Content-Security-Policy", value]);
  }
  if (options.contentSecurityPolicyReportOnly) {
    const [callback, value] = getCSPDirectives(options.contentSecurityPolicyReportOnly);
    if (callback) {
      callbacks.push(callback);
    }
    headersToSet.push(["Content-Security-Policy-Report-Only", value]);
  }
  if (options.permissionsPolicy && Object.keys(options.permissionsPolicy).length > 0) {
    headersToSet.push([
      "Permissions-Policy",
      getPermissionsPolicyDirectives(options.permissionsPolicy)
    ]);
  }
  if (options.reportingEndpoints) {
    headersToSet.push(["Reporting-Endpoints", getReportingEndpoints(options.reportingEndpoints)]);
  }
  if (options.reportTo) {
    headersToSet.push(["Report-To", getReportToOptions(options.reportTo)]);
  }
  return /* @__PURE__ */ __name(async function secureHeaders2(ctx, next) {
    const headersToSetForReq = callbacks.length === 0 ? headersToSet : callbacks.reduce((acc, cb) => cb(ctx, acc), headersToSet);
    await next();
    setHeaders(ctx, headersToSetForReq);
    if (options?.removePoweredBy) {
      ctx.res.headers.delete("X-Powered-By");
    }
  }, "secureHeaders2");
}, "secureHeaders");
function getFilteredHeaders(options) {
  return Object.entries(HEADERS_MAP).filter(([key]) => options[key]).map(([key, defaultValue]) => {
    const overrideValue = options[key];
    return typeof overrideValue === "string" ? [defaultValue[0], overrideValue] : defaultValue;
  });
}
__name(getFilteredHeaders, "getFilteredHeaders");
function getCSPDirectives(contentSecurityPolicy) {
  const callbacks = [];
  const resultValues = [];
  for (const [directive, value] of Object.entries(contentSecurityPolicy)) {
    const valueArray = Array.isArray(value) ? value : [value];
    valueArray.forEach((value2, i) => {
      if (typeof value2 === "function") {
        const index = i * 2 + 2 + resultValues.length;
        callbacks.push((ctx, values) => {
          values[index] = value2(ctx, directive);
        });
      }
    });
    resultValues.push(
      directive.replace(
        /[A-Z]+(?![a-z])|[A-Z]/g,
        (match2, offset) => offset ? "-" + match2.toLowerCase() : match2.toLowerCase()
      ),
      ...valueArray.flatMap((value2) => [" ", value2]),
      "; "
    );
  }
  resultValues.pop();
  return callbacks.length === 0 ? [void 0, resultValues.join("")] : [
    (ctx, headersToSet) => headersToSet.map((values) => {
      if (values[0] === "Content-Security-Policy" || values[0] === "Content-Security-Policy-Report-Only") {
        const clone = values[1].slice();
        callbacks.forEach((cb) => {
          cb(ctx, clone);
        });
        return [values[0], clone.join("")];
      } else {
        return values;
      }
    }),
    resultValues
  ];
}
__name(getCSPDirectives, "getCSPDirectives");
function getPermissionsPolicyDirectives(policy) {
  return Object.entries(policy).map(([directive, value]) => {
    const kebabDirective = camelToKebab(directive);
    if (typeof value === "boolean") {
      return `${kebabDirective}=${value ? "*" : "none"}`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${kebabDirective}=()`;
      }
      if (value.length === 1 && (value[0] === "*" || value[0] === "none")) {
        return `${kebabDirective}=${value[0]}`;
      }
      const allowlist = value.map((item) => ["self", "src"].includes(item) ? item : `"${item}"`);
      return `${kebabDirective}=(${allowlist.join(" ")})`;
    }
    return "";
  }).filter(Boolean).join(", ");
}
__name(getPermissionsPolicyDirectives, "getPermissionsPolicyDirectives");
function camelToKebab(str) {
  return str.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
}
__name(camelToKebab, "camelToKebab");
function getReportingEndpoints(reportingEndpoints = []) {
  return reportingEndpoints.map((endpoint) => `${endpoint.name}="${endpoint.url}"`).join(", ");
}
__name(getReportingEndpoints, "getReportingEndpoints");
function getReportToOptions(reportTo = []) {
  return reportTo.map((option) => JSON.stringify(option)).join(", ");
}
__name(getReportToOptions, "getReportToOptions");
function setHeaders(ctx, headersToSet) {
  headersToSet.forEach(([header, value]) => {
    ctx.res.headers.set(header, value);
  });
}
__name(setHeaders, "setHeaders");

// src/index.ts
init_http_exception();

// src/routes/capsules.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();
init_error_handler();
init_tunnel_client();
async function validateCapsuleContent(env2, content, language) {
  const solutionCode = content?.primary?.code?.wasmVersion?.solution || content?.solutionCode || content?.config_data?.reference_solution;
  const testCases = content?.testCases || content?.config_data?.test_cases || [];
  if (!solutionCode || testCases.length === 0) {
    return { valid: true };
  }
  const pistonUrl = env2.PISTON_URL;
  if (!pistonUrl) {
    console.warn("PISTON_URL not configured, skipping validation");
    return { valid: true };
  }
  const functionName = content?.functionName || solutionCode.match(/def (\w+)/)?.[1] || solutionCode.match(/function (\w+)/)?.[1] || "solution";
  const harness = buildBatchedTestHarness(solutionCode, testCases, language, functionName);
  const langMap = {
    python: { runtime: "python", fileName: "main.py" },
    javascript: { runtime: "javascript", fileName: "main.js" },
    java: { runtime: "java", fileName: "Main.java" },
    cpp: { runtime: "c++", fileName: "main.cpp" },
    c: { runtime: "c", fileName: "main.c" }
  };
  const mapping = langMap[language.toLowerCase()];
  if (!mapping) {
    return { valid: true };
  }
  try {
    const resp = await fetch(`${pistonUrl}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: mapping.runtime,
        version: "*",
        files: [{ name: mapping.fileName, content: harness }],
        run_timeout: 5e3,
        // 5s timeout
        run_memory_limit: 128 * 1024 * 1024
      })
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return { valid: false, error: { type: "runtime", message: `Piston error: ${errText.slice(0, 200)}` } };
    }
    const result = await resp.json();
    const stdout2 = result.run?.stdout || "";
    const stderr2 = result.run?.stderr || "";
    const passMatch = stdout2.match(/PASSED:\s*(\d+)/);
    const failMatch = stdout2.match(/FAILED:\s*(\d+)/);
    const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : testCases.length - passed;
    if (failed > 0 || result.run?.code !== 0) {
      const firstFailMatch = stdout2.match(/FAIL test_(\d+)/) || stderr2.match(/Error|Exception/i);
      return {
        valid: false,
        error: {
          type: stderr2 ? "runtime" : "test_mismatch",
          message: stderr2 || `${failed}/${testCases.length} tests failed`,
          test_case_id: firstFailMatch ? parseInt(firstFailMatch[1], 10) : void 0
        }
      };
    }
    return { valid: true };
  } catch (e) {
    console.warn("Validation fetch error:", e);
    return { valid: true };
  }
}
__name(validateCapsuleContent, "validateCapsuleContent");
async function healCapsule(env2, capsule, error3) {
  if (!env2.TUNNEL_URL || !env2.WORKER_SHARED_SECRET) {
    console.warn("TUNNEL_URL or WORKER_SHARED_SECRET not set, skipping heal");
    return { healed: false, error: "Bridge not configured" };
  }
  const client = new TunnelClient({
    baseUrl: env2.TUNNEL_URL,
    sharedSecret: env2.WORKER_SHARED_SECRET,
    callerName: "capsules-route"
  });
  const result = await client.call(
    "/internal/heal",
    { capsule, error: error3 },
    { timeoutMs: 45e3 }
  );
  if (result.success && result.data?.success && result.data?.healedCapsule) {
    return { healed: true, capsule: result.data.healedCapsule };
  }
  return { healed: false, error: result.data?.error || result.error || "Healing failed" };
}
__name(healCapsule, "healCapsule");
function buildBatchedTestHarness(solution, testCases, language, functionName) {
  const lang = language.toLowerCase();
  if (lang === "python") {
    const tests = testCases.map((tc, i) => {
      const input = JSON.stringify(tc.input);
      const expected = JSON.stringify(tc.expected_output ?? tc.expectedOutput);
      return `
try:
    result = ${functionName}(${tc.input !== void 0 ? input : ""})
    if result == ${expected}:
        print("PASS test_${i}")
        passed += 1
    else:
        print(f"FAIL test_${i}: got {result}, expected ${expected}")
        failed += 1
except Exception as e:
    print(f"FAIL test_${i}: {e}")
    failed += 1
`;
    }).join("\n");
    return `${solution}

passed = 0
failed = 0
${tests}
print(f"PASSED: {passed}")
print(f"FAILED: {failed}")
`;
  }
  if (lang === "javascript") {
    const tests = testCases.map((tc, i) => {
      const inputArgs = tc.input !== void 0 ? JSON.stringify(tc.input) : "";
      const expected = JSON.stringify(tc.expected_output ?? tc.expectedOutput);
      return `
try {
  const result = ${functionName}(${inputArgs});
  if (JSON.stringify(result) === '${expected.replace(/'/g, "\\'")}') {
    console.log("PASS test_${i}");
    passed++;
  } else {
    console.log(\`FAIL test_${i}: got \${JSON.stringify(result)}, expected ${expected}\`);
    failed++;
  }
} catch (e) {
  console.log(\`FAIL test_${i}: \${e.message}\`);
  failed++;
}
`;
    }).join("\n");
    return `${solution}

let passed = 0;
let failed = 0;
${tests}
console.log(\`PASSED: \${passed}\`);
console.log(\`FAILED: \${failed}\`);
`;
  }
  return solution;
}
__name(buildBatchedTestHarness, "buildBatchedTestHarness");
var capsuleRoutes = new Hono2();
capsuleRoutes.get("/", async (c) => {
  const { limit = "10", offset = "0", language, difficulty, type } = c.req.query();
  let query = `
    SELECT id, title, description, type, difficulty, language, 
           function_name, test_count, has_hints, tags, quality_score,
           created_at
    FROM capsules 
    WHERE is_published = 1 AND is_deleted = 0
  `;
  const params = [];
  if (language) {
    query += " AND language = ?";
    params.push(language);
  }
  if (difficulty) {
    query += " AND difficulty = ?";
    params.push(difficulty.toUpperCase());
  }
  if (type) {
    query += " AND type = ?";
    params.push(type.toUpperCase());
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const capsules = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({
    success: true,
    data: capsules.results,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: capsules.results?.length || 0
      }
    }
  });
});
capsuleRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const auth = c.get("auth");
  const cacheKey = `capsule:${id}`;
  const cached = await c.env.CACHE.get(cacheKey, "json");
  if (cached) {
    trackEvent(c.env, id, auth?.userId, "impression");
    return c.json({
      success: true,
      capsule: cached,
      data: cached,
      source: "cache",
      meta: {
        requestId: c.get("requestId"),
        timestamp: Date.now(),
        version: c.env.API_VERSION
      }
    });
  }
  const row = await c.env.DB.prepare(`
    SELECT * FROM capsules 
    WHERE id = ? AND is_deleted = 0
  `).bind(id).first();
  if (!row) {
    throw new ApiError(404, "Capsule not found");
  }
  if (!row.is_published && row.creator_id !== auth?.userId) {
    throw new ApiError(403, "Access denied");
  }
  const capsule = { ...row };
  for (const key of ["content", "config_data", "tags", "pedagogy"]) {
    if (typeof capsule[key] === "string") {
      try {
        capsule[key] = JSON.parse(capsule[key]);
      } catch {
      }
    }
  }
  if (!Array.isArray(capsule.tags)) {
    capsule.tags = capsule.tags ? [String(capsule.tags)] : [];
  }
  capsule.isPublished = !!capsule.is_published;
  capsule.createdAt = capsule.created_at;
  capsule.updatedAt = capsule.updated_at;
  if (row.is_published) {
    await c.env.CACHE.put(cacheKey, JSON.stringify(capsule), {
      expirationTtl: 3600
    });
  }
  trackEvent(c.env, id, auth?.userId, "impression");
  return c.json({
    success: true,
    capsule,
    data: capsule,
    source: "database",
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
capsuleRoutes.post("/", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const body = await c.req.json();
  let { title: title2, description, type, difficulty, language, content, tags } = body;
  if (!title2 || !language || !content) {
    throw new ApiError(400, "title, language, and content are required");
  }
  const normalizedDifficulty = (difficulty || "MEDIUM").toUpperCase();
  if (!["EASY", "MEDIUM", "HARD"].includes(normalizedDifficulty)) {
    throw new ApiError(400, "Invalid difficulty. Must be EASY, MEDIUM, or HARD");
  }
  const MAX_HEAL_ATTEMPTS = 2;
  let healingAttempts = 0;
  let lastError;
  for (let attempt = 0; attempt <= MAX_HEAL_ATTEMPTS; attempt++) {
    const validation = await validateCapsuleContent(c.env, content, language);
    if (validation.valid) {
      break;
    }
    lastError = validation.error;
    console.log(`\u{1F9EA} Validation failed (attempt ${attempt + 1}): ${lastError?.message}`);
    if (attempt < MAX_HEAL_ATTEMPTS) {
      console.log(`\u{1FA79} Attempting heal (${attempt + 1}/${MAX_HEAL_ATTEMPTS})...`);
      const capsuleForHealing = {
        id: `temp-${Date.now()}`,
        title: title2,
        description,
        type: type || "CODE",
        difficulty: normalizedDifficulty.toLowerCase(),
        language,
        content,
        tags
      };
      const healResult = await healCapsule(c.env, capsuleForHealing, lastError);
      if (healResult.healed && healResult.capsule) {
        content = healResult.capsule.content || healResult.capsule;
        healingAttempts++;
        console.log(`\u2705 Heal succeeded, retrying validation...`);
      } else {
        console.warn(`\u274C Heal failed: ${healResult.error}`);
      }
    }
  }
  if (lastError && healingAttempts === MAX_HEAL_ATTEMPTS) {
    console.warn(`\u26A0\uFE0F Saving capsule with validation issues after ${MAX_HEAL_ATTEMPTS} heal attempts: ${lastError.message}`);
  }
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const functionName = content?.primary?.code?.wasmVersion?.solution?.match(/def (\w+)/)?.[1] || content?.primary?.code?.wasmVersion?.solution?.match(/function (\w+)/)?.[1];
  const testCount = content?.testCases?.length || 0;
  const hasHints = content?.pedagogy?.hints?.length > 0 ? 1 : 0;
  await c.env.DB.prepare(`
    INSERT INTO capsules (id, creator_id, title, description, type, difficulty, language, 
                          function_name, test_count, has_hints, content, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    auth.userId,
    title2,
    description || null,
    type || "CODE",
    normalizedDifficulty,
    language,
    functionName || null,
    testCount,
    hasHints,
    JSON.stringify(content),
    tags ? JSON.stringify(tags) : null
  ).run();
  try {
    const cdnPayload = {
      id,
      title: title2,
      description: description || null,
      type: type || "CODE",
      difficulty: normalizedDifficulty,
      language,
      content,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await c.env.CDN.put(
      `capsules/${id}.json`,
      JSON.stringify(cdnPayload),
      { httpMetadata: { contentType: "application/json" } }
    );
    console.log(`\u2705 Synced capsule to CDN: capsules/${id}.json`);
  } catch (r2Error) {
    console.error("\u26A0\uFE0F R2 sync failed (non-blocking):", r2Error);
  }
  return c.json({
    success: true,
    data: {
      id,
      title: title2,
      healed: healingAttempts > 0,
      healingAttempts
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  }, 201);
});
capsuleRoutes.put("/:id", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const { id } = c.req.param();
  const body = await c.req.json();
  const existing = await c.env.DB.prepare(
    "SELECT creator_id FROM capsules WHERE id = ? AND is_deleted = 0"
  ).bind(id).first();
  if (!existing) {
    throw new ApiError(404, "Capsule not found");
  }
  if (existing.creator_id !== auth.userId) {
    throw new ApiError(403, "Access denied");
  }
  const updates = [];
  const values = [];
  if (body.title) {
    updates.push("title = ?");
    values.push(body.title);
  }
  if (body.description !== void 0) {
    updates.push("description = ?");
    values.push(body.description);
  }
  if (body.difficulty) {
    const normalizedDifficulty = body.difficulty.toUpperCase();
    if (!["EASY", "MEDIUM", "HARD"].includes(normalizedDifficulty)) {
      throw new ApiError(400, "Invalid difficulty. Must be EASY, MEDIUM, or HARD");
    }
    updates.push("difficulty = ?");
    values.push(normalizedDifficulty);
  }
  if (body.content) {
    updates.push("content = ?");
    values.push(JSON.stringify(body.content));
  }
  if (body.tags) {
    updates.push("tags = ?");
    values.push(JSON.stringify(body.tags));
  }
  if (body.isPublished !== void 0) {
    updates.push("is_published = ?");
    values.push(body.isPublished ? 1 : 0);
    if (body.isPublished) {
      updates.push('published_at = datetime("now")');
    }
  }
  if (updates.length === 0) {
    throw new ApiError(400, "No fields to update");
  }
  values.push(id);
  await c.env.DB.prepare(`
    UPDATE capsules SET ${updates.join(", ")} WHERE id = ?
  `).bind(...values).run();
  await c.env.CACHE.delete(`capsule:${id}`);
  if (body.content || body.title || body.description || body.isPublished) {
    try {
      const updated = await c.env.DB.prepare(
        "SELECT id, title, description, type, difficulty, language, content FROM capsules WHERE id = ?"
      ).bind(id).first();
      if (updated) {
        const cdnPayload = {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          type: updated.type,
          difficulty: updated.difficulty,
          language: updated.language,
          content: JSON.parse(updated.content),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        await c.env.CDN.put(
          `capsules/${id}.json`,
          JSON.stringify(cdnPayload),
          { httpMetadata: { contentType: "application/json" } }
        );
        console.log(`\u2705 Re-synced capsule to CDN: capsules/${id}.json`);
      }
    } catch (r2Error) {
      console.error("\u26A0\uFE0F R2 re-sync failed (non-blocking):", r2Error);
    }
  }
  return c.json({
    success: true,
    data: { id },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
capsuleRoutes.delete("/:id", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const { id } = c.req.param();
  const existing = await c.env.DB.prepare(
    "SELECT creator_id FROM capsules WHERE id = ? AND is_deleted = 0"
  ).bind(id).first();
  if (!existing) {
    throw new ApiError(404, "Capsule not found");
  }
  if (existing.creator_id !== auth.userId) {
    throw new ApiError(403, "Access denied");
  }
  await c.env.DB.prepare(
    "UPDATE capsules SET is_deleted = 1 WHERE id = ?"
  ).bind(id).run();
  await c.env.CACHE.delete(`capsule:${id}`);
  return c.json({
    success: true,
    message: "Capsule deleted",
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
function trackEvent(env2, capsuleId, userId, eventType, metadata) {
  env2.DB.prepare(`
    INSERT INTO capsule_events (capsule_id, user_id, event_type, metadata)
    VALUES (?, ?, ?, ?)
  `).bind(
    capsuleId,
    userId || null,
    eventType,
    metadata ? JSON.stringify(metadata) : null
  ).run().catch(() => {
  });
}
__name(trackEvent, "trackEvent");

// src/routes/generate.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();
init_error_handler();
init_rate_limit();
init_body_limit2();
var generateRoutes = new Hono2();
generateRoutes.use("*", generateLimit);
var MAX_CONCURRENT_JOBS = 5;
var IDEMPOTENCY_TTL = 600;
generateRoutes.post("/", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required to generate capsules");
  }
  const body = await c.req.json();
  const { prompt, language, difficulty = "MEDIUM" } = body;
  if (!prompt || typeof prompt !== "string") {
    throw new ApiError(400, "prompt is required");
  }
  if (!language || typeof language !== "string") {
    throw new ApiError(400, "language is required");
  }
  const supportedLanguages = ["python", "javascript", "java", "cpp", "c", "sql"];
  if (!supportedLanguages.includes(language.toLowerCase())) {
    throw new ApiError(400, `Unsupported language. Supported: ${supportedLanguages.join(", ")}`);
  }
  const normalizedDifficulty = difficulty.toUpperCase();
  const supportedDifficulties = ["EASY", "MEDIUM", "HARD"];
  if (!supportedDifficulties.includes(normalizedDifficulty)) {
    throw new ApiError(400, `Invalid difficulty. Supported: ${supportedDifficulties.join(", ")}`);
  }
  const circuitState = await c.env.CACHE.get("system:circuit:generation");
  if (circuitState === "open") {
    throw new ApiError(503, "AI generation is temporarily unavailable. Please try again in a few minutes.", "CIRCUIT_OPEN");
  }
  const idempotencyKey = await hashPrompt(`${auth.userId}:${prompt.trim().toLowerCase()}:${language}`);
  const existingJob = await c.env.CACHE.get(`idemp:${idempotencyKey}`, "json");
  if (existingJob) {
    return c.json({
      success: true,
      jobId: existingJob.jobId,
      status: "already_queued",
      statusUrl: `/api/v1/generate/${existingJob.jobId}/status`,
      deduplicated: true,
      meta: {
        requestId: c.get("requestId"),
        timestamp: Date.now(),
        version: c.env.API_VERSION
      }
    }, 200);
  }
  const queueDepth = parseInt(await c.env.CACHE.get("system:queue:depth") || "0");
  if (queueDepth >= MAX_CONCURRENT_JOBS) {
    throw new ApiError(429, `AI generation queue is full (${queueDepth}/${MAX_CONCURRENT_JOBS}). Please wait for current jobs to complete.`, "QUEUE_FULL");
  }
  const cachedResult = await checkSemanticCache(c.env, prompt, language);
  if (cachedResult) {
    return c.json({
      success: true,
      jobId: cachedResult.jobId,
      status: "completed",
      fromCache: true,
      result: cachedResult,
      meta: {
        requestId: c.get("requestId"),
        timestamp: Date.now(),
        version: c.env.API_VERSION
      }
    });
  }
  const jobId = `gen_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  await c.env.JOB_PROGRESS.put(`job:${jobId}`, JSON.stringify({
    status: "queued",
    progress: 0,
    currentStep: "Waiting in queue...",
    steps: [],
    userId: auth.userId,
    prompt: prompt.slice(0, 200),
    // Truncate for display
    language,
    difficulty: normalizedDifficulty,
    createdAt: Date.now()
  }), { expirationTtl: 600 });
  await c.env.GENERATION_QUEUE.send({
    jobId,
    userId: auth.userId,
    prompt,
    language: language.toLowerCase(),
    difficulty: normalizedDifficulty,
    timestamp: Date.now()
  });
  await c.env.CACHE.put(`idemp:${idempotencyKey}`, JSON.stringify({ jobId }), {
    expirationTtl: IDEMPOTENCY_TTL
  });
  await c.env.CACHE.put(
    "system:queue:depth",
    String(queueDepth + 1),
    { expirationTtl: 600 }
  );
  await incrementQuota(c.env, c.get("quotaKey"));
  const quotaInfo = await getQuotaInfo(c.env, auth.userId, auth.plan, "generation");
  return c.json({
    success: true,
    jobId,
    status: "queued",
    statusUrl: `/api/v1/generate/${jobId}/status`,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION,
      quota: {
        remaining: Math.max(0, quotaInfo.remaining - 1),
        limit: quotaInfo.limit
      }
    }
  }, 202);
});
generateRoutes.get("/:jobId/status", async (c) => {
  const { jobId } = c.req.param();
  const data = await c.env.JOB_PROGRESS.get(`job:${jobId}`, "json");
  if (!data) {
    throw new ApiError(404, "Job not found or expired");
  }
  if (data.status === "completed" && data.result) {
    return c.json({
      success: true,
      jobId,
      status: "completed",
      progress: 100,
      currentStep: "Done!",
      result: data.result,
      meta: {
        requestId: c.get("requestId"),
        timestamp: Date.now(),
        version: c.env.API_VERSION
      }
    });
  }
  if (data.status === "failed") {
    return c.json({
      success: false,
      jobId,
      status: "failed",
      progress: data.progress,
      currentStep: data.currentStep,
      error: data.error,
      meta: {
        requestId: c.get("requestId"),
        timestamp: Date.now(),
        version: c.env.API_VERSION
      }
    }, 500);
  }
  return c.json({
    success: true,
    jobId,
    status: data.status,
    progress: data.progress,
    currentStep: data.currentStep,
    steps: data.steps,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
async function checkSemanticCache(env2, prompt, language) {
  const normalizedPrompt = prompt.toLowerCase().trim().replace(/\s+/g, " ");
  const hash = await hashPrompt(normalizedPrompt);
  const cacheKey = `gencache:${language}:${hash}`;
  const cached = await env2.CACHE.get(cacheKey, "json");
  if (cached) {
    const cachedData = cached;
    return {
      jobId: `cached_${Date.now()}`,
      capsule: cachedData.capsule || cachedData
    };
  }
  return null;
}
__name(checkSemanticCache, "checkSemanticCache");
async function hashPrompt(prompt) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(prompt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPrompt, "hashPrompt");

// src/index.ts
init_execute();

// src/routes/auth.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();
init_error_handler();

// src/middleware/auth.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_factory();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/base64url.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/buffer_utils.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/webcrypto.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var webcrypto_default = crypto;
var isCryptoKey = /* @__PURE__ */ __name((key) => key instanceof CryptoKey, "isCryptoKey");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/base64url.js
var encodeBase642 = /* @__PURE__ */ __name((input) => {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < unencoded.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, unencoded.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}, "encodeBase64");
var encode = /* @__PURE__ */ __name((input) => {
  return encodeBase642(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}, "encode");
var decodeBase64 = /* @__PURE__ */ __name((encoded) => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}, "decodeBase64");
var decode = /* @__PURE__ */ __name((input) => {
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}, "decode");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/util/errors.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  constructor(message2, options) {
    super(message2, options);
    this.code = "ERR_JOSE_GENERIC";
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
JOSEError.code = "ERR_JOSE_GENERIC";
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
JWTClaimValidationFailed.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.code = "ERR_JWT_EXPIRED";
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
JWTExpired.code = "ERR_JWT_EXPIRED";
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
  }
};
JOSEAlgNotAllowed.code = "ERR_JOSE_ALG_NOT_ALLOWED";
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JOSE_NOT_SUPPORTED";
  }
};
JOSENotSupported.code = "ERR_JOSE_NOT_SUPPORTED";
var JWEDecryptionFailed = class extends JOSEError {
  static {
    __name(this, "JWEDecryptionFailed");
  }
  constructor(message2 = "decryption operation failed", options) {
    super(message2, options);
    this.code = "ERR_JWE_DECRYPTION_FAILED";
  }
};
JWEDecryptionFailed.code = "ERR_JWE_DECRYPTION_FAILED";
var JWEInvalid = class extends JOSEError {
  static {
    __name(this, "JWEInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWE_INVALID";
  }
};
JWEInvalid.code = "ERR_JWE_INVALID";
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWS_INVALID";
  }
};
JWSInvalid.code = "ERR_JWS_INVALID";
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWT_INVALID";
  }
};
JWTInvalid.code = "ERR_JWT_INVALID";
var JWKInvalid = class extends JOSEError {
  static {
    __name(this, "JWKInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWK_INVALID";
  }
};
JWKInvalid.code = "ERR_JWK_INVALID";
var JWKSInvalid = class extends JOSEError {
  static {
    __name(this, "JWKSInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWKS_INVALID";
  }
};
JWKSInvalid.code = "ERR_JWKS_INVALID";
var JWKSNoMatchingKey = class extends JOSEError {
  static {
    __name(this, "JWKSNoMatchingKey");
  }
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
    this.code = "ERR_JWKS_NO_MATCHING_KEY";
  }
};
JWKSNoMatchingKey.code = "ERR_JWKS_NO_MATCHING_KEY";
var JWKSMultipleMatchingKeys = class extends JOSEError {
  static {
    __name(this, "JWKSMultipleMatchingKeys");
  }
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
    this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  }
};
JWKSMultipleMatchingKeys.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
var JWKSTimeout = class extends JOSEError {
  static {
    __name(this, "JWKSTimeout");
  }
  constructor(message2 = "request timed out", options) {
    super(message2, options);
    this.code = "ERR_JWKS_TIMEOUT";
  }
};
JWKSTimeout.code = "ERR_JWKS_TIMEOUT";
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
    this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  }
};
JWSSignatureVerificationFailed.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/crypto_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
__name(unusable, "unusable");
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
__name(isAlgorithm, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usages) {
  if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
    let msg = "CryptoKey does not support this operation, its usages must include ";
    if (usages.length > 2) {
      const last = usages.pop();
      msg += `one of ${usages.join(", ")}, or ${last}.`;
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`;
    } else {
      msg += `${usages[0]}.`;
    }
    throw new TypeError(msg);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, ...usages) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "EdDSA": {
      if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
        throw unusable("Ed25519 or Ed448");
      }
      break;
    }
    case "Ed25519": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usages);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/invalid_key_input.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalid_key_input_default = /* @__PURE__ */ __name((actual, ...types2) => {
  return message("Key must be ", actual, ...types2);
}, "default");
function withAlg(alg, actual, ...types2) {
  return message(`Key for the ${alg} algorithm must be `, actual, ...types2);
}
__name(withAlg, "withAlg");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/is_key_like.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var is_key_like_default = /* @__PURE__ */ __name((key) => {
  if (isCryptoKey(key)) {
    return true;
  }
  return key?.[Symbol.toStringTag] === "KeyObject";
}, "default");
var types = ["CryptoKey"];

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/is_disjoint.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var isDisjoint = /* @__PURE__ */ __name((...headers) => {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}, "isDisjoint");
var is_disjoint_default = isDisjoint;

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/is_object.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
__name(isObjectLike, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/check_key_length.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var check_key_length_default = /* @__PURE__ */ __name((alg, key) => {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}, "default");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/normalize_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/is_jwk.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function isJWK(key) {
  return isObject(key) && typeof key.kty === "string";
}
__name(isJWK, "isJWK");
function isPrivateJWK(key) {
  return key.kty !== "oct" && typeof key.d === "string";
}
__name(isPrivateJWK, "isPrivateJWK");
function isPublicJWK(key) {
  return key.kty !== "oct" && typeof key.d === "undefined";
}
__name(isPublicJWK, "isPublicJWK");
function isSecretJWK(key) {
  return isJWK(key) && key.kty === "oct" && typeof key.k === "string";
}
__name(isSecretJWK, "isSecretJWK");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/jwk_to_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "EdDSA":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
var parse = /* @__PURE__ */ __name(async (jwk) => {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const rest = [
    algorithm,
    jwk.ext ?? false,
    jwk.key_ops ?? keyUsages
  ];
  const keyData = { ...jwk };
  delete keyData.alg;
  delete keyData.use;
  return webcrypto_default.subtle.importKey("jwk", keyData, ...rest);
}, "parse");
var jwk_to_key_default = parse;

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/normalize_key.js
var exportKeyValue = /* @__PURE__ */ __name((k) => decode(k), "exportKeyValue");
var privCache;
var pubCache;
var isKeyObject = /* @__PURE__ */ __name((key) => {
  return key?.[Symbol.toStringTag] === "KeyObject";
}, "isKeyObject");
var importAndCache = /* @__PURE__ */ __name(async (cache, key, jwk, alg, freeze = false) => {
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwk_to_key_default({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "importAndCache");
var normalizePublicKey = /* @__PURE__ */ __name((key, alg) => {
  if (isKeyObject(key)) {
    let jwk = key.export({ format: "jwk" });
    delete jwk.d;
    delete jwk.dp;
    delete jwk.dq;
    delete jwk.p;
    delete jwk.q;
    delete jwk.qi;
    if (jwk.k) {
      return exportKeyValue(jwk.k);
    }
    pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
    return importAndCache(pubCache, key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
    const cryptoKey = importAndCache(pubCache, key, key, alg, true);
    return cryptoKey;
  }
  return key;
}, "normalizePublicKey");
var normalizePrivateKey = /* @__PURE__ */ __name((key, alg) => {
  if (isKeyObject(key)) {
    let jwk = key.export({ format: "jwk" });
    if (jwk.k) {
      return exportKeyValue(jwk.k);
    }
    privCache || (privCache = /* @__PURE__ */ new WeakMap());
    return importAndCache(privCache, key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    privCache || (privCache = /* @__PURE__ */ new WeakMap());
    const cryptoKey = importAndCache(privCache, key, key, alg, true);
    return cryptoKey;
  }
  return key;
}, "normalizePrivateKey");
var normalize_key_default = { normalizePublicKey, normalizePrivateKey };

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/key/import.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function importJWK(jwk, alg) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  alg || (alg = jwk.alg);
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/check_key_type.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0 && key.use !== "sig") {
    throw new TypeError("Invalid key for this operation, when present its use must be sig");
  }
  if (key.key_ops !== void 0 && key.key_ops.includes?.(usage) !== true) {
    throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg}`);
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage, allowJwk) => {
  if (key instanceof Uint8Array)
    return;
  if (allowJwk && isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types, "Uint8Array", allowJwk ? "JSON Web Key" : null));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage, allowJwk) => {
  if (allowJwk && isJWK(key)) {
    switch (usage) {
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a private JWK`);
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a public JWK`);
    }
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types, allowJwk ? "JSON Web Key" : null));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (usage === "sign" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
  }
  if (usage === "decrypt" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
  }
  if (key.algorithm && usage === "verify" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
  }
  if (key.algorithm && usage === "encrypt" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
  }
}, "asymmetricTypeCheck");
function checkKeyType(allowJwk, alg, key, usage) {
  const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
  if (symmetric) {
    symmetricTypeCheck(alg, key, usage, allowJwk);
  } else {
    asymmetricTypeCheck(alg, key, usage, allowJwk);
  }
}
__name(checkKeyType, "checkKeyType");
var check_key_type_default = checkKeyType.bind(void 0, false);
var checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/validate_crit.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");
var validate_crit_default = validateCrit;

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/validate_algorithms.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var validateAlgorithms = /* @__PURE__ */ __name((option, algorithms) => {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}, "validateAlgorithms");
var validate_algorithms_default = validateAlgorithms;

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/compact/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/flattened/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/subtle_dsa.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function subtleDsa(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: alg.slice(-3) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
      return { name: "Ed25519" };
    case "EdDSA":
      return { name: algorithm.name };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleDsa, "subtleDsa");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/get_sign_verify_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function getCryptoKey(alg, key, usage) {
  if (usage === "sign") {
    key = await normalize_key_default.normalizePrivateKey(key, alg);
  }
  if (usage === "verify") {
    key = await normalize_key_default.normalizePublicKey(key, alg);
  }
  if (isCryptoKey(key)) {
    checkSigCryptoKey(key, alg, usage);
    return key;
  }
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalid_key_input_default(key, ...types));
    }
    return webcrypto_default.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  throw new TypeError(invalid_key_input_default(key, ...types, "Uint8Array", "JSON Web Key"));
}
__name(getCryptoKey, "getCryptoKey");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/verify.js
var verify = /* @__PURE__ */ __name(async (alg, key, signature, data) => {
  const cryptoKey = await getCryptoKey(alg, key, "verify");
  check_key_length_default(alg, cryptoKey);
  const algorithm = subtleDsa(alg, cryptoKey.algorithm);
  try {
    return await webcrypto_default.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}, "verify");
var verify_default = verify;

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
    checkKeyTypeWithJwk(alg, key, "verify");
    if (isJWK(key)) {
      key = await importJWK(key, alg);
    }
  } else {
    checkKeyTypeWithJwk(alg, key, "verify");
  }
  const data = concat(encoder.encode(jws.protected ?? ""), encoder.encode("."), typeof jws.payload === "string" ? encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const verified = await verify_default(alg, key, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jwt/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/jwt_claims_set.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/epoch.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var epoch_default = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "default");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/secs.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var secs_default = /* @__PURE__ */ __name((str) => {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}, "default");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/lib/jwt_claims_set.js
var normalizeTyp = /* @__PURE__ */ __name((value) => value.toLowerCase().replace(/^application\//, ""), "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
var jwt_claims_set_default = /* @__PURE__ */ __name((protectedHeader, encodedPayload, options = {}) => {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs_default(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}, "default");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = jwt_claims_set_default(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/compact/sign.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/flattened/sign.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/runtime/sign.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var sign = /* @__PURE__ */ __name(async (alg, key, data) => {
  const cryptoKey = await getCryptoKey(alg, key, "sign");
  check_key_length_default(alg, cryptoKey);
  const signature = await webcrypto_default.subtle.sign(subtleDsa(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}, "sign");
var sign_default = sign;

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/flattened/sign.js
var FlattenedSign = class {
  static {
    __name(this, "FlattenedSign");
  }
  constructor(payload) {
    if (!(payload instanceof Uint8Array)) {
      throw new TypeError("payload must be an instance of Uint8Array");
    }
    this._payload = payload;
  }
  setProtectedHeader(protectedHeader) {
    if (this._protectedHeader) {
      throw new TypeError("setProtectedHeader can only be called once");
    }
    this._protectedHeader = protectedHeader;
    return this;
  }
  setUnprotectedHeader(unprotectedHeader) {
    if (this._unprotectedHeader) {
      throw new TypeError("setUnprotectedHeader can only be called once");
    }
    this._unprotectedHeader = unprotectedHeader;
    return this;
  }
  async sign(key, options) {
    if (!this._protectedHeader && !this._unprotectedHeader) {
      throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
    }
    if (!is_disjoint_default(this._protectedHeader, this._unprotectedHeader)) {
      throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
    }
    const joseHeader = {
      ...this._protectedHeader,
      ...this._unprotectedHeader
    };
    const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this._protectedHeader, joseHeader);
    let b64 = true;
    if (extensions.has("b64")) {
      b64 = this._protectedHeader.b64;
      if (typeof b64 !== "boolean") {
        throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
      }
    }
    const { alg } = joseHeader;
    if (typeof alg !== "string" || !alg) {
      throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    checkKeyTypeWithJwk(alg, key, "sign");
    let payload = this._payload;
    if (b64) {
      payload = encoder.encode(encode(payload));
    }
    let protectedHeader;
    if (this._protectedHeader) {
      protectedHeader = encoder.encode(encode(JSON.stringify(this._protectedHeader)));
    } else {
      protectedHeader = encoder.encode("");
    }
    const data = concat(protectedHeader, encoder.encode("."), payload);
    const signature = await sign_default(alg, key, data);
    const jws = {
      signature: encode(signature),
      payload: ""
    };
    if (b64) {
      jws.payload = decoder.decode(payload);
    }
    if (this._unprotectedHeader) {
      jws.header = this._unprotectedHeader;
    }
    if (this._protectedHeader) {
      jws.protected = decoder.decode(protectedHeader);
    }
    return jws;
  }
};

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jws/compact/sign.js
var CompactSign = class {
  static {
    __name(this, "CompactSign");
  }
  constructor(payload) {
    this._flattened = new FlattenedSign(payload);
  }
  setProtectedHeader(protectedHeader) {
    this._flattened.setProtectedHeader(protectedHeader);
    return this;
  }
  async sign(key, options) {
    const jws = await this._flattened.sign(key, options);
    if (jws.payload === void 0) {
      throw new TypeError("use the flattened module for creating JWS with b64: false");
    }
    return `${jws.protected}.${jws.payload}.${jws.signature}`;
  }
};

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jwt/sign.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jwt/produce.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
__name(validateInput, "validateInput");
var ProduceJWT = class {
  static {
    __name(this, "ProduceJWT");
  }
  constructor(payload = {}) {
    if (!isObject(payload)) {
      throw new TypeError("JWT Claims Set MUST be an object");
    }
    this._payload = payload;
  }
  setIssuer(issuer) {
    this._payload = { ...this._payload, iss: issuer };
    return this;
  }
  setSubject(subject) {
    this._payload = { ...this._payload, sub: subject };
    return this;
  }
  setAudience(audience) {
    this._payload = { ...this._payload, aud: audience };
    return this;
  }
  setJti(jwtId) {
    this._payload = { ...this._payload, jti: jwtId };
    return this;
  }
  setNotBefore(input) {
    if (typeof input === "number") {
      this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, nbf: validateInput("setNotBefore", epoch_default(input)) };
    } else {
      this._payload = { ...this._payload, nbf: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
    }
    return this;
  }
  setExpirationTime(input) {
    if (typeof input === "number") {
      this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, exp: validateInput("setExpirationTime", epoch_default(input)) };
    } else {
      this._payload = { ...this._payload, exp: epoch_default(/* @__PURE__ */ new Date()) + secs_default(input) };
    }
    return this;
  }
  setIssuedAt(input) {
    if (typeof input === "undefined") {
      this._payload = { ...this._payload, iat: epoch_default(/* @__PURE__ */ new Date()) };
    } else if (input instanceof Date) {
      this._payload = { ...this._payload, iat: validateInput("setIssuedAt", epoch_default(input)) };
    } else if (typeof input === "string") {
      this._payload = {
        ...this._payload,
        iat: validateInput("setIssuedAt", epoch_default(/* @__PURE__ */ new Date()) + secs_default(input))
      };
    } else {
      this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
    }
    return this;
  }
};

// ../../node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/browser/jwt/sign.js
var SignJWT = class extends ProduceJWT {
  static {
    __name(this, "SignJWT");
  }
  setProtectedHeader(protectedHeader) {
    this._protectedHeader = protectedHeader;
    return this;
  }
  async sign(key, options) {
    const sig = new CompactSign(encoder.encode(JSON.stringify(this._payload)));
    sig.setProtectedHeader(this._protectedHeader);
    if (Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === false) {
      throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
    }
    return sig.sign(key, options);
  }
};

// src/middleware/auth.ts
init_error_handler();
var PUBLIC_ROUTES = /* @__PURE__ */ new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/callback",
  "/api/v1/execute",
  // Execute (rate limited instead)
  "/api/v1/analytics/track"
  // Embed analytics tracking
]);
var PUBLIC_PREFIXES = [
  "/api/v1/capsules/public/"
  // Only truly public capsule routes
];
var OPTIONAL_AUTH_PREFIXES = [
  "/api/v1/capsules/",
  // GET individual capsule
  "/api/v1/analytics/public/",
  "/api/v1/playlists/"
  // GET playlist + embed + progress (auth optional)
];
var authMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  const isExactPublic = PUBLIC_ROUTES.has(path);
  const isPrefixPublic = PUBLIC_PREFIXES.some((route) => path.startsWith(route));
  const isPublicCapsuleGet = path === "/api/v1/capsules" && method === "GET";
  const isPublic = isExactPublic || isPrefixPublic || isPublicCapsuleGet;
  const isOptional = OPTIONAL_AUTH_PREFIXES.some((route) => path.startsWith(route));
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    if (isPublic || isOptional) {
      c.set("auth", null);
      await next();
      return;
    }
    throw new ApiError(401, "Authentication required");
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Invalid authorization header format");
  }
  const token = authHeader.slice(7);
  try {
    if (token.startsWith("dk_")) {
      const auth2 = await authenticateApiKey(c.env, token);
      c.set("auth", auth2);
      await next();
      return;
    }
    const auth = await authenticateJWT(c.env, token);
    c.set("auth", auth);
    await next();
  } catch (error3) {
    if (isOptional) {
      c.set("auth", null);
      await next();
      return;
    }
    throw error3;
  }
});
async function authenticateApiKey(env2, apiKey) {
  const keyHash = await hashKey(apiKey);
  const keyData = await env2.SESSIONS.get(`apikey:${keyHash}`, "json");
  if (!keyData) {
    throw new ApiError(401, "Invalid API key");
  }
  const now = Date.now();
  if (!keyData.lastUsed || now - keyData.lastUsed > 432e5) {
    env2.SESSIONS.put(`apikey:${keyHash}`, JSON.stringify({
      ...keyData,
      lastUsed: now
    })).catch((err) => console.error("Failed to update API key lastUsed:", err));
  }
  return {
    userId: keyData.userId,
    email: keyData.email,
    plan: keyData.plan,
    isApiKey: true
  };
}
__name(authenticateApiKey, "authenticateApiKey");
async function authenticateJWT(env2, token) {
  if (env2.SUPABASE_JWT_SECRET) {
    try {
      const supabaseAuth = await authenticateSupabaseJWT(env2, token);
      return supabaseAuth;
    } catch {
    }
  }
  if (env2.JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(env2.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret, {
        issuer: "devcapsules",
        audience: "devcapsules-api"
      });
      if (payload.exp && payload.exp < Date.now() / 1e3) {
        throw new ApiError(401, "Token expired");
      }
      return {
        userId: payload.sub,
        email: payload.email,
        plan: payload.plan || "free",
        isApiKey: false
      };
    } catch (error3) {
      if (error3 instanceof ApiError) throw error3;
      throw new ApiError(401, "Invalid token");
    }
  }
  throw new ApiError(401, "No JWT verification keys configured");
}
__name(authenticateJWT, "authenticateJWT");
async function authenticateSupabaseJWT(env2, token) {
  const secret = new TextEncoder().encode(env2.SUPABASE_JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, {
    audience: "authenticated"
  });
  if (payload.exp && payload.exp < Date.now() / 1e3) {
    throw new ApiError(401, "Token expired");
  }
  const supabaseUserId = payload.sub;
  const email = payload.email;
  if (!supabaseUserId || !email) {
    throw new ApiError(401, "Invalid Supabase token claims");
  }
  let user = await env2.DB.prepare(
    "SELECT id, email, plan FROM users WHERE id = ? OR email = ?"
  ).bind(supabaseUserId, email).first();
  if (!user) {
    const name = payload.user_metadata?.full_name || payload.user_metadata?.name || email.split("@")[0];
    const provider = payload.app_metadata?.provider || "email";
    const validProviders = ["email", "github", "google"];
    const authProvider = validProviders.includes(provider) ? provider : "email";
    await env2.DB.prepare(`
      INSERT INTO users (id, email, name, auth_provider, plan)
      VALUES (?, ?, ?, ?, 'free')
    `).bind(supabaseUserId, email, name, authProvider).run();
    user = { id: supabaseUserId, email, plan: "free" };
  }
  return {
    userId: user.id,
    email: user.email,
    plan: user.plan || "free",
    isApiKey: false
  };
}
__name(authenticateSupabaseJWT, "authenticateSupabaseJWT");
async function hashKey(apiKey) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashKey, "hashKey");
async function generateApiKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `dk_${key}`;
}
__name(generateApiKey, "generateApiKey");
async function generateJWT(env2, payload) {
  const secret = new TextEncoder().encode(env2.JWT_SECRET);
  const token = await new SignJWT({
    sub: payload.userId,
    email: payload.email,
    plan: payload.plan
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer("devcapsules").setAudience("devcapsules-api").setExpirationTime("7d").sign(secret);
  return token;
}
__name(generateJWT, "generateJWT");

// src/routes/auth.ts
var authRoutes = new Hono2();
authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, name, password } = body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }
  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  ).bind(email).first();
  if (existing) {
    throw new ApiError(409, "User with this email already exists");
  }
  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  await c.env.DB.prepare(`
    INSERT INTO users (id, email, name, password_hash, auth_provider)
    VALUES (?, ?, ?, ?, 'email')
  `).bind(userId, email, name || null, passwordHash).run();
  const token = await generateJWT(c.env, {
    userId,
    email,
    plan: "free"
  });
  return c.json({
    success: true,
    data: {
      user: { id: userId, email, name, plan: "free" },
      token
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  }, 201);
});
authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, plan, password_hash FROM users WHERE email = ?"
  ).bind(email).first();
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }
  const token = await generateJWT(c.env, {
    userId: user.id,
    email: user.email,
    plan: user.plan
  });
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan
      },
      token
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
authRoutes.get("/me", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Not authenticated");
  }
  const user = await c.env.DB.prepare(`
    SELECT id, email, name, avatar_url, plan, generation_quota, execution_quota, created_at
    FROM users WHERE id = ?
  `).bind(auth.userId).first();
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return c.json({
    success: true,
    data: user,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
authRoutes.post("/api-keys", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const body = await c.req.json();
  const { name = "API Key" } = body;
  const apiKey = await generateApiKey();
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.slice(0, 11);
  const keyId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  await c.env.DB.prepare(`
    INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix)
    VALUES (?, ?, ?, ?, ?)
  `).bind(keyId, auth.userId, name, keyHash, keyPrefix).run();
  await c.env.SESSIONS.put(`apikey:${keyHash}`, JSON.stringify({
    userId: auth.userId,
    email: auth.email,
    plan: auth.plan,
    createdAt: Date.now()
  }));
  return c.json({
    success: true,
    data: {
      id: keyId,
      name,
      key: apiKey,
      // Only shown once!
      prefix: keyPrefix,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    warning: "Save this API key! It cannot be retrieved later.",
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  }, 201);
});
authRoutes.get("/api-keys", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const keys = await c.env.DB.prepare(`
    SELECT id, name, key_prefix, last_used, is_active, created_at
    FROM api_keys
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `).bind(auth.userId).all();
  return c.json({
    success: true,
    data: keys.results,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
authRoutes.delete("/api-keys/:id", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const { id } = c.req.param();
  const key = await c.env.DB.prepare(
    "SELECT key_hash FROM api_keys WHERE id = ? AND user_id = ?"
  ).bind(id, auth.userId).first();
  if (!key) {
    throw new ApiError(404, "API key not found");
  }
  await c.env.DB.prepare(
    "UPDATE api_keys SET is_active = 0 WHERE id = ?"
  ).bind(id).run();
  await c.env.SESSIONS.delete(`apikey:${key.key_hash}`);
  return c.json({
    success: true,
    message: "API key revoked",
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
async function hashPassword(password) {
  const encoder2 = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder2.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  const [saltHex, storedHash] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)));
  const encoder2 = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder2.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === storedHash;
}
__name(verifyPassword, "verifyPassword");
async function hashApiKey(apiKey) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashApiKey, "hashApiKey");

// src/routes/analytics.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();
init_error_handler();
var analyticsRoutes = new Hono2();
analyticsRoutes.get("/capsules/:id", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const { id } = c.req.param();
  const capsule = await c.env.DB.prepare(
    "SELECT creator_id, title FROM capsules WHERE id = ?"
  ).bind(id).first();
  if (!capsule) {
    throw new ApiError(404, "Capsule not found");
  }
  if (capsule.creator_id !== auth.userId) {
    throw new ApiError(403, "Access denied");
  }
  const stats = await c.env.DB.prepare(`
    SELECT * FROM capsule_stats WHERE capsule_id = ?
  `).bind(id).first();
  const recentEvents = await c.env.DB.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM capsule_events
    WHERE capsule_id = ? AND created_at > datetime('now', '-24 hours')
    GROUP BY event_type
  `).bind(id).all();
  const dailyTrends = await c.env.DB.prepare(`
    SELECT 
      date(created_at) as date,
      SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) as impressions,
      SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) as runs,
      SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) as passes
    FROM capsule_events
    WHERE capsule_id = ? AND created_at > datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date DESC
  `).bind(id).all();
  return c.json({
    success: true,
    data: {
      capsuleId: id,
      capsuleTitle: capsule.title,
      summary: stats || {
        impressions: 0,
        total_runs: 0,
        completion_rate: 0,
        engagement_rate: 0
      },
      last24Hours: recentEvents.results,
      dailyTrends: dailyTrends.results
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
analyticsRoutes.get("/dashboard", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    throw new ApiError(401, "Authentication required");
  }
  const capsules = await c.env.DB.prepare(`
    SELECT 
      c.id, c.title, c.language, c.is_published, c.created_at,
      COALESCE(s.impressions, 0) as impressions,
      COALESCE(s.total_runs, 0) as total_runs,
      COALESCE(s.completion_rate, 0) as completion_rate
    FROM capsules c
    LEFT JOIN capsule_stats s ON c.id = s.capsule_id
    WHERE c.creator_id = ? AND c.is_deleted = 0
    ORDER BY c.created_at DESC
    LIMIT 20
  `).bind(auth.userId).all();
  const aggregate = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_capsules,
      SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_capsules,
      SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END) as draft_capsules
    FROM capsules 
    WHERE creator_id = ? AND is_deleted = 0
  `).bind(auth.userId).first();
  const totalStats = await c.env.DB.prepare(`
    SELECT 
      SUM(s.impressions) as total_impressions,
      SUM(s.total_runs) as total_runs,
      SUM(s.total_passes) as total_passes
    FROM capsules c
    JOIN capsule_stats s ON c.id = s.capsule_id
    WHERE c.creator_id = ? AND c.is_deleted = 0
  `).bind(auth.userId).first();
  return c.json({
    success: true,
    data: {
      overview: {
        ...aggregate,
        ...totalStats
      },
      capsules: capsules.results
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
analyticsRoutes.post("/track", async (c) => {
  const body = await c.req.json();
  const { capsuleId, eventType, metadata, sessionId } = body;
  if (!capsuleId || !eventType) {
    throw new ApiError(400, "capsuleId and eventType are required");
  }
  const allowedEvents = ["impression", "run", "test_pass", "test_fail", "hint_viewed", "solution_viewed", "completed", "abandoned"];
  if (!allowedEvents.includes(eventType)) {
    throw new ApiError(400, `Invalid eventType. Allowed: ${allowedEvents.join(", ")}`);
  }
  const auth = c.get("auth");
  await c.env.DB.prepare(`
    INSERT INTO capsule_events (capsule_id, user_id, event_type, metadata, session_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    capsuleId,
    auth?.userId || null,
    eventType,
    metadata ? JSON.stringify(metadata) : null,
    sessionId || null
  ).run();
  return c.json({
    success: true,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
analyticsRoutes.get("/public/:id", async (c) => {
  const { id } = c.req.param();
  const capsule = await c.env.DB.prepare(
    "SELECT id FROM capsules WHERE id = ? AND is_published = 1"
  ).bind(id).first();
  if (!capsule) {
    throw new ApiError(404, "Capsule not found");
  }
  const stats = await c.env.DB.prepare(`
    SELECT impressions, total_runs, completion_rate
    FROM capsule_stats 
    WHERE capsule_id = ?
  `).bind(id).first();
  return c.json({
    success: true,
    data: stats || {
      impressions: 0,
      total_runs: 0,
      completion_rate: 0
    },
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});

// src/routes/mentor.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();
init_tunnel_client();
var mentor = new Hono2();
var HINT_LIMITS = {
  free: 3,
  creator: 10,
  enterprise: 50
};
var HINT_COST_USD = 2e-3;
mentor.post("/hint", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ error: "Authentication required" }, 401);
  }
  const body = await c.req.json();
  const { capsuleId, userCode, errorMessage, language, attemptNumber } = body;
  if (!capsuleId || !userCode || !language) {
    return c.json(
      { error: "capsuleId, userCode, and language are required" },
      400
    );
  }
  const env2 = c.env;
  const hintCountKey = `mentor:${auth.userId}:${capsuleId}:count`;
  const hintCount = parseInt(await env2.CACHE.get(hintCountKey) || "0");
  const maxHints = HINT_LIMITS[auth.plan] || HINT_LIMITS.free;
  if (hintCount >= maxHints) {
    console.log(JSON.stringify({
      type: "log",
      level: "warn",
      action: "mentor.rate_limited",
      userId: auth.userId,
      capsuleId,
      hintsUsed: hintCount,
      maxHints,
      plan: auth.plan
    }));
    return c.json({
      error: `Hint limit reached (${maxHints} per capsule on ${auth.plan} plan)`,
      hintsUsed: hintCount,
      hintsRemaining: 0,
      upgrade: auth.plan === "free" ? "Upgrade to Creator for 10 hints per capsule" : void 0
    }, 429);
  }
  const capsule = await env2.DB.prepare(
    "SELECT title, description, content FROM capsules WHERE id = ? AND is_deleted = 0"
  ).bind(capsuleId).first();
  if (!capsule) {
    return c.json({ error: "Capsule not found" }, 404);
  }
  let capsuleContext;
  try {
    const content = JSON.parse(capsule.content);
    capsuleContext = {
      title: capsule.title,
      description: capsule.description,
      testCases: content?.testCases || content?.content?.testCases || []
    };
  } catch {
    capsuleContext = {
      title: capsule.title,
      description: capsule.description,
      testCases: []
    };
  }
  const tunnel = createTunnelClient(env2, "mentor-worker", 15e3);
  const result = await tunnel.call("/internal/mentor-hint", {
    userCode,
    errorMessage: errorMessage || "",
    capsuleContext,
    language,
    attemptNumber: attemptNumber || hintCount + 1,
    userId: auth.userId,
    capsuleId
  });
  if (!result.success) {
    console.error(JSON.stringify({
      type: "log",
      level: "error",
      action: "mentor.tunnel_failed",
      userId: auth.userId,
      capsuleId,
      error: result.error,
      latencyMs: result.latencyMs
    }));
    return c.json(
      { error: "Mentor hint generation failed. Please try again." },
      502
    );
  }
  if (!result.data?.success) {
    return c.json(
      { error: result.data?.error || "Failed to generate hint" },
      500
    );
  }
  await env2.CACHE.put(hintCountKey, String(hintCount + 1), {
    expirationTtl: 86400
    // Reset daily
  });
  const dailySpend = parseFloat(await env2.CACHE.get("system:ai:daily_spend") || "0");
  await env2.CACHE.put("system:ai:daily_spend", String(dailySpend + HINT_COST_USD), {
    expirationTtl: 86400
  });
  const eventKey = `events:pending:${Math.floor(Date.now() / 6e4)}:${crypto.randomUUID().slice(0, 8)}`;
  await env2.CACHE.put(eventKey, JSON.stringify({
    capsuleId,
    userId: auth.userId,
    eventType: "hint_viewed",
    metadata: {
      hintLevel: result.data.hintLevel,
      attemptNumber: attemptNumber || hintCount + 1,
      language
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), { expirationTtl: 900 });
  console.log(JSON.stringify({
    type: "metric",
    name: "mentor.hint_generated",
    userId: auth.userId,
    capsuleId,
    hintLevel: result.data.hintLevel,
    hintsUsed: hintCount + 1,
    latencyMs: result.latencyMs
  }));
  return c.json({
    hint: result.data.hint,
    hintLevel: result.data.hintLevel,
    hintsUsed: hintCount + 1,
    hintsRemaining: maxHints - hintCount - 1
  });
});
mentor.get("/status/:capsuleId", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ error: "Authentication required" }, 401);
  }
  const capsuleId = c.req.param("capsuleId");
  const env2 = c.env;
  const hintCountKey = `mentor:${auth.userId}:${capsuleId}:count`;
  const hintCount = parseInt(await env2.CACHE.get(hintCountKey) || "0");
  const maxHints = HINT_LIMITS[auth.plan] || HINT_LIMITS.free;
  return c.json({
    capsuleId,
    hintsUsed: hintCount,
    hintsRemaining: Math.max(0, maxHints - hintCount),
    maxHints,
    plan: auth.plan
  });
});
mentor.post("/feedback", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ error: "Authentication required" }, 401);
  }
  const body = await c.req.json();
  const env2 = c.env;
  const eventKey = `events:pending:${Math.floor(Date.now() / 6e4)}:${crypto.randomUUID().slice(0, 8)}`;
  await env2.CACHE.put(eventKey, JSON.stringify({
    capsuleId: body.capsuleId,
    userId: auth.userId,
    eventType: "hint_feedback",
    metadata: {
      hintLevel: body.hintLevel,
      helpful: body.helpful,
      solvedAfter: body.solvedAfter
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), { expirationTtl: 900 });
  return c.json({ success: true });
});
var mentor_default = mentor;

// src/routes/playlists.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_dist();
init_error_handler();
var playlistRoutes = new Hono2();
function meta(c) {
  return {
    requestId: c.get("requestId"),
    timestamp: Date.now(),
    version: c.env.API_VERSION
  };
}
__name(meta, "meta");
function safeJsonParse(raw2, fallback = null) {
  if (typeof raw2 !== "string") return raw2 ?? fallback;
  try {
    return JSON.parse(raw2);
  } catch {
    return fallback;
  }
}
__name(safeJsonParse, "safeJsonParse");
function normaliseCourse(row) {
  return {
    // Map DB column names → UI field names
    playlist_id: row.id,
    id: row.id,
    creator_id: row.creator_id,
    title: row.title,
    description: row.description || "",
    is_public: !!row.is_published,
    status: row.status || (row.is_published ? "published" : "draft"),
    cover_image: row.cover_image || null,
    tags: safeJsonParse(row.tags, []),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
__name(normaliseCourse, "normaliseCourse");
playlistRoutes.get("/", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const { search, status, limit = "50", offset = "0" } = c.req.query();
  let query = `
    SELECT c.*, COUNT(cc.capsule_id) as total_items
    FROM courses c
    LEFT JOIN course_capsules cc ON c.id = cc.course_id
    WHERE c.creator_id = ? AND c.is_deleted = 0
  `;
  const params = [auth.userId];
  if (search) {
    query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status && status !== "all") {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  query += ` GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  const result = await c.env.DB.prepare(query).bind(...params).all();
  const courses = (result.results || []).map((row) => ({
    ...normaliseCourse(row),
    total_items: row.total_items || 0,
    items: []
    // list view doesn't need full items
  }));
  return c.json({ success: true, data: courses, meta: meta(c) });
});
playlistRoutes.get("/:id", async (c) => {
  const auth = c.get("auth");
  const { id } = c.req.param();
  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND is_deleted = 0
  `).bind(id).first();
  if (!course) throw new ApiError(404, "Course not found");
  if (!course.is_published && course.creator_id !== auth?.userId) {
    throw new ApiError(403, "Access denied");
  }
  const items = await c.env.DB.prepare(`
    SELECT cc.position, cc.is_gate, cc.is_optional,
           cap.id as capsule_id, cap.title, cap.description, cap.type,
           cap.difficulty, cap.language, cap.function_name, cap.test_count,
           cap.has_hints, cap.content, cap.tags, cap.is_published as capsule_published
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    WHERE cc.course_id = ?
    ORDER BY cc.position ASC
  `).bind(id).all();
  const normalizedItems = (items.results || []).map((row) => ({
    item_id: `${id}_${row.capsule_id}`,
    playlist_id: id,
    capsule_id: row.capsule_id,
    order: row.position,
    is_gate: !!row.is_gate,
    is_optional: !!row.is_optional,
    created_at: course.created_at,
    capsule: {
      id: row.capsule_id,
      title: row.title,
      description: row.description,
      type: row.type,
      difficulty: row.difficulty,
      language: row.language,
      function_name: row.function_name,
      test_count: row.test_count,
      has_hints: !!row.has_hints,
      content: safeJsonParse(row.content, {}),
      tags: safeJsonParse(row.tags, []),
      is_published: !!row.capsule_published
    }
  }));
  const data = {
    ...normaliseCourse(course),
    items: normalizedItems,
    total_items: normalizedItems.length
  };
  return c.json({ success: true, data, meta: meta(c) });
});
playlistRoutes.get("/:id/embed", async (c) => {
  const { id } = c.req.param();
  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND is_published = 1 AND is_deleted = 0
  `).bind(id).first();
  if (!course) throw new ApiError(404, "Course not found or not published");
  const items = await c.env.DB.prepare(`
    SELECT cc.position, cc.is_gate, cc.is_optional,
           cap.id as capsule_id, cap.title, cap.description, cap.type,
           cap.difficulty, cap.language, cap.test_count
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    WHERE cc.course_id = ?
    ORDER BY cc.position ASC
  `).bind(id).all();
  const data = {
    ...normaliseCourse(course),
    items: (items.results || []).map((row) => ({
      item_id: `${id}_${row.capsule_id}`,
      playlist_id: id,
      capsule_id: row.capsule_id,
      order: row.position,
      is_gate: !!row.is_gate,
      is_optional: !!row.is_optional,
      capsule: {
        id: row.capsule_id,
        title: row.title,
        description: row.description,
        type: row.type,
        difficulty: row.difficulty,
        language: row.language,
        test_count: row.test_count
      }
    })),
    total_items: items.results?.length || 0
  };
  return c.json({ success: true, data, meta: meta(c) });
});
playlistRoutes.post("/", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const body = await c.req.json();
  const { title: title2, description, is_public, items } = body;
  if (!title2) throw new ApiError(400, "title is required");
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const statements = [];
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO courses (id, creator_id, title, description, is_published, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(id, auth.userId, title2, description || "", is_public ? 1 : 0, is_public ? "published" : "draft")
  );
  if (Array.isArray(items) && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const position = item.order ?? item.position ?? i + 1;
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO course_capsules (course_id, capsule_id, position, is_gate, is_optional)
          VALUES (?, ?, ?, ?, ?)
        `).bind(id, item.capsule_id, position, item.is_gate ? 1 : 0, item.is_optional ? 1 : 0)
      );
    }
  }
  await c.env.DB.batch(statements);
  const created = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ?
  `).bind(id).first();
  return c.json({
    success: true,
    data: { ...normaliseCourse(created), items: items || [], total_items: items?.length || 0 },
    meta: meta(c)
  }, 201);
});
playlistRoutes.put("/:id", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const { id } = c.req.param();
  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND creator_id = ? AND is_deleted = 0
  `).bind(id, auth.userId).first();
  if (!course) throw new ApiError(404, "Course not found");
  const body = await c.req.json();
  const { title: title2, description, is_public, items } = body;
  const statements = [];
  statements.push(
    c.env.DB.prepare(`
      UPDATE courses
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          is_published = CASE WHEN ? IS NOT NULL THEN ? ELSE is_published END,
          status = CASE WHEN ? = 1 THEN 'published' WHEN ? = 0 THEN 'draft' ELSE status END,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title2 ?? null,
      description ?? null,
      is_public !== void 0 ? 1 : null,
      is_public ? 1 : 0,
      is_public ? 1 : 0,
      is_public ? 0 : 0,
      id
    )
  );
  if (Array.isArray(items)) {
    statements.push(
      c.env.DB.prepare(`DELETE FROM course_capsules WHERE course_id = ?`).bind(id)
    );
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const position = item.order ?? item.position ?? i + 1;
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO course_capsules (course_id, capsule_id, position, is_gate, is_optional)
          VALUES (?, ?, ?, ?, ?)
        `).bind(id, item.capsule_id, position, item.is_gate ? 1 : 0, item.is_optional ? 1 : 0)
      );
    }
  }
  await c.env.DB.batch(statements);
  const updated = await c.env.DB.prepare(`SELECT * FROM courses WHERE id = ?`).bind(id).first();
  const updatedItems = await c.env.DB.prepare(`
    SELECT cc.*, cap.title as capsule_title, cap.type, cap.difficulty, cap.language
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    WHERE cc.course_id = ?
    ORDER BY cc.position
  `).bind(id).all();
  return c.json({
    success: true,
    data: {
      ...normaliseCourse(updated),
      items: (updatedItems.results || []).map((r) => ({
        item_id: `${id}_${r.capsule_id}`,
        playlist_id: id,
        capsule_id: r.capsule_id,
        order: r.position,
        is_gate: !!r.is_gate,
        is_optional: !!r.is_optional,
        capsule: { id: r.capsule_id, title: r.capsule_title, type: r.type, difficulty: r.difficulty, language: r.language }
      })),
      total_items: updatedItems.results?.length || 0
    },
    meta: meta(c)
  });
});
playlistRoutes.delete("/:id", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const { id } = c.req.param();
  const result = await c.env.DB.prepare(`
    UPDATE courses SET is_deleted = 1, updated_at = datetime('now')
    WHERE id = ? AND creator_id = ?
  `).bind(id, auth.userId).run();
  if (!result.meta.changes) throw new ApiError(404, "Course not found");
  return c.json({ success: true, meta: meta(c) });
});
playlistRoutes.post("/:id/duplicate", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const { id } = c.req.param();
  const course = await c.env.DB.prepare(`
    SELECT * FROM courses WHERE id = ? AND creator_id = ? AND is_deleted = 0
  `).bind(id, auth.userId).first();
  if (!course) throw new ApiError(404, "Course not found");
  const newId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const items = await c.env.DB.prepare(`
    SELECT capsule_id, position, is_gate, is_optional FROM course_capsules WHERE course_id = ? ORDER BY position
  `).bind(id).all();
  const statements = [];
  statements.push(
    c.env.DB.prepare(`
      INSERT INTO courses (id, creator_id, title, description, cover_image, is_published, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 'draft', datetime('now'), datetime('now'))
    `).bind(newId, auth.userId, `${course.title} (Copy)`, course.description || "", course.cover_image || null)
  );
  for (const item of items.results || []) {
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO course_capsules (course_id, capsule_id, position, is_gate, is_optional)
        VALUES (?, ?, ?, ?, ?)
      `).bind(newId, item.capsule_id, item.position, item.is_gate, item.is_optional)
    );
  }
  await c.env.DB.batch(statements);
  return c.json({
    success: true,
    data: { id: newId, playlist_id: newId, title: `${course.title} (Copy)` },
    meta: meta(c)
  }, 201);
});
playlistRoutes.post("/:id/publish", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const published = body.published !== void 0 ? body.published : true;
  const result = await c.env.DB.prepare(`
    UPDATE courses
    SET is_published = ?, status = ?, updated_at = datetime('now')
    WHERE id = ? AND creator_id = ?
  `).bind(published ? 1 : 0, published ? "published" : "draft", id, auth.userId).run();
  if (!result.meta.changes) throw new ApiError(404, "Course not found");
  return c.json({ success: true, data: { published }, meta: meta(c) });
});
playlistRoutes.get("/:id/analytics", async (c) => {
  const auth = c.get("auth");
  if (!auth) throw new ApiError(401, "Authentication required");
  const { id } = c.req.param();
  const course = await c.env.DB.prepare(`
    SELECT id FROM courses WHERE id = ? AND creator_id = ? AND is_deleted = 0
  `).bind(id, auth.userId).first();
  if (!course) throw new ApiError(404, "Course not found");
  const itemCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM course_capsules WHERE course_id = ?
  `).bind(id).first();
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(DISTINCT user_id) as unique_learners,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completions,
      COUNT(*) as total_progress_rows
    FROM user_progress
    WHERE course_id = ?
  `).bind(id).first();
  const stepStats = await c.env.DB.prepare(`
    SELECT
      cc.position as step,
      cap.title as capsule_title,
      COUNT(DISTINCT up.user_id) as learners_reached,
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.user_id END) as learners_completed
    FROM course_capsules cc
    JOIN capsules cap ON cc.capsule_id = cap.id
    LEFT JOIN user_progress up ON up.capsule_id = cc.capsule_id AND up.course_id = ?
    WHERE cc.course_id = ?
    GROUP BY cc.position, cc.capsule_id
    ORDER BY cc.position
  `).bind(id, id).all();
  const totalItems = itemCount?.cnt || 0;
  const uniqueLearners = stats?.unique_learners || 0;
  const completions = stats?.completions || 0;
  const data = {
    playlist_id: id,
    total_views: uniqueLearners,
    unique_learners: uniqueLearners,
    total_completions: completions,
    average_completion_rate: totalItems > 0 && uniqueLearners > 0 ? Math.round(completions / (uniqueLearners * totalItems) * 100) / 100 : 0,
    total_items: totalItems,
    step_completion_rates: (stepStats.results || []).map((row) => ({
      step: row.step,
      title: row.capsule_title,
      learners_reached: row.learners_reached,
      learners_completed: row.learners_completed,
      completion_rate: row.learners_reached > 0 ? Math.round(row.learners_completed / row.learners_reached * 100) / 100 : 0
    })),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return c.json({ success: true, data, meta: meta(c) });
});
playlistRoutes.get("/:id/progress", async (c) => {
  const { id } = c.req.param();
  const auth = c.get("auth");
  const { session_id } = c.req.query();
  if (!auth && !session_id) {
    throw new ApiError(400, "session_id query param is required for anonymous progress");
  }
  let progress;
  if (auth) {
    progress = await c.env.DB.prepare(`
      SELECT up.*, cc.position
      FROM user_progress up
      JOIN course_capsules cc ON cc.capsule_id = up.capsule_id AND cc.course_id = up.course_id
      WHERE up.course_id = ? AND up.user_id = ?
      ORDER BY cc.position
    `).bind(id, auth.userId).all();
  } else {
    progress = { results: [] };
  }
  const rows = progress.results || [];
  const completedSteps = rows.filter((r) => r.status === "completed").map((r) => r.position);
  const currentStep = rows.length > 0 ? Math.max(...rows.map((r) => r.position)) : 1;
  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM course_capsules WHERE course_id = ?
  `).bind(id).first();
  const totalItems = total?.cnt || 0;
  const data = {
    progress_id: `${id}_${auth?.userId || session_id}`,
    playlist_id: id,
    learner_id: auth?.userId || null,
    session_id: session_id || auth?.userId || "",
    current_step: currentStep,
    completed_steps: completedSteps,
    started_at: rows.length > 0 ? rows[0].created_at : null,
    last_activity: rows.length > 0 ? rows[rows.length - 1].updated_at : null,
    completion_rate: totalItems > 0 ? completedSteps.length / totalItems : 0,
    details: rows.map((r) => ({
      capsule_id: r.capsule_id,
      position: r.position,
      status: r.status,
      attempts: r.attempts,
      best_time: r.best_time,
      hints_used: r.hints_used,
      completed_at: r.completed_at
    }))
  };
  return c.json({ success: true, data, meta: meta(c) });
});
playlistRoutes.post("/:id/progress", async (c) => {
  const { id } = c.req.param();
  const auth = c.get("auth");
  const body = await c.req.json();
  const { capsule_id, status, session_id, attempts, best_time, hints_used, last_code } = body;
  if (!capsule_id) throw new ApiError(400, "capsule_id is required");
  const userId = auth?.userId;
  if (!userId && !session_id) {
    throw new ApiError(400, "Authentication or session_id is required");
  }
  if (userId) {
    await c.env.DB.prepare(`
      INSERT INTO user_progress (id, user_id, capsule_id, course_id, status, attempts, best_time, hints_used, last_code, completed_at, updated_at)
      VALUES (
        lower(hex(randomblob(12))),
        ?, ?, ?,
        COALESCE(?, 'in_progress'),
        COALESCE(?, 1),
        ?,
        COALESCE(?, 0),
        ?,
        CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END,
        datetime('now')
      )
      ON CONFLICT(user_id, capsule_id) DO UPDATE SET
        status = COALESCE(excluded.status, user_progress.status),
        attempts = user_progress.attempts + 1,
        best_time = CASE
          WHEN excluded.best_time IS NOT NULL AND (user_progress.best_time IS NULL OR excluded.best_time < user_progress.best_time)
          THEN excluded.best_time
          ELSE user_progress.best_time
        END,
        hints_used = CASE WHEN excluded.hints_used > user_progress.hints_used THEN excluded.hints_used ELSE user_progress.hints_used END,
        last_code = COALESCE(excluded.last_code, user_progress.last_code),
        completed_at = CASE WHEN excluded.status = 'completed' AND user_progress.completed_at IS NULL THEN datetime('now') ELSE user_progress.completed_at END,
        course_id = COALESCE(excluded.course_id, user_progress.course_id),
        updated_at = datetime('now')
    `).bind(
      userId,
      capsule_id,
      id,
      status || "in_progress",
      attempts || 1,
      best_time || null,
      hints_used || 0,
      last_code || null,
      status || "in_progress"
    ).run();
  }
  const allProgress = userId ? await c.env.DB.prepare(`
        SELECT up.status, cc.position
        FROM user_progress up
        JOIN course_capsules cc ON cc.capsule_id = up.capsule_id AND cc.course_id = up.course_id
        WHERE up.course_id = ? AND up.user_id = ?
      `).bind(id, userId).all() : { results: [] };
  const completedSteps = (allProgress.results || []).filter((r) => r.status === "completed").map((r) => r.position);
  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as cnt FROM course_capsules WHERE course_id = ?
  `).bind(id).first();
  return c.json({
    success: true,
    data: {
      playlist_id: id,
      capsule_id,
      status: status || "in_progress",
      completed_steps: completedSteps,
      completion_rate: total?.cnt > 0 ? completedSteps.length / total.cnt : 0
    },
    meta: meta(c)
  });
});

// src/middleware/request-id.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_factory();
var requestId = createMiddleware(
  async (c, next) => {
    const cfRay = c.req.header("cf-ray");
    const id = cfRay || crypto.randomUUID();
    c.set("requestId", id);
    c.header("X-Request-ID", id);
    await next();
  }
);

// src/index.ts
init_rate_limit();
init_error_handler();
init_body_limit2();
var app = new Hono2();
app.onError((error3, c) => {
  const requestId2 = c.get("requestId") || "unknown";
  console.error(JSON.stringify({
    level: "error",
    requestId: requestId2,
    path: c.req.path,
    method: c.req.method,
    error: error3 instanceof Error ? error3.message : "Unknown error",
    stack: error3 instanceof Error ? error3.stack?.split("\n").slice(0, 3).join("\n") : void 0,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }));
  if (error3 instanceof ApiError) {
    return c.json({
      success: false,
      error: error3.message,
      code: error3.code,
      meta: { requestId: requestId2, timestamp: Date.now(), version: c.env?.API_VERSION }
    }, error3.statusCode);
  }
  if (error3 instanceof HTTPException) {
    return c.json({
      success: false,
      error: error3.message,
      meta: { requestId: requestId2, timestamp: Date.now(), version: c.env?.API_VERSION }
    }, error3.status);
  }
  return c.json({
    success: false,
    error: c.env?.ENVIRONMENT === "production" ? "Internal Server Error" : error3 instanceof Error ? error3.message : "Unknown error",
    meta: { requestId: requestId2, timestamp: Date.now(), version: c.env?.API_VERSION }
  }, 500);
});
app.use("*", requestId);
app.use("*", async (c, next) => {
  c.set("startTime", Date.now());
  await next();
});
app.use("*", secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://devcapsules.com", "https://*.devcapsules.com"]
  },
  xFrameOptions: "SAMEORIGIN",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin"
}));
app.use("*", async (c, next) => {
  const allowedOrigins = c.env.CORS_ORIGINS.split(",");
  const isEmbedRoute = c.req.path.includes("/embed/") || c.req.path.includes("/capsules/") || c.req.path.includes("/playlists/") || c.req.path.includes("/execute/runs/") || c.req.path.includes("/execute") && c.req.method === "POST";
  return cors({
    origin: isEmbedRoute ? "*" : allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    credentials: !isEmbedRoute,
    maxAge: 86400
    // 24 hours
  })(c, next);
});
app.use("*", async (c, next) => {
  if (c.env.LOG_LEVEL === "debug" || c.env.ENVIRONMENT !== "production") {
    return logger()(c, next);
  }
  await next();
});
app.get("/health", (c) => {
  return c.json({
    success: true,
    status: "ok",
    timestamp: Date.now(),
    version: c.env.API_VERSION,
    environment: c.env.ENVIRONMENT,
    edge: c.req.raw.cf?.colo || "unknown"
  });
});
var api = new Hono2();
api.use("*", rateLimiter);
api.use("*", defaultBodyLimit);
api.use("*", authMiddleware);
api.route("/capsules", capsuleRoutes);
api.route("/generate", generateRoutes);
api.route("/execute", executeRoutes);
api.route("/auth", authRoutes);
api.route("/analytics", analyticsRoutes);
api.route("/mentor", mentor_default);
api.route("/playlists", playlistRoutes);
api.get("/organizations/:orgId/playlists", (c) => playlistRoutes.fetch(new Request(new URL("/?" + new URL(c.req.url).searchParams.toString(), c.req.url), c.req.raw), c.env, c.executionCtx));
api.post("/organizations/:orgId/playlists", (c) => playlistRoutes.fetch(new Request(new URL("/", c.req.url), { method: "POST", headers: c.req.raw.headers, body: c.req.raw.body }), c.env, c.executionCtx));
api.get("/organizations/:orgId/capsules", (c) => capsuleRoutes.fetch(new Request(new URL("/?" + new URL(c.req.url).searchParams.toString(), c.req.url), c.req.raw), c.env, c.executionCtx));
api.get("/my-capsules", async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ success: false, error: "Authentication required" }, 401);
  }
  const capsules = await c.env.DB.prepare(`
    SELECT id, title, description, type, difficulty, language,
           function_name, test_count, has_hints, tags, quality_score,
           is_published, created_at, updated_at
    FROM capsules
    WHERE creator_id = ? AND is_deleted = 0
    ORDER BY updated_at DESC
  `).bind(auth.userId).all();
  return c.json({
    success: true,
    capsules: capsules.results || [],
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  });
});
app.route("/api/v1", api);
app.all("/api/*", (c) => {
  if (c.req.path.startsWith("/api/v1/")) {
    return c.json({ success: false, error: "Not Found", path: c.req.path }, 404);
  }
  const newPath = c.req.path.replace("/api/", "/api/v1/");
  return c.redirect(newPath, 301);
});
app.notFound((c) => {
  return c.json({
    success: false,
    error: "Not Found",
    path: c.req.path,
    meta: {
      requestId: c.get("requestId"),
      timestamp: Date.now(),
      version: c.env.API_VERSION
    }
  }, 404);
});
var index_default = {
  fetch: app.fetch,
  // Handle scheduled tasks (cron)
  async scheduled(event, env2, _ctx) {
    console.log("Running scheduled task:", event.cron);
    if (event.cron === "*/15 * * * *") {
      const { flushEventBuffer: flushEventBuffer2 } = await Promise.resolve().then(() => (init_analytics_buffer(), analytics_buffer_exports));
      await flushEventBuffer2(env2);
      await aggregateAnalytics(env2);
    }
  },
  // Handle queue messages (async generation + execution)
  async queue(batch, env2) {
    if (batch.queue === "execution-queue") {
      const { processExecutionQueue: processExecutionQueue2 } = await Promise.resolve().then(() => (init_execution_consumer(), execution_consumer_exports));
      await processExecutionQueue2(batch, env2);
    } else {
      const { processGenerationQueue: processGenerationQueue2 } = await Promise.resolve().then(() => (init_generation_consumer(), generation_consumer_exports));
      await processGenerationQueue2(batch, env2);
    }
  }
};
async function aggregateAnalytics(env2) {
  try {
    await env2.DB.exec(`
      INSERT OR REPLACE INTO capsule_stats (
        capsule_id, impressions, total_runs, total_passes,
        total_fails, completion_rate, engagement_rate, last_computed
      )
      SELECT
        capsule_id,
        SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) as impressions,
        SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) as total_runs,
        SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) as total_passes,
        SUM(CASE WHEN event_type = 'test_fail' THEN 1 ELSE 0 END) as total_fails,
        CAST(SUM(CASE WHEN event_type = 'test_pass' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END), 0) as completion_rate,
        CAST(SUM(CASE WHEN event_type = 'run' THEN 1 ELSE 0 END) AS REAL) /
          NULLIF(SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END), 0) as engagement_rate,
        datetime('now') as last_computed
      FROM capsule_events
      WHERE created_at > datetime('now', '-1 day')
      GROUP BY capsule_id
    `);
    console.log("Analytics aggregation completed");
  } catch (error3) {
    console.error("Analytics aggregation failed:", error3);
  }
}
__name(aggregateAnalytics, "aggregateAnalytics");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
