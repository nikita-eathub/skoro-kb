import hashlib

import frappe
from frappe import _
from frappe.utils import cint, now_datetime, strip_html_tags

from skoro_kb.permissions import can_edit, can_read_article, require_login


ARTICLE_FIELDS = [
	"name",
	"title",
	"slug",
	"status",
	"version",
	"section",
	"parent_article",
	"access_scope",
	"intro",
	"content",
	"expert_name",
	"expert_role",
	"expert_photo",
	"publication_date",
	"published_by",
	"related_material",
	"allow_comments",
	"modified",
]


def _key(article: str, user: str) -> str:
	return hashlib.sha256(f"{article}\0{user}".encode()).hexdigest()


def _article(name: str):
	if not name or not frappe.db.exists("KB Article", name):
		frappe.throw(_("Article not found."), frappe.DoesNotExistError)
	doc = frappe.get_doc("KB Article", name)
	if not can_read_article(doc):
		frappe.throw(_("You do not have access to this article."), frappe.PermissionError)
	return doc


def _serialize_article(doc) -> dict:
	return {field: doc.get(field) for field in ARTICLE_FIELDS}


def _full_names(users: list[str]) -> dict[str, str]:
	unique_users = sorted(set(filter(None, users)))
	if not unique_users:
		return {}
	rows = frappe.get_all(
		"User",
		filters={"name": ["in", unique_users]},
		fields=["name", "full_name"],
		limit_page_length=0,
	)
	return {row.name: row.full_name or row.name for row in rows}


