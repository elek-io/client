# Developer Documentation

Welcome to the elek.io Client developer documentation. This guide will help you understand the codebase architecture and development patterns.

> [!NOTE]
> If your main interest is using Projects content inside your own applications, you can skip to the [Consuming Content Locally](./consuming-content-locally.md) section.

## Prerequisites

- Familiarity with TypeScript and React
- Basic understanding of Electron architecture
- Knowledge of React Hook Form and TanStack Query (helpful but not required)
- Understanding of Git and version control concepts

## Getting Started

**Start with [Overview](./overview.md)** to understand the application architecture, security model, and how the different processes communicate.

Then proceed to the specific topics based on your interests or contribution goals:

- **[Loading and Updating Data](./renderer/loading-and-updating-data.md)** - TanStack Query patterns for data fetching and mutations
- **[Dynamic Form Generation](./renderer/dynamic-form-field-generation.md)** - How user-defined forms work with field definitions
- **[Breadcrumb Navigation](./renderer/breadcrumb-navigation.md)** - Route-based breadcrumb system for hierarchical navigation

## Contributing

When updating these docs:

- Keep code examples up-to-date with actual implementation
- Include file references with line numbers where relevant
- Add practical examples for complex concepts
- Update the "Last Updated" date at the bottom of each document

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form Documentation](https://react-hook-form.com/get-started)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [@elek-io/core Repository](https://github.com/elek-io/core)

---

**Last Updated:** 2025-12-04
