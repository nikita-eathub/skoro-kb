"""MCP-сервер «Скоро Пицца × iiko»: инструменты для работы с iiko Server через Claude.

Запуск: python -m iiko_agent.server  (stdio-транспорт, подключается в Claude Code / Claude Desktop).

Любая запись (создание/изменение/удаление) выполняется в два шага:
сначала вызов без confirm=True возвращает превью того, что уйдёт в iiko,
затем тот же вызов с confirm=True отправляет изменения. Все записи пишутся
в журнал IIKO_AUDIT_LOG (по умолчанию ./iiko_audit.jsonl).
"""

from __future__ import annotations

import json
import os
from datetime import date, datetime
from typing import Any

from mcp.server.fastmcp import FastMCP

from iiko_agent.client import IikoServerClient

mcp = FastMCP(
	"skoro-iiko",
	instructions=(
		"Ты — рабочий агент «Скоро Пиццы» в iiko. Перед любым изменением сначала вызывай "
		"инструмент без confirm, покажи пользователю превью и только после явного согласия "
		"повторяй вызов с confirm=True. Идентификаторы (сотрудников, блюд, подразделений) "
		"всегда бери из ответов iiko, не придумывай. Даты — в формате YYYY-MM-DD."
	),
)

_client: IikoServerClient | None = None


def client() -> IikoServerClient:
	global _client
	if _client is None:
		_client = IikoServerClient.from_env()
	return _client


def _audit(action: str, payload: Any, result: Any) -> None:
	path = os.environ.get("IIKO_AUDIT_LOG", "iiko_audit.jsonl")
	record = {"ts": datetime.now().isoformat(timespec="seconds"), "action": action, "payload": payload}
	record["result"] = result if isinstance(result, (dict, list, str, type(None))) else str(result)
	with open(path, "a", encoding="utf-8") as fh:
		fh.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")


def _write(action: str, payload: Any, confirm: bool, call) -> Any:
	if not confirm:
		return {
			"preview": True,
			"action": action,
			"payload": payload,
			"note": "Ничего не отправлено. Покажи пользователю и повтори с confirm=True после согласия.",
		}
	result = call()
	_audit(action, payload, result)
	return {"done": True, "action": action, "result": result}


def _match(text: str | None, query: str | None) -> bool:
	return not query or (text or "").lower().find(query.lower()) >= 0


# ------------------------------------------------------------- справочники


@mcp.tool()
def list_departments() -> Any:
	"""Подразделения (пиццерии), склады и юрлица корпорации iiko: id, код, название."""
	return client().departments()


@mcp.tool()
def list_stores() -> Any:
	"""Склады корпорации iiko."""
	return client().stores()


# ------------------------------------------------------------- сотрудники


@mcp.tool()
def list_employees(search: str | None = None, include_deleted: bool = False, limit: int = 200) -> list[dict]:
	"""Карточки сотрудников. search — подстрока ФИО, телефона или табельного кода."""
	rows = client().employees(include_deleted)
	rows = [
		r
		for r in rows
		if _match(" ".join(str(r.get(k) or "") for k in ("name", "code", "phone", "cellPhone")), search)
	]
	return rows[:limit]


@mcp.tool()
def get_employee(employee_id: str) -> dict:
	"""Полная карточка сотрудника по id (GUID)."""
	return client().employee(employee_id)


@mcp.tool()
def list_roles() -> list[dict]:
	"""Должности (роли) сотрудников: code нужен для mainRoleCode / rolesCodes."""
	return client().roles()


@mcp.tool()
def create_employee(fields: dict, confirm: bool = False) -> Any:
	"""Создать карточку сотрудника.

	fields — поля карточки iiko, например: name (ФИО целиком), firstName, middleName, lastName,
	code (табельный), mainRoleCode, rolesCodes (список), departmentCodes (список),
	responsibilityDepartmentCodes, phone, cellPhone, email, birthday (YYYY-MM-DD),
	hireDate, hireDocumentNumber, note, pinCode, employee=true.
	"""
	return _write("create_employee", fields, confirm, lambda: client().create_employee(fields))


@mcp.tool()
def update_employee(employee_id: str, changes: dict, confirm: bool = False) -> Any:
	"""Изменить карточку сотрудника — передаются только изменяемые поля.
	Увольнение: {"fireDate": "YYYY-MM-DD"}; удаление карточки: {"deleted": true}."""
	return _write(
		"update_employee",
		{"id": employee_id, "changes": changes},
		confirm,
		lambda: client().update_employee(employee_id, changes),
	)


# ------------------------------------------------------------- блюда и номенклатура


@mcp.tool()
def list_products(
	search: str | None = None,
	types: list[str] | None = None,
	group_id: str | None = None,
	include_deleted: bool = False,
	limit: int = 300,
) -> list[dict]:
	"""Выгрузка номенклатуры. types: DISH (блюдо), GOODS (товар), PREPARED (заготовка),
	MODIFIER, SERVICE. search — подстрока названия или артикула. group_id — фильтр по папке."""
	rows = client().products(types=types, include_deleted=include_deleted) or []
	rows = [
		r
		for r in rows
		if _match(f"{r.get('name')} {r.get('num')} {r.get('code')}", search)
		and (not group_id or r.get("parent") == group_id)
	]
	return rows[:limit]


