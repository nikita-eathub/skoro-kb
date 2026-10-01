"""Клиент iiko Server API (resto API) для «Скоро Пиццы».

Каждый вызов берёт токен через /auth и в конце обязательно делает /logout:
сессия iiko Server занимает лицензию, «забытые» токены блокируют вход другим
интеграциям и сотрудникам.
"""

from __future__ import annotations

import hashlib
import os
import uuid
import xml.etree.ElementTree as ET
from contextlib import contextmanager
from typing import Any

import httpx


class IikoError(RuntimeError):
	pass


class ReadOnlyError(IikoError):
	pass


# ---------------------------------------------------------------- XML helpers


def xml_to_obj(elem: ET.Element) -> Any:
	"""Преобразует XML-ответ iiko в dict/list/str."""
	children = list(elem)
	if not children:
		return elem.text
	result: dict[str, Any] = {}
	for child in children:
		value = xml_to_obj(child)
		if child.tag in result:
			if not isinstance(result[child.tag], list):
				result[child.tag] = [result[child.tag]]
			result[child.tag].append(value)
		else:
			result[child.tag] = value
	return result


def obj_to_xml(tag: str, value: Any) -> ET.Element:
	"""Строит XML-элемент из dict. Список -> повторяющиеся теги с тем же именем."""
	elem = ET.Element(tag)
	if isinstance(value, dict):
		for key, val in value.items():
			if isinstance(val, list):
				for item in val:
					elem.append(obj_to_xml(key, item))
			elif val is not None:
				elem.append(obj_to_xml(key, val))
	elif isinstance(value, bool):
		elem.text = "true" if value else "false"
	elif value is not None:
		elem.text = str(value)
	return elem


def parse_body(response: httpx.Response) -> Any:
	text = response.text
	if not text.strip():
		return None
	ctype = response.headers.get("content-type", "")
	if "json" in ctype or text.lstrip()[:1] in "[{":
		try:
			return response.json()
		except ValueError:
			pass
	if text.lstrip().startswith("<"):
		try:
			root = ET.fromstring(text)
		except ET.ParseError:
			return text
		return {root.tag: xml_to_obj(root)}
	return text


def as_list(value: Any) -> list:
	if value is None:
		return []
	return value if isinstance(value, list) else [value]


# ---------------------------------------------------------------- client