@frappe.whitelist()
def get_bootstrap():
	user = require_login()
	rows = frappe.get_all(
		"KB Article",
		fields=[
			"name",
			"title",
			"status",
			"section",
			"parent_article",
			"access_scope",
			"expert_name",
			"publication_date",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=0,
	)
	articles = [dict(row) for row in rows if can_read_article(row, user)]
	sections = frappe.get_all(
		"KB Section",
		filters={"is_active": 1},
		fields=["name", "title", "parent_section", "sort_order", "access_scope"],
		order_by="sort_order asc, title asc",
		limit_page_length=0,
	)
	visible_sections = [
		dict(row)
		for row in sections
		if can_edit(user)
		or can_read_article({"status": "Published", "access_scope": row.access_scope}, user)
	]
	return {
		"user": {
			"name": user,
			"full_name": frappe.db.get_value("User", user, "full_name") or user,
		},
		"can_edit": can_edit(user),
		"sections": visible_sections,
		"articles": articles,
	}


@frappe.whitelist()
def get_article(article: str):
	require_login()
	doc = _article(article)
	return _serialize_article(doc)


@frappe.whitelist()
def save_article(payload):
	user = require_login()
	if not can_edit(user):
		frappe.throw(_("Editor access is required."), frappe.PermissionError)
	data = frappe.parse_json(payload) if isinstance(payload, str) else frappe._dict(payload or {})
	name = (data.get("name") or "").strip()
	if name:
		if not frappe.db.exists("KB Article", name):
			frappe.throw(_("Article not found."), frappe.DoesNotExistError)
		doc = frappe.get_doc("KB Article", name)
	else:
		doc = frappe.new_doc("KB Article")

	allowed = {
		"title",
		"status",
		"version",
		"section",
		"parent_article",
		"access_scope",
		"intro",
		"content",
		"expert_name",
		"expert_role",
		"expert_photo",
		"publication_date",
		"related_material",
		"allow_comments",
	}
	for fieldname in allowed:
		if fieldname in data:
			doc.set(fieldname, data.get(fieldname))

	if doc.status == "Published" and not doc.publication_date:
		doc.publication_date = now_datetime()
		doc.published_by = user
	if doc.status != "Published" and doc.is_new():
		doc.published_by = None

	doc.flags.ignore_permissions = True
	if doc.is_new():
		doc.insert()
	else:
		doc.save()
	return _serialize_article(doc)


@frappe.whitelist()
def record_view(article: str):
	user = require_login()
	_article(article)
	view_key = _key(article, user)
	now = now_datetime()
	if frappe.db.exists("KB Article View", view_key):
		current_count = cint(frappe.db.get_value("KB Article View", view_key, "view_count"))
		frappe.db.set_value(
			"KB Article View",
			view_key,
			{"last_viewed_at": now, "view_count": current_count + 1},
			update_modified=False,
		)
	else:
		doc = frappe.get_doc(
			{
				"doctype": "KB Article View",
				"view_key": view_key,
				"article": article,
				"user": user,
				"first_viewed_at": now,
				"last_viewed_at": now,
				"view_count": 1,
			}
		)
		doc.insert(ignore_permissions=True)
	return get_engagement(article)


@frappe.whitelist()
def set_feedback(article: str, value: str):
	user = require_login()
	_article(article)
	if value not in {"Yes", "No"}:
		frappe.throw(_("Feedback must be Yes or No."))
	feedback_key = _key(article, user)
	now = now_datetime()
	if frappe.db.exists("KB Article Feedback", feedback_key):
		frappe.db.set_value(
			"KB Article Feedback",
			feedback_key,
			{"value": value, "responded_at": now},
			update_modified=False,
		)
	else:
		frappe.get_doc(
			{
				"doctype": "KB Article Feedback",
				"feedback_key": feedback_key,
				"article": article,
				"user": user,
				"value": value,
				"responded_at": now,
			}
		).insert(ignore_permissions=True)
	return get_engagement(article)


@frappe.whitelist()
def add_comment(article: str, comment: str):
	user = require_login()
	doc = _article(article)
	if not cint(doc.allow_comments):
		frappe.throw(_("Comments are disabled for this article."))
	text = strip_html_tags(comment or "").strip()
	if not text:
		frappe.throw(_("Comment cannot be empty."))
	if len(text) > 2000:
		frappe.throw(_("Comment is too long."))
	frappe.get_doc(
		{
			"doctype": "KB Article Comment",
			"article": article,
			"user": user,
			"comment": text,
			"status": "Visible",
		}
	).insert(ignore_permissions=True)
	return get_engagement(article)


@frappe.whitelist()
def get_engagement(article: str):
	user = require_login()
	_article(article)
	views = frappe.get_all(
		"KB Article View",
		filters={"article": article},
		fields=["user", "first_viewed_at", "last_viewed_at", "view_count"],
		order_by="first_viewed_at asc",
		limit_page_length=0,
	)
	feedback = frappe.get_all(
		"KB Article Feedback",
		filters={"article": article},
		fields=["user", "value", "responded_at"],
		order_by="responded_at asc",
		limit_page_length=0,
	)
	comments = frappe.get_all(
		"KB Article Comment",
		filters={"article": article, "status": "Visible"},
		fields=["name", "user", "comment", "creation"],
		order_by="creation asc",
		limit_page_length=0,
	)
	names = _full_names(
		[row.user for row in views] + [row.user for row in feedback] + [row.user for row in comments]
	)
	return {
		"views": {
			"unique_count": len(views),
			"open_count": sum(cint(row.view_count) for row in views),
			"people": [
				{
					"user": row.user,
					"name": names.get(row.user, row.user),
					"first_viewed_at": row.first_viewed_at,
					"last_viewed_at": row.last_viewed_at,
				}
				for row in views
			],
		},
		"feedback": {
			"yes": [
				{"user": row.user, "name": names.get(row.user, row.user)}
				for row in feedback
				if row.value == "Yes"
			],
			"no": [
				{"user": row.user, "name": names.get(row.user, row.user)}
				for row in feedback
				if row.value == "No"
			],
			"current": next((row.value for row in feedback if row.user == user), None),
		},
		"comments": [
			{
				"name": row.name,
				"user": row.user,
				"author_name": names.get(row.user, row.user),
				"comment": row.comment,
				"created_at": row.creation,
			}
			for row in comments
		],
	}
