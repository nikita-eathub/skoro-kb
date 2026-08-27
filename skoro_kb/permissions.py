import frappe


EDITOR_ROLES = {"KB Editor", "KB Manager", "System Manager"}
MANAGER_ROLES = {"KB Manager", "System Manager"}
SCOPE_ROLES = {
	"UK Only": "KB UK Reader",
	"Franchise Only": "KB Franchise Reader",
}


def require_login() -> str:
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw("Authentication required.", frappe.AuthenticationError)
	return user


def can_edit(user: str | None = None) -> bool:
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	return bool(EDITOR_ROLES.intersection(frappe.get_roles(user)))


def can_manage(user: str | None = None) -> bool:
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	return bool(MANAGER_ROLES.intersection(frappe.get_roles(user)))


def can_read_article(article, user: str | None = None) -> bool:
	user = user or require_login()
	if can_edit(user):
		return True
	if article.get("status") != "Published":
		return False
	access_scope = article.get("access_scope") or "All Employees"
	if access_scope == "All Employees":
		return True
	required_role = SCOPE_ROLES.get(access_scope)
	return bool(required_role and required_role in frappe.get_roles(user))


def article_query(user: str | None = None) -> str | None:
	user = user or frappe.session.user
	if can_edit(user):
		return None
	return "1=0"


def article_has_permission(doc, user: str | None = None, permission_type: str | None = None):
	user = user or frappe.session.user
	if permission_type in {"write", "create", "delete", "submit", "cancel"}:
		return can_edit(user)
	return can_read_article(doc, user)
