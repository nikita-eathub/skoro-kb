import re

import frappe


def make_slug(value: str | None, prefix: str) -> str:
	base = re.sub(r"[^\w-]+", "-", (value or "").strip().lower(), flags=re.UNICODE).strip("-")
	base = base[:100] or f"{prefix}-{frappe.generate_hash(length=8).lower()}"
	name = base
	counter = 2
	while frappe.db.exists(prefix, name):
		name = f"{base[:92]}-{counter}"
		counter += 1
	return name
