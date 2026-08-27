# Skoro KB

Кастомное Frappe-приложение базы знаний «Скоро Пицца»: структура статей,
редактор, права чтения, просмотры, оценки и комментарии. Первый запуск —
только на **kb-test.sp-disk.ru**. Боевой `lms.sp-disk.ru` не должен переключаться на тестовый
образ.

## Где живёт

- **Стенд:** `/opt/skoropizza/lms/` (compose-проект `lms`) на VPS 186.246.4.75.
- **Образ:** собирается тем же пайплайном, что и LMS; приложение добавляется в `apps.json`.
- **Тестовый сайт:** `kb-test.sp-disk.ru` (не default; отдельная база данных). Его фактическое
  создание и доступность нужно проверить перед установкой.

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
# сначала собрать отдельный образ-кандидат и проверить наличие skoro_kb внутри
# затем установить ТОЛЬКО на тестовый сайт:
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