@mcp.tool()
def get_product(product_id: str) -> dict | None:
	"""Полная карточка блюда/товара по id."""
	rows = client().products(ids=[product_id], include_deleted=True) or []
	return rows[0] if rows else None


@mcp.tool()
def list_product_groups(include_deleted: bool = False) -> Any:
	"""Папки (группы) номенклатуры: id используется как parent у блюд."""
	return client().product_groups(include_deleted)


@mcp.tool()
def export_products_csv(path: str, types: list[str] | None = None) -> dict:
	"""Выгрузить номенклатуру в CSV-файл (по умолчанию только блюда)."""
	import csv

	rows = client().products(types=types or ["DISH"]) or []
	columns = ["id", "num", "code", "name", "type", "parent", "mainUnit", "defaultSalePrice", "deleted"]
	with open(path, "w", newline="", encoding="utf-8-sig") as fh:
		writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="ignore", delimiter=";")
		writer.writeheader()
		writer.writerows(rows)
	return {"path": os.path.abspath(path), "rows": len(rows)}


@mcp.tool()
def create_product(product: dict, confirm: bool = False) -> Any:
	"""Создать блюдо/товар. Минимум: name, type (DISH/GOODS/...), mainUnit (id ед. изм.),
	parent (id папки). Подсмотри формат у похожей позиции через get_product."""
	return _write("create_product", product, confirm, lambda: client().create_product(product))


@mcp.tool()
def update_product(product_id: str, changes: dict, confirm: bool = False) -> Any:
	"""Изменить блюдо/товар: changes накладываются на текущую карточку (name, description,
	parent, defaultSalePrice, fastCode, excludedSections и т.д.).
	Цены в точках меняются не здесь, а приказом — create_price_order."""
	return _write(
		"update_product",
		{"id": product_id, "changes": changes},
		confirm,
		lambda: client().update_product(product_id, changes),
	)


@mcp.tool()
def delete_products(product_ids: list[str], confirm: bool = False) -> Any:
	"""Пометить позиции номенклатуры удалёнными (восстанавливаются restore_products)."""
	return _write("delete_products", product_ids, confirm, lambda: client().delete_products(product_ids))


@mcp.tool()
def restore_products(product_ids: list[str], confirm: bool = False) -> Any:
	"""Восстановить удалённые позиции номенклатуры."""
	return _write("restore_products", product_ids, confirm, lambda: client().restore_products(product_ids))


@mcp.tool()
def list_assembly_charts(date_from: str, date_to: str | None = None) -> Any:
	"""Технологические карты, действующие в периоде."""
	return client().assembly_charts(date_from, date_to)


# ------------------------------------------------------------- цены и приказы


@mcp.tool()
def get_prices(date_from: str | None = None, date_to: str | None = None, department_id: str | None = None):
	"""Действующие цены блюд по подразделениям (результат проведённых приказов)."""
	return client().prices(date_from or date.today().isoformat(), date_to, department_id)


@mcp.tool()
def list_price_orders(date_from: str, date_to: str) -> Any:
	"""Приказы об изменении прейскуранта за период."""
	return client().menu_changes(date_from, date_to)


@mcp.tool()
def get_price_order(document_id: str) -> Any:
	"""Приказ об изменении прейскуранта по id."""
	return client().menu_change(document_id)


@mcp.tool()
def create_price_order(
	date_incoming: str,
	items: list[dict],
	comment: str | None = None,
	status: str = "NEW",
	confirm: bool = False,
) -> Any:
	"""Создать приказ об изменении прейскуранта.

	date_incoming — дата вступления в силу (YYYY-MM-DD).
	items — строки: {"productId", "departmentId", "price", "including": true,
	  "productSizeId"?: для пиццы разных размеров}. including=false — убрать из меню точки.
	status — NEW (черновик, по умолчанию) или PROCESSED (сразу провести).
	"""
	document = {
		"dateIncoming": date_incoming,
		"status": status,
		"comment": comment,
		"items": [{"num": i + 1, "including": True, **item} for i, item in enumerate(items)],
	}
	return _write("create_price_order", document, confirm, lambda: client().save_menu_change(document))


@mcp.tool()
def update_price_order(document: dict, confirm: bool = False) -> Any:
	"""Изменить/провести существующий приказ: передать документ целиком (взять из
	get_price_order, поправить, например status=PROCESSED) — с полем id."""
	return _write("update_price_order", document, confirm, lambda: client().save_menu_change(document))


# ------------------------------------------------------------- всё остальное


@mcp.tool()
def iiko_api_request(
	method: str,
	path: str,
	params: dict | None = None,
	json_body: Any = None,
	xml_body: str | None = None,
	confirm: bool = False,
) -> Any:
	"""Произвольный запрос к iiko Server API (resto/api) для задач без отдельного инструмента:
	отчёты (/v2/reports/olap), накладные (/documents/import/incomingInvoice), инвентаризации,
	поставщики (/suppliers), смены и т.д. path — относительно /resto/api, напр. "/suppliers".
	Ключ авторизации подставляется автоматически. Не-GET запросы требуют confirm=True."""
	call = lambda: client().request(method, path, params=params, json=json_body, xml=xml_body)  # noqa: E731
	if method.upper() == "GET":
		return call()
	payload = {"method": method, "path": path, "params": params, "json": json_body, "xml": xml_body}
	return _write("iiko_api_request", payload, confirm, call)


def main() -> None:
	mcp.run()


if __name__ == "__main__":
	main()
