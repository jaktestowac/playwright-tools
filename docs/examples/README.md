# 📝 Examples

This directory contains practical examples demonstrating how to use `playwright-tools` in real-world scenarios.

## 📁 Available Examples

### [Network Monitoring Examples](./network-monitoring-examples.ts)

Comprehensive examples of network monitoring functionality:

- **Basic Network Monitoring** - Monitor all network activity during page navigation
- **API Performance Testing** - Analyze API call performance and identify slow requests
- **User Journey Network Analysis** - Track network activity during complete user workflows
- **Error Detection and Analysis** - Focus on network failures and error responses
- **Real-time Network Monitoring** - Monitor network activity in real-time during test execution
- **Performance Regression Testing** - Compare network performance against baseline metrics
- **Data Export and Reporting** - Export network data for external analysis

## 🚀 How to Use Examples

1. **Copy the example code** into your test files
2. **Adapt the selectors and URLs** to match your application
3. **Modify the configuration options** based on your needs
4. **Run the examples** with your Playwright test runner

### Example Usage

```typescript
import { basicNetworkMonitoring } from './docs/examples/network-monitoring-examples';

test('Monitor network during login', async ({ page }) => {
  const report = await basicNetworkMonitoring(page);
  
  // Assert on network metrics
  expect(report.summary.totalRequests).toBeGreaterThan(0);
  expect(report.summary.failedRequests).toBe(0);
});
```

## 📚 Related Documentation

- **[Network Monitoring Documentation](../network-monitoring.md)** - Complete API reference
- **[Best Practices](../best-practices.md)** - Recommended patterns
- **[Migration Guide](../migration-guide.md)** - From raw Playwright

## 🤝 Contributing Examples

We welcome contributions! To add new examples:

1. Create a new TypeScript file in this directory
2. Include comprehensive comments explaining the example
3. Add a description to this README
4. Follow the existing code style and patterns

## 🔗 Quick Links

- **[Main Documentation](../README.md)**
- **[API Reference](../README.md#quick-navigation)**
- **[GitHub Repository](https://github.com/jaktestowac/playwright-tools)**

---

**Need help?** Join our [Discord Community](https://discord.gg/mUAqQ7FUaZ) or visit [jaktestowac.pl](https://jaktestowac.pl) 