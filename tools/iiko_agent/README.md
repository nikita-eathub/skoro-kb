# Скоро Пицца × iiko — рабочий агент

MCP-сервер, через который Claude (Claude Code / Claude Desktop) работает с **iiko Server API**
(`/resto/api`) от имени служебной учётки: карточки сотрудников, номенклатура, приказы об
изменении прейскуранта и любые другие методы API.

## Что умеет

| Задача | Инструменты |
|---|---|
| Сотрудники | `list_employees`, `get_employee`, `list_roles`, `create_employee`, `update_employee` |
| Блюда и номенклатура | `list_products`, `get_product`, `list_product_groups`, `export_products_csv`, `create_product`, `update_product`, `delete_products`, `restore_products`, `list_assembly_charts` |
| Цены и приказы | `get_prices`, `list_price_orders`, `get_price_order`, `create_price_order`, `update_price_order` |
| Справочники | `list_departments`, `list_stores` |
| Всё остальное | `iiko_api_request` — любой метод resto API (OLAP-отчёты, накладные, поставщики…) |

## Защита
- **Двухшаговая запись:** любое изменение сначала возвращает превью и ничего не отправляет;
  в iiko уходит только повторный вызов с `confirm=True`.
- **Журнал:** все выполненные изменения пишутся в `IIKO_AUDIT_LOG` (JSONL).
- **Только чтение:** `IIKO_READ_ONLY=1` запрещает любые не-GET запросы.
- **Лицензии:** на каждый вызов берётся токен и всегда делается `/logout`, чтобы
  агент не держал лицензионные слоты iiko.
- Приказы по умолчанию создаются черновиком (`status=NEW`) — проводит человек или
  отдельный вызов с `PROCESSED`.

## Установка

```bash
cd tools/iiko_agent
pip install -e .
cp .env.example .env   # заполнить URL сервера iiko и служебную учётку
```

В iikoOffice заведите отдельного пользователя под агента (не личный логин) с правами на
сотрудников, номенклатуру и приказы.

### Подключение к Claude Code

```bash
claude mcp add skoro-iiko \
  -e IIKO_SERVER_URL=https://<сервер>.iiko.it:443 \
  -e IIKO_LOGIN=<логин> -e IIKO_PASSWORD=<пароль> \
  -- skoro-iiko-agent
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "skoro-iiko": {
      "command": "skoro-iiko-agent",
      "env": {
        "IIKO_SERVER_URL": "https://<сервер>.iiko.it:443",
        "IIKO_LOGIN": "<логин>",
        "IIKO_PASSWORD": "<пароль>"
      }
    }
  }
}
```

## Примеры запросов агенту
- «Заведи нового повара Сидорова Петра, тел. +7…, в пиццерию на Ленина, дата приёма сегодня».
- «Выгрузи все блюда в CSV».
- «Переименуй „Пепперони 30“ в „Пепперони 30 см“ и обнови описание».
- «Сделай приказ: с 5 октября Маргарита 30 см — 599 ₽ во всех точках».

## Тесты

```bash
pip install -e '.[test]' && pytest -q
```

Тесты работают на подменённом HTTP и не обращаются к реальному iiko.
