# elek.io Client

> A modern, offline-first content management system (CMS) and digital asset manager (DAM).

[![Version](https://img.shields.io/badge/version-0.3.2-blue.svg)](https://github.com/elek-io/client/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/elek-io/client)
[![License](https://img.shields.io/badge/license-todo-red.svg)](LICENSE)

> [!IMPORTANT]  
> elek.io Client is under active development and not yet ready for production usage! Feel free to check it out and make suggestions.

### Motivation

Traditional CMS solutions like WordPress need to be installed on a server, leading to costs for hosting it 24/7, security vulnerabilities by exposing the server to the internet, and the need to maintain / keep the server, database and CMS up to date.

elek.io Client solves these problems by being an offline-first desktop application that works entirely on your local machine, with optional remote synchronization.

### What Makes It Special

- **Offline-first**: Works entirely locally with optional remote synchronization
- **Cross-Platform**: Desktop apps for Windows, macOS, and Linux
- **Version Control**: Every Project is a Git repository with full version history
- **Easy backups & collaboration (optional)**: Synchronize to any Git hosting service (GitHub, GitLab, Bitbucket etc.) to work together with others and have a backup if needed
- **Multi-Language**: Built-in support for 25 languages
- **Structured Content**: Define custom content types (Collections) with field definitions
- **Developer-Friendly**: Local read-only OpenAPI REST API with optional typesafe TS/JS API Client generation and JSON file exports for programmatic access to your content e.g. to use with static site generators

## Installation

### Download

Download the latest version for your platform:

- **Windows**: [Download installer](https://github.com/elek-io/client/releases)
- **macOS**: [Download DMG](https://github.com/elek-io/client/releases)
- **Linux**: Download [AppImage](https://github.com/elek-io/client/releases) / [Snap](https://snapcraft.io/) / [DEB](https://github.com/elek-io/client/releases)

### System Requirements

Altough elek.io Client might run on older hard and software than listed below, the following is the recommended minimum:

- **Windows**: Windows 10 or later
- **macOS**: macOS 13.7.6 (Ventura) or later
- **Linux**: Ubuntu 22.04.5, or equivalent
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 500 MB for elek.io Client + space for your Projects

## For Developers

For insight on how elek.io Client works, please refer to the [documentation folder](documentation/overview.md).
