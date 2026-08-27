import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, strip_html_tags
from frappe.utils.html_utils import sanitize_html

from skoro_kb.utils import make_slug


class KBArticle(Document):
	def autoname(self):
		self.slug = self.slug or make_slug(self.title, "KB Article")
		self.name = self.slug

	def validate(self):
		self.title = (self.title or "").strip()
		self.expert_name = (self.expert_name or "").strip()
		self.expert_role = (self.expert_role or "").strip()
		self.intro = (self.intro or "").strip()
		self.content = sanitize_html(
			self.content or "",
			always_sanitize=True,
			disallowed_tags={"form", "input", "button", "textarea", "select", "option", "iframe"},
		)

		if not self.title:
			frappe.throw(_("Article title is required."))
		if self.parent_article == self.name:
			frappe.throw(_("An article cannot be its own parent."))
		if self.status == "Published":
			if not self.expert_name:
				frappe.throw(_("Article expert is required."))
			if not strip_html_tags(self.content or "").strip():
				frappe.throw(_("Published article content cannot be empty."))
			self.publication_date = self.publication_date or now_datetime()
			self.published_by = self.published_by or frappe.session.user

	def on_trash(self):
		if self.status == "Published":
			frappe.throw(_("Archive a published article instead of deleting it."))
