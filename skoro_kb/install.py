import frappe
from frappe.utils import now_datetime


ROLES = {
	"KB Manager": 1,
	"KB Editor": 1,
	"KB UK Reader": 0,
	"KB Franchise Reader": 0,
}

SECTIONS = [
	("Работа в пиццерии", 10, "All Employees"),
	("Управляющая компания", 20, "UK Only"),
	("Обучение", 30, "All Employees"),
	("Франчайзи", 40, "Franchise Only"),
]


def _ensure_roles():
	for role_name, desk_access in ROLES.items():
		if frappe.db.exists("Role", role_name):
			frappe.db.set_value("Role", role_name, "desk_access", desk_access)
			continue
		frappe.get_doc(
			{
				"doctype": "Role",
				"role_name": role_name,
				"desk_access": desk_access,
				"is_custom": 0,
			}
		).insert(ignore_permissions=True)


def _ensure_sections():
	for title, sort_order, access_scope in SECTIONS:
		if frappe.db.exists("KB Section", {"title": title}):
			continue
		frappe.get_doc(
			{
				"doctype": "KB Section",
				"title": title,
				"sort_order": sort_order,
				"access_scope": access_scope,
				"is_active": 1,
			}
		).insert(ignore_permissions=True)


def _ensure_demo_article():
	title = "Как принять поставку без ошибок"
	if frappe.db.exists("KB Article", {"title": title}):
		return
	section = frappe.db.get_value("KB Section", {"title": "Работа в пиццерии"}, "name")
	frappe.get_doc(
		{
			"doctype": "KB Article",
			"title": title,
			"status": "Published",
			"version": "1.0",
			"section": section,
			"access_scope": "All Employees",
			"intro": "Короткая инструкция для сотрудников, которые принимают поставку и фиксируют возможные расхождения.",
			"content": (
				"<p>Перед приёмкой подготовьте место для проверки товара и откройте документы поставки.</p>"
				'<div class="editor-callout callout-info"><span class="callout-icon">i</span>'
				'<div class="callout-content"><strong>Информация</strong><p>Сначала сверьте номер поставки и перечень документов.</p></div></div>'
				"<h2>Проверьте товар до подтверждения</h2>"
				'<p>Сверяйте фактическое количество, внешний вид и сроки годности с документами. <span style="background-color:#fff0a8">Все расхождения фиксируйте</span> до завершения приёмки.</p>'
				'<div class="editor-callout callout-danger"><span class="callout-icon">×</span>'
				'<div class="callout-content"><strong>Критично</strong><p>Не подтверждайте приёмку, пока расхождения не зафиксированы по установленному процессу.</p></div></div>'
				"<h2>Чек-лист приёмки</h2>"
				'<ul class="check-list"><li>Сверить количество</li><li>Проверить целостность упаковки</li><li>Проверить сроки годности</li><li>Зафиксировать расхождения</li></ul>'
			),
			"expert_name": "Маргарита Стекольникова",
			"expert_role": "Руководитель отдела качества",
			"publication_date": now_datetime(),
			"published_by": "Administrator",
			"related_material": "Курс «Приёмка и хранение товара»",
			"allow_comments": 1,
		}
	).insert(ignore_permissions=True)


def after_install():
	_ensure_roles()
	_ensure_sections()
	_ensure_demo_article()


def after_migrate():
	_ensure_roles()
	_ensure_sections()
