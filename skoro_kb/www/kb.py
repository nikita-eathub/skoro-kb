import frappe
from frappe import _
from frappe.sessions import get_csrf_token

from skoro_kb.permissions import can_edit


def get_context(context):
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.local.flags.redirect_location = "/login?redirect-to=/kb"
		raise frappe.Redirect

	context.no_cache = 1
	context.title = _("Knowledge Base")
	context.csrf_token = get_csrf_token()
	context.user_full_name = frappe.db.get_value("User", user, "full_name") or user
	context.can_edit = can_edit(user)
	return context
