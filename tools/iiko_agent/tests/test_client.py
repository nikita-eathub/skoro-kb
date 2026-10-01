import hashlib
import json
import xml.etree.ElementTree as ET

import httpx
import pytest

from iiko_agent import server
from iiko_agent.client import IikoServerClient, ReadOnlyError


def make_client(handler, read_only=False):
	calls = []

	def wrapped(request: httpx.Request):
		calls.append(request)
		if request.url.path.endswith("/auth"):
			assert request.url.params["pass"] == hashlib.sha1(b"secret").hexdigest()
			return httpx.Response(200, text="token-123")
		if request.url.path.endswith("/logout"):
			return httpx.Response(200)
		assert request.url.params["key"] == "token-123"
		return handler(request)

	c = IikoServerClient(
		"https://skoro.iiko.it:443", "agent", "secret", read_only=read_only,
		transport=httpx.MockTransport(wrapped),
	)
	return c, calls


EMPLOYEES_XML = """<employees>
<employee><id>e1</id><code>101</code><name>Иванов Иван</name><cellPhone>+7900</cellPhone></employee>
<employee><id>e2</id><code>102</code><name>Петрова Анна</name></employee>
</employees>"""


def test_employees_parsed_and_logout_called():
	c, calls = make_client(lambda r: httpx.Response(200, text=EMPLOYEES_XML, headers={"content-type": "application/xml"}))
	rows = c.employees()
	assert [r["name"] for r in rows] == ["Иванов Иван", "Петрова Анна"]
	assert [r.url.path for r in calls] == ["/resto/api/auth", "/resto/api/employees", "/resto/api/logout"]


def test_logout_even_on_error():
	c, calls = make_client(lambda r: httpx.Response(500, text="boom"))
	with pytest.raises(Exception):
		c.employees()
	assert calls[-1].url.path.endswith("/logout")


def test_create_employee_sends_xml_put():
	seen = {}

	def handler(r):
		seen["method"], seen["path"], seen["body"] = r.method, r.url.path, r.content.decode()
		return httpx.Response(200, text="")

	c, _ = make_client(handler)
	c.create_employee({"id": "new-id", "name": "Сидоров", "rolesCodes": ["COOK", "CASH"], "employee": True})
	assert seen["method"] == "PUT" and seen["path"] == "/resto/api/employees/byId/new-id"
	root = ET.fromstring(seen["body"])
	assert root.findtext("name") == "Сидоров"
	assert [e.text for e in root.findall("rolesCodes")] == ["COOK", "CASH"]
	assert root.findtext("employee") == "true"


def test_update_product_merges_full_object():
	sent = {}

	def handler(r):
		if r.url.path.endswith("/products/list"):
			assert r.url.params.get_list("ids") == ["p1"]
			return httpx.Response(200, json=[{"id": "p1", "name": "Пепперони", "type": "DISH", "parent": "g1"}])
		sent.update(json.loads(r.content))
		return httpx.Response(200, json={"result": "SUCCESS"})

	c, _ = make_client(handler)
	c.update_product("p1", {"name": "Пепперони 30 см"})
	assert sent == {"id": "p1", "name": "Пепперони 30 см", "type": "DISH", "parent": "g1"}


def test_read_only_blocks_writes():
	c, calls = make_client(lambda r: httpx.Response(200), read_only=True)
	with pytest.raises(ReadOnlyError):
		c.save_menu_change({"items": []})
	assert calls == []


def test_price_order_preview_then_confirm(monkeypatch, tmp_path):
	posted = []

	def handler(r):
		posted.append(json.loads(r.content))
		return httpx.Response(200, json={"result": "SUCCESS", "response": {"id": "doc1"}})

	c, _ = make_client(handler)
	monkeypatch.setattr(server, "_client", c)
	monkeypatch.setenv("IIKO_AUDIT_LOG", str(tmp_path / "audit.jsonl"))
	items = [{"productId": "p1", "departmentId": "d1", "price": 599}]

	preview = server.create_price_order("2026-10-05", items)
	assert preview["preview"] and posted == []
	assert preview["payload"]["items"][0] == {"num": 1, "including": True, **items[0]}

	done = server.create_price_order("2026-10-05", items, confirm=True)
	assert done["done"] and posted[0]["dateIncoming"] == "2026-10-05"
	assert "create_price_order" in (tmp_path / "audit.jsonl").read_text(encoding="utf-8")
