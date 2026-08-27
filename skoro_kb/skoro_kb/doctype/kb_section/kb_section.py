import frappe
from frappe import _
from frappe.model.document import Document

from skoro_kb.utils import make_slug


class KBSection(Document):
	def autoname(self):
		self.slug = self.slug or make_slug(self.title, "KB Section")
		self.name = self.slug

	def validate(self):
		self.title = (self.title or "").strip()
		if not self.title:
			frappe.throw(_("Section title is required."))
		if self.parent_section == self.name:
			frappe.throw(_("A section cannot be its own parent."))
