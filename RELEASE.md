# Release Guide

This project is ready to distribute as a GitHub Release asset or as an npm package.

## Create a Local Release Tarball

```bash
npm ci
npm run lint
npm run build
npm pack
```

This creates `react-earth-lite-0.1.0.tgz`. Users can install that tarball directly:

```bash
npm install ./react-earth-lite-0.1.0.tgz
```

## Publish a GitHub Release

1. Commit the source changes.
2. Push the repository to GitHub.
3. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The release workflow builds the package, runs lint, creates `react-earth-lite-0.1.0.tgz`, and attaches it to the GitHub Release.

Users can then install from the release asset:

```bash
npm install https://github.com/OWNER/REPO/releases/download/v0.1.0/react-earth-lite-0.1.0.tgz
```

Or install from the tagged Git repository:

```bash
npm install github:OWNER/REPO#v0.1.0
```

Replace `OWNER/REPO` with the actual GitHub repository.
