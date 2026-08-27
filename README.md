# Skoro KB

Кастомное Frappe-приложение базы знаний «Скоро Пицца» (server-side: DocType'ы, API,
hooks). Разрабатывается и обкатывается на тестовом сайте **kb-test.sp-disk.ru**,
который поднят вторым сайтом на общем bench рядом с боевым `lms.sp-disk.ru`
(мультисайт по Host-заголовку, отдельная БД). Прод LMS этим приложением не затрагивается.

## Где живёт

- **Стенд:** `/opt/skoropizza/lms/` (compose-проект `lms`) на VPS 186.246.4.75.
- **Образ:** `frappe-lms:v2` собирается из frappe_docker с `apps.json`
  (frappe v16 + payments + lms + wiki + **skoro_kb**). Приложение попадает в образ
  на этапе сборки — просто добавить сюда репозиторий в `apps.json` и пересобрать.
- **Сайт разработки:** `kb-test.sp-disk.ru` (НЕ default, роутинг по Host).

## Установка на bench

Приложение доставляется в образ через `apps.json` (не `bench get-app` на живом
bench, т.к. `apps/` запечён в Docker-образ):

```jsonc
// /opt/skoropizza/lms/apps.json
{ "url": "https://github.com/nikita-eathub/skoro-kb", "branch": "main" }
```

Затем на сервере:

```bash
cd /opt/skoropizza/lms
# пересобрать образ (см. lms/README.md — контекст = корень frappe_docker, apps.json через --secret)
docker compose -p lms up -d --force-recreate backend queue-short queue-long scheduler websocket frontend
# установить ТОЛЬКО на тестовый сайт:
docker compose -p lms exec backend bench --site kb-test.sp-disk.ru install-app skoro_kb
```

## Разработка

- Миграции/установки — строго per-site: `bench --site kb-test.sp-disk.ru migrate`.
  **Никогда** не запускать `bench --site all migrate` или `bench migrate` без `--site`.
- Бэкап перед рискованной операцией:
  `bench --site kb-test.sp-disk.ru backup --with-files`.

`pre-commit` (ruff/eslint/prettier) настроен в `.pre-commit-config.yaml`.

## Лицензия

MIT
