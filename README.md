# FL_craftcms_2026

Craft CMS 5 project for the Florian Lechner portfolio site.

## Stack

- Craft CMS `^5.9`
- PHP `8.4` in local DDEV
- MySQL `8.0` in local DDEV
- Nginx + PHP-FPM via DDEV
- No `package.json` / front-end build step in this repo

## Local Development

### 1. Start Docker first

This project runs through DDEV, so Docker must be running before you start it.

If you see an error like:

```text
failed to connect to the docker API ... docker.sock ... no such file or directory
```

that means Docker Desktop / the Docker daemon is not running yet.

### 2. Start the project

```bash
ddev start
```

If dependencies are missing:

```bash
ddev composer install
```

### 3. Open the site

- Frontend: `https://fl-craftcms-2026.ddev.site`
- Craft control panel: `https://fl-craftcms-2026.ddev.site/admin`

You can also use:

```bash
ddev launch
```

## Where To Do What

### Content editing

Use the Craft control panel:

- `https://fl-craftcms-2026.ddev.site/admin`

That is where you:

- create and edit entries
- upload images/files
- manage sections, fields, globals, and assets

### Template editing

Main Twig templates live in:

- [templates](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/templates)

Typical work:

- page markup
- partials/layouts
- entry rendering

### Front-end styling

CSS lives in:

- [web/css](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/web/css)

### Front-end interactions

JavaScript lives in:

- [web/js](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/web/js)

### Craft project config

Project config lives in:

- [config/project](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/config/project)

That is where Craft stores:

- fields
- sections
- entry types
- asset volumes
- plugin settings

## Environment Files

This repo includes example env files:

- [.env.example.dev](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/.env.example.dev)
- [.env.example.staging](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/.env.example.staging)
- [.env.example.production](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/.env.example.production)

For local DDEV work, the project uses `.env` plus DDEV-provided environment variables.

## Database

Local development uses MySQL 8 through DDEV.

If you need to import a database backup:

```bash
ddev import-db --file=storage/backups/<backup-file>.sql
```

There are local SQL backups in:

- [storage/backups](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/storage/backups)

## Asset Handling

Current local development setup:

- Craft asset volume: `Project Media`
- Filesystem type: local
- Upload path: `web/uploads/projects`
- Transform path: `web/uploads/projects/transforms`

Important rule:

- customer-uploaded media is not source code
- generated transforms are not source code
- neither should be committed to Git

This is now enforced by:

- [.gitignore](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/.gitignore)
- [web/uploads/projects/.gitignore](/Users/szilvi/Desktop/develop/fl_craftCMS_2026/FL_craftcms_2026/web/uploads/projects/.gitignore)

## Delivery / Handoff

If this project is delivered clean to a customer, the correct separation is:

- code + templates + config in Git
- database content outside Git
- uploaded assets outside Git
- backups outside Git

That means a real deployment or migration needs all of these:

1. the repository
2. the environment variables
3. the database
4. the uploaded asset files

## Recommended Production Direction

For final hosting, it is better to keep assets separate from the codebase.

Recommended setup:

- app hosted on a PHP/Craft-capable platform
- database with automated backups
- asset volume on shared object storage such as S3-compatible storage

That keeps customer content independent from deployments and makes backup/restore much safer.

## Useful Commands

```bash
ddev start
ddev stop
ddev launch
ddev composer install
ddev php craft project-config/apply
ddev php craft clear-caches/all
```
