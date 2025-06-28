import { PerformanceMetrics } from "./types";

/**
 * Performance monitoring utility for tracking function execution times
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private enabled: boolean = true;

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Measure the execution time of an async function
   */
  async measure<T>(
    operation: () => Promise<T>,
    name: string,
    context?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return await operation();
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      this.recordMetric(name, {
        duration: endTime - startTime,
        startTime,
        endTime,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        context,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(name, {
        duration: endTime - startTime,
        startTime,
        endTime,
        context: { ...context, error: true },
      });
      throw error;
    }
  }

  /**
   * Measure the execution time of a synchronous function
   */
  measureSync<T>(
    operation: () => T,
    name: string,
    context?: Record<string, any>
  ): T {
    if (!this.enabled) {
      return operation();
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = operation();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      this.recordMetric(name, {
        duration: endTime - startTime,
        startTime,
        endTime,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        context,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(name, {
        duration: endTime - startTime,
        startTime,
        endTime,
        context: { ...context, error: true },
      });
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  protected recordMetric(name: string, metric: PerformanceMetrics): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);
  }

  /**
   * Get performance metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetrics[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get summary statistics for an operation
   */
  getSummary(name: string): {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
    errorCount: number;
  } {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0,
        errorCount: 0,
      };
    }

    const durations = metrics.map((m) => m.duration);
    const errorCount = metrics.filter((m) => m.context?.error).length;

    return {
      count: metrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration: durations.reduce((a, b) => a + b, 0),
      errorCount,
    };
  }

  /**
   * Get all performance data
   */
  getAllMetrics(): Map<string, PerformanceMetrics[]> {
    return new Map(this.metrics);
  }

  /**
   * Clear all performance data
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Export performance data as JSON
   */
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      operations: Object.fromEntries(this.metrics),
      summaries: Object.fromEntries(
        Array.from(this.metrics.keys()).map((name) => [name, this.getSummary(name)])
      ),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Print performance summary to console
   */
  printSummary(): void {
    console.log("Performance Summary:");
    console.log("===================");

    for (const [name, metrics] of this.metrics) {
      const summary = this.getSummary(name);
      console.log(`\n${name}:`);
      console.log(`  Count: ${summary.count}`);
      console.log(`  Average: ${summary.averageDuration.toFixed(2)}ms`);
      console.log(`  Min: ${summary.minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${summary.maxDuration.toFixed(2)}ms`);
      console.log(`  Total: ${summary.totalDuration.toFixed(2)}ms`);
      console.log(`  Errors: ${summary.errorCount}`);
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const operationName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return await performanceMonitor.measure(
        () => method.apply(this, args),
        operationName,
        { args: args.length }
      );
    };

    return descriptor;
  };
}

/**
 * Utility function to measure performance of any operation
 */
export async function measurePerformanceTime<T>(
  operation: () => Promise<T>,
  name: string,
  context?: Record<string, any>
): Promise<T> {
  return await performanceMonitor.measure(operation, name, context);
}

/**
 * Utility function to measure performance of synchronous operations
 */
export function measurePerformanceTimeSync<T>(
  operation: () => T,
  name: string,
  context?: Record<string, any>
): T {
  return performanceMonitor.measureSync(operation, name, context);
}

/**
 * Performance thresholds for monitoring
 */
export const PERFORMANCE_THRESHOLDS = {
  SLOW_OPERATION: 1000, // 1 second
  VERY_SLOW_OPERATION: 5000, // 5 seconds
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Performance monitoring with automatic alerts
 */
export class PerformanceAlertMonitor extends PerformanceMonitor {
  private alerts: Array<{
    timestamp: string;
    operation: string;
    type: "slow" | "memory" | "error";
    details: any;
  }> = [];

  /**
   * Record a metric with automatic alerting
   */
  private recordMetricWithAlerts(name: string, metric: PerformanceMetrics): void {
    super.recordMetric(name, metric);

    // Check for slow operations
    if (metric.duration > PERFORMANCE_THRESHOLDS.SLOW_OPERATION) {
      this.alerts.push({
        timestamp: new Date().toISOString(),
        operation: name,
        type: "slow",
        details: {
          duration: metric.duration,
          threshold: PERFORMANCE_THRESHOLDS.SLOW_OPERATION,
        },
      });
    }

    // Check for memory usage
    if (metric.memoryUsage && metric.memoryUsage.heapUsed > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
      this.alerts.push({
        timestamp: new Date().toISOString(),
        operation: name,
        type: "memory",
        details: {
          memoryUsed: metric.memoryUsage.heapUsed,
          threshold: PERFORMANCE_THRESHOLDS.MEMORY_WARNING,
        },
      });
    }

    // Check for errors
    if (metric.context?.error) {
      this.alerts.push({
        timestamp: new Date().toISOString(),
        operation: name,
        type: "error",
        details: metric.context,
      });
    }
  }

  /**
   * Get all performance alerts
   */
  getAlerts(): Array<{
    timestamp: string;
    operation: string;
    type: "slow" | "memory" | "error";
    details: any;
  }> {
    return [...this.alerts];
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Print performance alerts
   */
  printAlerts(): void {
    if (this.alerts.length === 0) {
      console.log("No performance alerts");
      return;
    }

    console.log("Performance Alerts:");
    console.log("===================");

    for (const alert of this.alerts) {
      console.log(`\n[${alert.timestamp}] ${alert.operation} - ${alert.type.toUpperCase()}`);
      console.log(`Details:`, alert.details);
    }
  }
} 