class IikoServerClient:
	def __init__(
		self,
		base_url: str,
		login: str,
		password: str,
		*,
		read_only: bool = False,
		timeout: float = 60.0,
		transport: httpx.BaseTransport | None = None,
	):
		base_url = base_url.rstrip("/")
		if not base_url.endswith("/resto/api"):
			base_url += "/resto/api"
		self.base_url = base_url
		self.login = login
		self._pass_hash = hashlib.sha1(password.encode()).hexdigest()
		self.read_only = read_only
		self._http = httpx.Client(base_url=base_url, timeout=timeout, transport=transport)

	@classmethod
	def from_env(cls) -> IikoServerClient:
		missing = [k for k in ("IIKO_SERVER_URL", "IIKO_LOGIN", "IIKO_PASSWORD") if not os.environ.get(k)]
		if missing:
			raise IikoError(f"Не заданы переменные окружения: {', '.join(missing)}")
		return cls(
			os.environ["IIKO_SERVER_URL"],
			os.environ["IIKO_LOGIN"],
			os.environ["IIKO_PASSWORD"],
			read_only=os.environ.get("IIKO_READ_ONLY", "").lower() in ("1", "true", "yes"),
		)

	# -- session

	@contextmanager
	def session(self):
		r = self._http.get("/auth", params={"login": self.login, "pass": self._pass_hash})
		if r.status_code != 200:
			raise IikoError(f"Авторизация в iiko не удалась ({r.status_code}): {r.text[:300]}")
		token = r.text.strip().strip('"')
		try:
			yield token
		finally:
			try:
				self._http.get("/logout", params={"key": token})
			except httpx.HTTPError:
				pass

	def request(
		self,
		method: str,
		path: str,
		*,
		params: dict | None = None,
		json: Any = None,
		xml: str | None = None,
	) -> Any:
		method = method.upper()
		if method != "GET" and self.read_only:
			raise ReadOnlyError("Агент запущен в режиме только чтения (IIKO_READ_ONLY=1).")
		path = "/" + path.lstrip("/")
		if path.startswith("/resto/api/"):
			path = path[len("/resto/api") :]
		with self.session() as token:
			query = {k: v for k, v in (params or {}).items() if v is not None}
			query["key"] = token
			kwargs: dict[str, Any] = {"params": query}
			if json is not None:
				kwargs["json"] = json
			elif xml is not None:
				kwargs["content"] = xml.encode()
				kwargs["headers"] = {"Content-Type": "application/xml"}
			r = self._http.request(method, path, **kwargs)
		if r.status_code >= 400:
			raise IikoError(f"iiko {method} {path} -> {r.status_code}: {r.text[:1000]}")
		return parse_body(r)

	# -- корпорация

	def departments(self) -> Any:
		return self.request("GET", "/corporation/departments")

	def stores(self) -> Any:
		return self.request("GET", "/corporation/stores")

	# -- сотрудники

	def employees(self, include_deleted: bool = False) -> list[dict]:
		data = self.request("GET", "/employees", params={"includeDeleted": str(include_deleted).lower()})
		return as_list((data or {}).get("employees", {}).get("employee") if isinstance(data, dict) else None)

	def employee(self, employee_id: str) -> dict:
		data = self.request("GET", f"/employees/byId/{employee_id}")
		return (data or {}).get("employee", data)

	def roles(self) -> list[dict]:
		data = self.request("GET", "/employees/roles")
		return as_list((data or {}).get("employeeRoles", {}).get("role") if isinstance(data, dict) else None)

	def create_employee(self, fields: dict) -> dict:
		employee_id = fields.get("id") or str(uuid.uuid4())
		body = {"id": employee_id, **{k: v for k, v in fields.items() if k != "id"}}
		xml = ET.tostring(obj_to_xml("employee", body), encoding="unicode")
		data = self.request("PUT", f"/employees/byId/{employee_id}", xml=xml)
		return (data or {}).get("employee", data) if isinstance(data, dict) else {"id": employee_id}

	def update_employee(self, employee_id: str, fields: dict) -> dict:
		"""Частичное редактирование: передаются только изменяемые поля."""
		body = {"id": employee_id, **{k: v for k, v in fields.items() if k != "id"}}
		xml = ET.tostring(obj_to_xml("employee", body), encoding="unicode")
		data = self.request("POST", f"/employees/byId/{employee_id}", xml=xml)
		return (data or {}).get("employee", data) if isinstance(data, dict) else {"id": employee_id}

	# -- номенклатура (блюда, товары, модификаторы)

	def products(self, types: list[str] | None = None, ids: list[str] | None = None, include_deleted=False):
		params: dict[str, Any] = {"includeDeleted": str(include_deleted).lower()}
		if types:
			params["types"] = types
		if ids:
			params["ids"] = ids
		return self.request("GET", "/v2/entities/products/list", params=params)

	def product_groups(self, include_deleted: bool = False):
		return self.request(
			"GET", "/v2/entities/products/group/list", params={"includeDeleted": str(include_deleted).lower()}
		)

	def create_product(self, product: dict, generate_nomenclature_code: bool = True):
		return self.request(
			"POST",
			"/v2/entities/products/save",
			params={"generateNomenclatureCode": str(generate_nomenclature_code).lower()},
			json=product,
		)

	def update_product(self, product_id: str, changes: dict):
		"""iiko требует полный объект при update — берём текущий и накладываем изменения."""
		current = self.products(ids=[product_id], include_deleted=True)
		if not current:
			raise IikoError(f"Номенклатура {product_id} не найдена")
		merged = {**current[0], **changes, "id": product_id}
		return self.request(
			"POST",
			"/v2/entities/products/update",
			params={"overrideFastCode": "true", "overrideNomenclatureCode": "true"},
			json=merged,
		)

	def delete_products(self, product_ids: list[str]):
		return self.request(
			"POST", "/v2/entities/products/delete", json={"items": [{"id": i} for i in product_ids]}
		)

	def restore_products(self, product_ids: list[str]):
		return self.request(
			"POST", "/v2/entities/products/restore", json={"items": [{"id": i} for i in product_ids]}
		)

	def assembly_charts(self, date_from: str, date_to: str | None = None):
		return self.request(
			"GET", "/v2/assemblyCharts/getAll", params={"dateFrom": date_from, "dateTo": date_to}
		)

	# -- цены и приказы об изменении прейскуранта

	def prices(self, date_from: str, date_to: str | None = None, department_id: str | None = None):
		return self.request(
			"GET",
			"/v2/price",
			params={"dateFrom": date_from, "dateTo": date_to, "departmentId": department_id},
		)

	def menu_changes(self, date_from: str, date_to: str):
		return self.request(
			"GET", "/v2/documents/menuChange", params={"dateFrom": date_from, "dateTo": date_to}
		)

	def menu_change(self, document_id: str):
		return self.request("GET", "/v2/documents/menuChange/byId", params={"id": document_id})

	def save_menu_change(self, document: dict):
		"""Создание (без id) или изменение (с id) приказа."""
		return self.request("POST", "/v2/documents/menuChange", json=document)
