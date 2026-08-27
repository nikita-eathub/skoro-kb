(function () {
  "use strict";

  const appRoot = document.getElementById("skoro-kb-app");
  const csrfToken = appRoot ? appRoot.dataset.csrfToken : "";
  const sessionUserName = appRoot ? appRoot.dataset.userName : "";
  const canEdit = Boolean(appRoot && appRoot.dataset.canEdit === "1");
  const editor = document.getElementById("articleEditor");
  const titleInput = document.getElementById("articleTitle");
  const saveState = document.getElementById("saveState");
  const editorView = document.getElementById("editorView");
  const readerView = document.getElementById("readerView");
  const modeButton = document.getElementById("modeButton");
  const settingsDialog = document.getElementById("settingsDialog");
  const blockDialog = document.getElementById("blockDialog");
  const calloutDialog = document.getElementById("calloutDialog");
  const videoDialog = document.getElementById("videoDialog");
  const tableDialog = document.getElementById("tableDialog");
  const linkDialog = document.getElementById("linkDialog");
  const imageDialog = document.getElementById("imageDialog");
  const attachmentDialog = document.getElementById("attachmentDialog");
  const colorPopover = document.getElementById("colorPopover");
  const moreMenu = document.getElementById("moreMenu");
  const introInput = document.getElementById("articleIntro");
  const sidebar = document.getElementById("sidebar");

  const fields = {
    section: document.getElementById("sectionField"),
    parent: document.getElementById("parentField"),
    access: document.getElementById("accessField"),
    editAccess: document.getElementById("editAccessField"),
    expertName: document.getElementById("expertNameField"),
    expertRole: document.getElementById("expertRoleField"),
    publicationDate: document.getElementById("publicationDateField"),
    version: document.getElementById("versionField"),
    related: document.getElementById("relatedField")
  };

  const accessLabels = {
    general: "Все сотрудники",
    uk: "Только УК",
    franchise: "Только франчайзи"
  };

  const accessToServer = {
    general: "All Employees",
    uk: "UK Only",
    franchise: "Franchise Only"
  };

  const accessFromServer = {
    "All Employees": "general",
    "UK Only": "uk",
    "Franchise Only": "franchise"
  };

  const editAccessLabels = {
    all_editors: "сотрудники с ролью редактора или менеджера Базы знаний"
  };

  const samples = {
    delivery: {
      title: "Как принять поставку без ошибок",
      intro: "Короткая инструкция для сотрудников, которые принимают поставку и фиксируют возможные расхождения.",
      section: "Работа в пиццерии",
      access: "general",
      expertName: "Маргарита Стекольникова",
      expertRole: "Руководитель отдела качества",
      version: "1.0",
      related: "Курс «Приёмка и хранение товара»",
      html: "<p>Перед приёмкой подготовьте место для проверки товара и откройте документы поставки.</p><div class=\"editor-callout callout-info\"><span class=\"callout-icon\">i</span><div class=\"callout-content\"><strong>Информация</strong><p>Сначала сверьте номер поставки и перечень документов.</p></div></div><h2>Проверьте товар до подтверждения</h2><p>Сверяйте фактическое количество, внешний вид и сроки годности с документами. <span style=\"background-color:#fff0a8\">Все расхождения фиксируйте</span> до завершения приёмки.</p><div class=\"editor-callout callout-danger\"><span class=\"callout-icon\">×</span><div class=\"callout-content\"><strong>Критично</strong><p>Не подтверждайте приёмку, пока расхождения не зафиксированы по установленному процессу.</p></div></div><h2>Чек-лист приёмки</h2><ul class=\"check-list\"><li>Сверить количество</li><li>Проверить целостность упаковки</li><li>Проверить сроки годности</li><li>Зафиксировать расхождения</li></ul><p class=\"editor-writing-line\"><br></p>"
    },
    shift: {
      title: "Открытие смены",
      intro: "Порядок подготовки команды, оборудования и рабочих зон к началу смены.",
      section: "Работа в пиццерии",
      access: "general",
      expertName: "Эксперт материала",
      expertRole: "Операционный директор",
      version: "1.0",
      related: "Чек-лист управляющего сменой",
      html: "<p>До открытия пиццерии убедитесь, что команда готова к работе, оборудование исправно, а рабочие зоны подготовлены.</p><h2>До начала обслуживания</h2><ul class=\"check-list\"><li>Проверить присутствие сотрудников</li><li>Осмотреть оборудование</li><li>Проверить чистоту рабочих зон</li></ul><p class=\"editor-writing-line\"><br></p>"
    },
    team: {
      title: "Команда управляющей компании",
      intro: "Структура управляющей компании, контакты и зоны ответственности отделов.",
      section: "Управляющая компания",
      access: "uk",
      expertName: "Представитель отдела персонала",
      expertRole: "Эксперт материала",
      version: "1.0",
      related: "Контакты отделов УК",
      html: "<p>В материале собрана структура управляющей компании и зоны ответственности отделов.</p><div class=\"editor-callout callout-note\"><span class=\"callout-icon\">☆</span><div class=\"callout-content\"><strong>Доступ</strong><p>Материал предназначен только для сотрудников управляющей компании.</p></div></div>"
    },
    regulations: {
      title: "Регламенты отделов",
      intro: "Навигация по действующим регламентам и правилам их актуализации.",
      section: "Управляющая компания",
      access: "uk",
      expertName: "Ответственный за материал",
      expertRole: "Руководитель раздела",
      version: "1.0",
      related: "",
      html: "<p>Выберите отдел, чтобы перейти к действующим регламентам и инструкциям.</p><h2>Правила актуальности</h2><p>Эксперт материала отвечает за проверку содержания и своевременное обновление.</p>"
    },
    mentor: {
      title: "Работа с наставником",
      intro: "Как проходит сопровождение нового сотрудника на рабочем месте.",
      section: "Обучение",
      access: "general",
      expertName: "Представитель отдела обучения",
      expertRole: "Эксперт материала",
      version: "1.0",
      related: "Курс наставника",
      html: "<p>Наставник помогает новому сотруднику освоить стандарты на рабочем месте и закрепить знания на практике.</p>"
    }
  };

  let state = {
    status: "draft",
    updatedAt: "",
    publishedAt: "",
    expertPhotoId: "",
    articleId: "delivery",
    dirty: false
  };
  let saveTimer = 0;
  let toastTimer = 0;
  let lastRange = null;
  let colorMode = "foreColor";
  let pendingLinkText = "";
  let bootstrapData = {sections: [], articles: []};
  let currentEngagement = null;
  let loadingArticle = false;

  async function apiCall(method, args) {
    const body = new URLSearchParams();
    Object.keys(args || {}).forEach(function (key) {
      const value = args[key];
      body.set(key, typeof value === "string" ? value : JSON.stringify(value));
    });
    const response = await fetch("/api/method/" + method, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Frappe-CSRF-Token": csrfToken
      },
      body: body.toString()
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok || result.exc || result.exception) {
      const message = result.message || result._server_messages || "Сервер не выполнил запрос";
      throw new Error(typeof message === "string" ? message : "Сервер не выполнил запрос");
    }
    return result.message;
  }

  function nowLabel(iso) {
    if (!iso) return "Не сохранено";
    const date = new Date(iso);
    return "Обновлено " + new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function dateOnlyLabel(iso, prefix) {
    if (!iso) return prefix + " —";
    return prefix + " " + new Intl.DateTimeFormat("ru-RU", {day: "2-digit", month: "long", year: "numeric"}).format(new Date(iso));
  }

  function dateInputValue(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function isoFromDateInput(value) {
    if (!value) return "";
    const date = new Date(value + "T12:00:00");
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function currentData() {
    return {
      title: titleInput.value.trim(),
      intro: introInput.value.trim(),
      html: editor.innerHTML.trim(),
      section: fields.section.value,
      parent: fields.parent.value,
      access: fields.access.value,
      editAccess: fields.editAccess.value,
      expertName: fields.expertName.value.trim(),
      expertRole: fields.expertRole.value.trim(),
      expertPhotoId: state.expertPhotoId,
      version: fields.version.value.trim() || "1.0",
      related: fields.related.value.trim(),
      status: state.status,
      updatedAt: state.updatedAt,
      publishedAt: state.publishedAt,
      articleId: state.articleId
    };
  }

  function sectionLabel(sectionName) {
    const section = bootstrapData.sections.find(function (item) { return item.name === sectionName; });
    return section ? section.title : (sectionName || "Без раздела");
  }

  function setSaveLabel(text, className) {
    saveState.textContent = text;
    saveState.className = "save-state" + (className ? " " + className : "");
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 2600);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"]/g, function (symbol) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"}[symbol];
    });
  }

  function makeId(prefix) {
    return prefix + "-" + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(16).slice(2));
  }

  async function storeAsset(file, kind) {
    if (!canEdit) throw new Error("Нет прав на загрузку файлов");
    if (!state.articleId || state.articleId.indexOf("article-") === 0) {
      await saveDraft(false);
    }
    if (!state.articleId || state.articleId.indexOf("article-") === 0) {
      throw new Error("Сначала сохраните статью");
    }
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("is_private", "1");
    form.append("doctype", "KB Article");
    form.append("docname", state.articleId);
    const response = await fetch("/api/method/upload_file", {
      method: "POST",
      credentials: "same-origin",
      headers: {"X-Frappe-CSRF-Token": csrfToken},
      body: form
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok || !result.message || !result.message.file_url) {
      throw new Error(result.message || "Не удалось загрузить файл");
    }
    return {
      id: result.message.file_url,
      url: result.message.file_url,
      kind: kind,
      name: result.message.file_name || file.name,
      type: file.type,
      size: file.size
    };
  }

  async function getAsset(id) {
    if (!id) return null;
    return {id: id, url: id, name: id.split("/").pop() || "файл"};
  }

  function objectUrlFor(record) {
    return record.url || record.id;
  }

  async function hydrateAssets(root) {
    const scope = root || document;
    const blocks = scope.querySelectorAll("[data-asset-id]");
    for (const block of blocks) {
      const record = await getAsset(block.dataset.assetId);
      if (!record) {
        block.classList.add("asset-missing");
        continue;
      }
      const url = objectUrlFor(record);
      const video = block.querySelector("video[data-asset-target]");
      const image = block.querySelector("img[data-asset-target]");
      const download = block.querySelector("a[data-asset-target]");
      if (video && video.getAttribute("src") !== url) video.src = url;
      if (image && image.getAttribute("src") !== url) image.src = url;
      if (download) {
        download.href = url;
        download.download = record.name;
      }
    }
  }

  async function renderExpertAvatars() {
    const targets = [document.getElementById("expertAvatarEditor"), document.getElementById("expertAvatarSettings"), document.getElementById("expertAvatarPreview")];
    const fallback = (fields.expertName.value.trim().charAt(0) || "Э").toLocaleUpperCase("ru");
    let url = "";
    if (state.expertPhotoId) {
      const record = await getAsset(state.expertPhotoId);
      if (record) url = objectUrlFor(record);
    }
    targets.forEach(function (target) {
      if (!target) return;
      target.innerHTML = url ? "<img src=\"" + escapeHtml(url) + "\" alt=\"\">" : escapeHtml(fallback);
    });
  }

  function openDialog(dialog) {
    rememberSelection();
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  }

  function openColorPopover(button) {
    rememberSelection();
    colorMode = button.dataset.colorMode;
    document.getElementById("colorPopoverTitle").textContent = colorMode === "foreColor" ? "Цвет текста" : "Выделение цветом";
    const rect = button.getBoundingClientRect();
    const width = 310;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    colorPopover.style.left = left + "px";
    colorPopover.style.top = Math.min(rect.bottom + 9, window.innerHeight - 330) + "px";
    colorPopover.hidden = false;
    document.querySelectorAll("[data-color-mode]").forEach(function (item) {
      item.setAttribute("aria-expanded", String(item === button));
    });
  }

  function closeColorPopover() {
    colorPopover.hidden = true;
    document.querySelectorAll("[data-color-mode]").forEach(function (item) { item.setAttribute("aria-expanded", "false"); });
  }

  function updateLabels() {
    const title = titleInput.value.trim() || "Новая статья";
    document.getElementById("breadcrumbTitle").textContent = title;
    document.getElementById("breadcrumbSection").textContent = sectionLabel(fields.section.value);
    document.getElementById("contextSection").textContent = sectionLabel(fields.section.value);
    document.getElementById("contextStatus").textContent = state.status === "published" ? "Опубликовано" : "Черновик";
    document.getElementById("publishButton").textContent = state.status === "published" ? "Опубликовано" : "Опубликовать";
    document.getElementById("publishButton").classList.toggle("published", state.status === "published");
    document.getElementById("expertNameEditor").textContent = fields.expertName.value.trim() || "Не указан";
    document.getElementById("expertRoleEditor").textContent = fields.expertRole.value.trim() || "Должность не указана";
    document.getElementById("publishedDateEditor").textContent = state.publishedAt ? dateOnlyLabel(state.publishedAt, "Опубликовано") : "Дата публикации — автоматически";
    document.getElementById("updatedDateEditor").textContent = dateOnlyLabel(state.updatedAt, "Обновлено");
    document.getElementById("settingsUpdatedDate").textContent = state.updatedAt ? dateOnlyLabel(state.updatedAt, "Обновлено") : "Появится автоматически после сохранения";
    document.getElementById("permissionSummaryText").textContent = "Читать: " + accessLabels[fields.access.value].toLocaleLowerCase("ru") + ". Редактировать: " + editAccessLabels[fields.editAccess.value] + ".";
    renderExpertAvatars();
  }

  function markDirty() {
    state.dirty = true;
    setSaveLabel("Есть несохранённые изменения", "dirty");
    updateLabels();
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () { saveDraft(true); }, 1200);
  }

  async function saveDraft(isAutomatic) {
    if (!canEdit || loadingArticle) return null;
    const data = currentData();
    if (!data.title) {
      if (!isAutomatic) {
        titleInput.focus();
        showToast("Добавьте название статьи");
      }
      return null;
    }
    setSaveLabel("Сохраняем…", "dirty");
    try {
      const saved = await apiCall("skoro_kb.api.save_article", {payload: {
        name: state.articleId && state.articleId.indexOf("article-") !== 0 ? state.articleId : "",
        title: data.title,
        status: data.status === "published" ? "Published" : "Draft",
        version: data.version,
        section: data.section,
        parent_article: data.parent,
        access_scope: accessToServer[data.access] || "All Employees",
        intro: data.intro,
        content: data.html,
        expert_name: data.expertName,
        expert_role: data.expertRole,
        expert_photo: data.expertPhotoId,
        publication_date: data.publishedAt || "",
        related_material: data.related,
        allow_comments: 1
      }});
      state.articleId = saved.name;
      state.updatedAt = saved.modified || "";
      state.publishedAt = saved.publication_date || "";
      state.status = saved.status === "Published" ? "published" : "draft";
      state.dirty = false;
      await refreshBootstrap(false);
      syncArticleInTree();
      updateLabels();
      setSaveLabel(isAutomatic ? "Черновик сохранён автоматически" : "Черновик сохранён", "saved");
      if (!isAutomatic) showToast("Статья сохранена на тестовом сайте");
      return saved;
    } catch (error) {
      setSaveLabel("Не удалось сохранить", "dirty");
      showToast("Не удалось сохранить статью");
      return null;
    }
  }

  function autoGrowTitle() {
    titleInput.style.height = "auto";
    titleInput.style.height = Math.max(76, titleInput.scrollHeight) + "px";
  }

  function applyData(data, dirty) {
    titleInput.value = data.title || "";
    introInput.value = data.intro || "";
    editor.innerHTML = data.html || data.content || "";
    fields.section.value = data.section || (bootstrapData.sections[0] && bootstrapData.sections[0].name) || "";
    fields.parent.value = data.parent || data.parent_article || "";
    fields.access.value = data.access || accessFromServer[data.access_scope] || "general";
    fields.editAccess.value = "all_editors";
    fields.expertName.value = data.expertName || data.expert_name || data.expert || "";
    fields.expertRole.value = data.expertRole || data.expert_role || "";
    fields.version.value = data.version || "1.0";
    fields.related.value = data.related || data.related_material || "";
    state.status = data.status === "Published" || data.status === "published" ? "published" : "draft";
    state.updatedAt = data.updatedAt || data.modified || "";
    state.publishedAt = data.publishedAt || data.publication_date || "";
    fields.publicationDate.value = dateInputValue(state.publishedAt);
    state.expertPhotoId = data.expertPhotoId || data.expert_photo || "";
    state.articleId = data.articleId || data.name || makeId("article");
    state.dirty = Boolean(dirty);
    autoGrowTitle();
    updateLabels();
    hydrateAssets(editor);
    setSaveLabel(dirty ? "Есть несохранённые изменения" : nowLabel(state.updatedAt), dirty ? "dirty" : (state.updatedAt ? "saved" : ""));
  }

  async function loadInitialData() {
    try {
      await refreshBootstrap(true);
      const requested = new URLSearchParams(window.location.search).get("article");
      const first = bootstrapData.articles.find(function (item) { return item.name === requested; }) || bootstrapData.articles[0];
      if (first) {
        await openServerArticle(first.name);
      } else if (canEdit) {
        newArticle();
      } else {
        setSaveLabel("Нет доступных статей", "");
      }
      if (!canEdit) toggleMode(true);
    } catch (error) {
      setSaveLabel("Не удалось загрузить Базу знаний", "dirty");
      showToast("Ошибка загрузки статей");
    }
  }

  function populateSelectors() {
    const selectedSection = fields.section.value;
    fields.section.replaceChildren();
    bootstrapData.sections.forEach(function (section) {
      const option = document.createElement("option");
      option.value = section.name;
      option.textContent = section.title;
      fields.section.appendChild(option);
    });
    if (bootstrapData.sections.some(function (item) { return item.name === selectedSection; })) {
      fields.section.value = selectedSection;
    }

    const selectedParent = fields.parent.value;
    fields.parent.replaceChildren();
    const rootOption = document.createElement("option");
    rootOption.value = "";
    rootOption.textContent = "В корне раздела";
    fields.parent.appendChild(rootOption);
    bootstrapData.articles.forEach(function (article) {
      if (article.name === state.articleId) return;
      const option = document.createElement("option");
      option.value = article.name;
      option.textContent = article.title;
      fields.parent.appendChild(option);
    });
    fields.parent.value = selectedParent;
  }

  function bindTreeFolder(button) {
    button.addEventListener("click", function () {
      const children = button.nextElementSibling;
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.querySelector("span").textContent = expanded ? "›" : "⌄";
      children.hidden = expanded;
    });
  }

  function bindTreeArticle(button) {
    button.addEventListener("click", async function () {
      document.querySelectorAll(".tree-article").forEach(function (item) { item.classList.remove("selected"); });
      button.classList.add("selected");
      await openServerArticle(button.dataset.articleName);
      if (!canEdit) toggleMode(true);
      else toggleMode(false);
      if (window.innerWidth <= 860) sidebar.classList.remove("open");
    });
  }

  function renderTree() {
    const tree = document.querySelector(".knowledge-tree");
    tree.replaceChildren();
    const rootButton = document.createElement("button");
    rootButton.type = "button";
    rootButton.className = "tree-root active";
    rootButton.innerHTML = '<span class="tree-icon" aria-hidden="true">▤</span><span>Все материалы</span><span class="count">' + bootstrapData.articles.length + "</span>";
    tree.appendChild(rootButton);

    bootstrapData.sections.forEach(function (section) {
      const articles = bootstrapData.articles.filter(function (article) { return article.section === section.name; });
      const wrapper = document.createElement("div");
      wrapper.className = "tree-section";
      wrapper.dataset.section = section.name;
      wrapper.dataset.searchable = (section.title + " " + articles.map(function (item) { return item.title; }).join(" ")).toLocaleLowerCase("ru");
      const folder = document.createElement("button");
      folder.type = "button";
      folder.className = "tree-folder";
      folder.setAttribute("aria-expanded", "true");
      folder.innerHTML = '<span aria-hidden="true">⌄</span><strong>' + escapeHtml(section.title) + "</strong>";
      const children = document.createElement("div");
      children.className = "tree-children";
      articles.forEach(function (article) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tree-article" + (article.name === state.articleId ? " selected" : "");
        button.dataset.articleName = article.name;
        button.textContent = article.title + (article.status === "Draft" ? " · черновик" : "");
        bindTreeArticle(button);
        children.appendChild(button);
      });
      wrapper.append(folder, children);
      bindTreeFolder(folder);
      tree.appendChild(wrapper);
    });
  }

  async function refreshBootstrap(render) {
    const result = await apiCall("skoro_kb.api.get_bootstrap", {});
    bootstrapData = result || {sections: [], articles: []};
    populateSelectors();
    if (render !== false) renderTree();
    document.getElementById("currentUserName").value = (bootstrapData.user && bootstrapData.user.full_name) || sessionUserName;
  }

  async function openServerArticle(name) {
    if (!name) return;
    loadingArticle = true;
    try {
      const article = await apiCall("skoro_kb.api.get_article", {article: name});
      applyData(article, false);
      renderTree();
      currentEngagement = null;
    } catch (error) {
      showToast("Не удалось открыть статью");
    } finally {
      loadingArticle = false;
    }
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) lastRange = range.cloneRange();
  }

  function restoreSelection() {
    editor.focus();
    if (!lastRange) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(lastRange);
  }

  function runCommand(command, value) {
    restoreSelection();
    document.execCommand(command, false, value || null);
    rememberSelection();
    markDirty();
  }

  function insertHtml(html) {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    rememberSelection();
    markDirty();
  }

  function insertHtmlWithCaret(html) {
    const marker = makeId("caret");
    insertHtml(html + "<p class=\"editor-writing-line\" data-caret-marker=\"" + marker + "\"><br></p>");
    const line = editor.querySelector("[data-caret-marker=\"" + marker + "\"]");
    if (!line) return;
    line.removeAttribute("data-caret-marker");
    const range = document.createRange();
    range.selectNodeContents(line);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    lastRange = range.cloneRange();
    editor.focus();
  }

  function insertBlock(type) {
    const blocks = {
      heading: "<h2>Новый раздел</h2><p>Добавьте содержание раздела.</p>",
      checklist: "<ul class=\"check-list\"><li>Первый пункт</li><li>Второй пункт</li><li>Третий пункт</li></ul>",
      related: "<div class=\"related-card\"><span>→</span><p><small>Связанный материал</small><strong>Укажите название курса или статьи</strong></p></div>"
    };
    if (type === "image") {
      openDialog(imageDialog);
      return;
    }
    if (type === "callout") {
      openDialog(calloutDialog);
      return;
    }
    if (type === "video") {
      openDialog(videoDialog);
      return;
    }
    if (type === "table") {
      openDialog(tableDialog);
      return;
    }
    if (type === "attachment") {
      openDialog(attachmentDialog);
      return;
    }
    insertHtmlWithCaret(blocks[type] || "");
  }

  function insertCallout(type) {
    const variants = {
      info: {className: "callout-info", icon: "i", title: "Информация", text: "Добавьте пояснение или полезный контекст."},
      success: {className: "callout-success", icon: "✓", title: "Успешно", text: "Добавьте правильное действие или ожидаемый результат."},
      danger: {className: "callout-danger", icon: "×", title: "Критично", text: "Добавьте запрет или критичное предупреждение."},
      note: {className: "callout-note", icon: "☆", title: "Обратите внимание", text: "Добавьте правило, которое важно запомнить."}
    };
    const variant = variants[type] || variants.info;
    insertHtmlWithCaret("<div class=\"editor-callout " + variant.className + "\"><span class=\"callout-icon\">" + variant.icon + "</span><div class=\"callout-content\"><strong>" + variant.title + "</strong><p>" + variant.text + "</p></div></div>");
  }

  function buildTable(columns, rows, withHeader) {
    let html = "<div class=\"table-scroll\"><table class=\"article-table\">";
    let start = 0;
    if (withHeader) {
      html += "<thead><tr>";
      for (let column = 0; column < columns; column += 1) html += "<th>Заголовок " + (column + 1) + "</th>";
      html += "</tr></thead>";
      start = 1;
    }
    html += "<tbody>";
    for (let row = start; row < rows; row += 1) {
      html += "<tr>";
      for (let column = 0; column < columns; column += 1) html += "<td>Добавьте данные</td>";
      html += "</tr>";
    }
    html += "</tbody></table></div>";
    return html;
  }

  function videoMarkup(rawUrl, caption) {
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch (error) {
      return "";
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";

    let player = "";
    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) {
      player = "<video controls preload=\"metadata\" src=\"" + escapeHtml(parsed.href) + "\"></video>";
    }

    if (!player) {
      player = "<div class=\"video-placeholder\"><div><strong>Предпросмотр недоступен</strong><a href=\"" + escapeHtml(parsed.href) + "\" target=\"_blank\" rel=\"noopener noreferrer\">Открыть видео по ссылке</a></div></div>";
    } else {
      player = "<div class=\"video-frame\">" + player + "</div>";
    }
    return "<figure class=\"video-figure\" contenteditable=\"false\">" + player + "<figcaption>" + escapeHtml(caption || "Подпись к видео") + "</figcaption></figure>";
  }

  function videoFileMarkup(record, caption) {
    return "<figure class=\"video-figure\" data-asset-id=\"" + escapeHtml(record.id) + "\" contenteditable=\"false\"><div class=\"video-frame\"><video data-asset-target controls preload=\"metadata\"></video></div><figcaption>" + escapeHtml(caption || record.name) + "</figcaption></figure>";
  }

  function imageFileMarkup(record, caption, position) {
    const positionClass = position === "left" || position === "right" ? " image-side image-" + position : "";
    return "<figure class=\"editor-figure" + positionClass + "\" data-asset-id=\"" + escapeHtml(record.id) + "\" contenteditable=\"false\"><img data-asset-target alt=\"" + escapeHtml(caption || record.name) + "\"><figcaption>" + escapeHtml(caption || "Изображение") + "</figcaption></figure>";
  }

  function fileSizeLabel(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " КБ";
    return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " МБ";
  }

  function attachmentMarkup(record, label) {
    const extension = (record.name.split(".").pop() || "FILE").toLocaleUpperCase("ru").slice(0, 5);
    return "<div class=\"attachment-card\" data-asset-id=\"" + escapeHtml(record.id) + "\" contenteditable=\"false\"><span class=\"attachment-icon\">" + escapeHtml(extension) + "</span><div class=\"attachment-details\"><strong>" + escapeHtml(label || record.name) + "</strong><small>" + escapeHtml(record.name) + " · " + fileSizeLabel(record.size) + "</small></div><a class=\"attachment-download\" data-asset-target href=\"#\">Скачать</a></div>";
  }

  function openSettings() {
    openDialog(settingsDialog);
  }

  function openBlockDialog() {
    openDialog(blockDialog);
  }

  function renderReader() {
    const data = currentData();
    document.getElementById("previewTitle").textContent = data.title || "Без названия";
    document.getElementById("previewSection").textContent = sectionLabel(data.section);
    document.getElementById("previewAccess").textContent = accessLabels[data.access];
    document.getElementById("previewExpert").textContent = data.expertName || "Не указан";
    document.getElementById("previewExpertRole").textContent = data.expertRole || "Должность не указана";
    document.getElementById("previewPublished").textContent = data.publishedAt ? dateOnlyLabel(data.publishedAt, "Опубликовано") : "Не опубликовано";
    document.getElementById("previewUpdated").textContent = dateOnlyLabel(data.updatedAt, "Обновлено");
    document.getElementById("previewVersion").textContent = "Версия " + data.version;
    document.getElementById("previewIntro").textContent = data.intro || "";
    document.getElementById("previewIntro").hidden = !data.intro;

    const body = document.getElementById("previewBody");
    body.innerHTML = data.html || "<p>Содержание статьи ещё не заполнено.</p>";
    if (data.related) {
      const related = document.createElement("div");
      related.className = "related-card";
      const icon = document.createElement("span");
      icon.textContent = "→";
      const text = document.createElement("p");
      const small = document.createElement("small");
      small.textContent = "Связанный материал";
      const strong = document.createElement("strong");
      strong.textContent = data.related;
      text.append(small, strong);
      related.append(icon, text);
      body.appendChild(related);
    }
    hydrateAssets(body);
    renderExpertAvatars();
    document.getElementById("accessDenied").hidden = true;
    document.getElementById("previewContent").hidden = false;
    if (data.status === "published") recordView();
    renderEngagement();
  }

  function toggleMode(forceReader) {
    const showReader = typeof forceReader === "boolean" ? forceReader : readerView.hidden;
    editorView.hidden = showReader;
    readerView.hidden = !showReader;
    modeButton.textContent = showReader ? "Редактировать" : "Предпросмотр";
    modeButton.setAttribute("aria-pressed", String(showReader));
    if (showReader) renderReader();
  }

  async function publishArticle() {
    const data = currentData();
    if (!data.title) {
      titleInput.focus();
      showToast("Добавьте название статьи");
      return;
    }
    if (!data.expertName) {
      openSettings();
      fields.expertName.focus();
      showToast("Укажите ФИО эксперта статьи");
      return;
    }
    if (!editor.textContent.trim()) {
      editor.focus();
      showToast("Добавьте содержание статьи");
      return;
    }
    state.status = "published";
    if (!state.publishedAt) {
      state.publishedAt = new Date().toISOString();
      fields.publicationDate.value = dateInputValue(state.publishedAt);
    }
    updateLabels();
    const saved = await saveDraft(false);
    if (saved) showToast("Статья опубликована на тестовом сайте");
  }

  function newArticle() {
    applyData({
      title: "",
      intro: "",
      html: "",
      section: (bootstrapData.sections[0] && bootstrapData.sections[0].name) || "",
      parent: "",
      access: "general",
      editAccess: "all_editors",
      expertName: "",
      expertRole: "",
      expertPhotoId: "",
      version: "1.0",
      related: "",
      status: "draft",
      updatedAt: "",
      publishedAt: "",
      articleId: makeId("article")
    }, true);
    document.querySelectorAll(".tree-article").forEach(function (item) { item.classList.remove("selected"); });
    titleInput.focus();
    if (window.innerWidth <= 860) sidebar.classList.remove("open");
  }

  function syncArticleInTree() {
    renderTree();
  }

  function renderPeopleList(list, people, emptyText) {
    list.replaceChildren();
    if (!people.length) {
      const empty = document.createElement("li");
      empty.className = "people-empty";
      empty.textContent = emptyText;
      list.appendChild(empty);
      return;
    }
    people.forEach(function (person) {
      const item = document.createElement("li");
      item.textContent = person.name;
      list.appendChild(item);
    });
  }

  async function recordView() {
    if (!state.articleId || state.articleId.indexOf("article-") === 0 || state.status !== "published") return;
    try {
      currentEngagement = await apiCall("skoro_kb.api.record_view", {article: state.articleId});
      renderEngagement();
    } catch (error) {
      showToast("Не удалось учесть просмотр");
    }
  }

  function renderEngagement() {
    const engagement = currentEngagement || {views: {unique_count: 0, people: []}, feedback: {yes: [], no: [], current: null}, comments: []};
    const yesPeople = engagement.feedback.yes || [];
    const noPeople = engagement.feedback.no || [];
    const ownFeedback = engagement.feedback.current === "Yes" ? "yes" : (engagement.feedback.current === "No" ? "no" : "");
    document.querySelectorAll("[data-feedback]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.feedback === ownFeedback));
    });
    document.getElementById("helpfulYesCount").textContent = String(yesPeople.length);
    document.getElementById("helpfulNoCount").textContent = String(noPeople.length);
    document.getElementById("feedbackPeopleCount").textContent = String(yesPeople.length + noPeople.length);
    renderPeopleList(document.getElementById("helpfulYesPeople"), yesPeople, "Пока никто");
    renderPeopleList(document.getElementById("helpfulNoPeople"), noPeople, "Пока никто");

    const viewers = engagement.views.people || [];
    document.getElementById("viewersCount").textContent = String(engagement.views.unique_count || 0);
    renderPeopleList(document.getElementById("viewersList"), viewers, "Просмотров пока нет");

    const comments = engagement.comments || [];
    const list = document.getElementById("commentsList");
    list.replaceChildren();
    comments.forEach(function (comment) {
      const card = document.createElement("article");
      card.className = "comment-card";
      const header = document.createElement("header");
      const author = document.createElement("strong");
      author.textContent = comment.author_name || "Сотрудник";
      const time = document.createElement("time");
      time.textContent = new Intl.DateTimeFormat("ru-RU", {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"}).format(new Date(comment.created_at));
      const text = document.createElement("p");
      text.textContent = comment.comment;
      header.append(author, time);
      card.append(header, text);
      list.appendChild(card);
    });
    document.getElementById("commentsCount").textContent = String(comments.length);
  }

  async function setFeedback(value) {
    if (!state.articleId || state.status !== "published") return;
    try {
      currentEngagement = await apiCall("skoro_kb.api.set_feedback", {article: state.articleId, value: value === "yes" ? "Yes" : "No"});
      renderEngagement();
      showToast(value === "yes" ? "Спасибо! Отмечено как полезная" : "Спасибо! Ответ сохранён");
    } catch (error) {
      showToast("Не удалось сохранить оценку");
    }
  }

  async function addComment() {
    const field = document.getElementById("commentField");
    const text = field.value.trim();
    if (!text) {
      field.focus();
      showToast("Напишите комментарий");
      return;
    }
    try {
      currentEngagement = await apiCall("skoro_kb.api.add_comment", {article: state.articleId, comment: text});
      field.value = "";
      renderEngagement();
      showToast("Комментарий добавлен");
    } catch (error) {
      showToast("Не удалось добавить комментарий");
    }
  }

  document.querySelectorAll("[data-command]").forEach(function (button) {
    button.addEventListener("mousedown", function (event) { event.preventDefault(); });
    button.addEventListener("click", function () { runCommand(button.dataset.command); });
  });

  document.querySelectorAll("[data-action]").forEach(function (button) {
    button.addEventListener("mousedown", function (event) { event.preventDefault(); });
    button.addEventListener("click", function () {
      const action = button.dataset.action;
      if (action === "quote") runCommand("formatBlock", "blockquote");
      if (action === "code") {
        const selection = window.getSelection();
        const text = selection && selection.toString() ? selection.toString() : "фрагмент";
        insertHtml("<code>" + text.replace(/[&<>]/g, function (symbol) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;"}[symbol]; }) + "</code>");
      }
      if (action === "callout") insertBlock("callout");
      if (action === "link") {
        const selection = window.getSelection();
        pendingLinkText = selection && selection.toString ? selection.toString().trim() : "";
        document.getElementById("linkLabelField").value = pendingLinkText;
        openDialog(linkDialog);
      }
      if (action === "image") insertBlock("image");
      if (action === "video") insertBlock("video");
      if (action === "attachment") insertBlock("attachment");
      if (action === "table") insertBlock("table");
      if (action === "add") openBlockDialog();
    });
  });

  document.querySelectorAll("[data-color-mode]").forEach(function (button) {
    button.addEventListener("mousedown", function (event) { event.preventDefault(); });
    button.addEventListener("click", function () {
      if (!colorPopover.hidden && colorMode === button.dataset.colorMode) closeColorPopover();
      else openColorPopover(button);
    });
  });

  document.querySelectorAll("[data-color]").forEach(function (button) {
    button.addEventListener("mousedown", function (event) { event.preventDefault(); });
    button.addEventListener("click", function () {
      const color = button.dataset.color;
      runCommand(colorMode, color);
      const indicator = colorMode === "foreColor" ? document.querySelector(".text-indicator") : document.querySelector(".highlight-indicator");
      indicator.style.background = color;
      closeColorPopover();
    });
  });

  document.getElementById("customColorInput").addEventListener("change", function () {
    runCommand(colorMode, this.value);
    const indicator = colorMode === "foreColor" ? document.querySelector(".text-indicator") : document.querySelector(".highlight-indicator");
    indicator.style.background = this.value;
    closeColorPopover();
  });

  document.getElementById("resetColorButton").addEventListener("mousedown", function (event) { event.preventDefault(); });
  document.getElementById("resetColorButton").addEventListener("click", function () {
    runCommand(colorMode, colorMode === "foreColor" ? "#383b40" : "transparent");
    closeColorPopover();
  });

  document.getElementById("headingSelect").addEventListener("change", function () {
    runCommand("formatBlock", this.value);
    this.value = "p";
  });

  editor.addEventListener("input", markDirty);
  editor.addEventListener("keyup", rememberSelection);
  editor.addEventListener("mouseup", rememberSelection);
  editor.addEventListener("focus", rememberSelection);
  titleInput.addEventListener("input", function () { autoGrowTitle(); markDirty(); });
  introInput.addEventListener("input", markDirty);
  Object.keys(fields).forEach(function (key) { fields[key].addEventListener("change", markDirty); });
  fields.expertName.addEventListener("input", function () { updateLabels(); markDirty(); });
  fields.expertRole.addEventListener("input", function () { updateLabels(); markDirty(); });
  fields.publicationDate.addEventListener("change", function () {
    state.publishedAt = isoFromDateInput(this.value);
    updateLabels();
  });

  document.getElementById("settingsButton").addEventListener("click", openSettings);
  document.getElementById("inlineSettingsButton").addEventListener("click", openSettings);
  document.getElementById("applySettingsButton").addEventListener("click", function () {
    markDirty();
    updateLabels();
  });
  document.getElementById("insertBlockButton").addEventListener("click", openBlockDialog);
  document.getElementById("closeBlockDialog").addEventListener("click", function () { blockDialog.close(); });
  document.querySelectorAll("[data-block]").forEach(function (button) {
    button.addEventListener("click", function () {
      const type = button.dataset.block;
      blockDialog.close();
      insertBlock(type);
    });
  });

  document.querySelectorAll("[data-callout]").forEach(function (button) {
    button.addEventListener("click", function () {
      const type = button.dataset.callout;
      calloutDialog.close();
      insertCallout(type);
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
    button.addEventListener("click", function () {
      const dialog = document.getElementById(button.dataset.closeDialog);
      if (dialog && dialog.open) dialog.close();
    });
  });

  document.getElementById("insertTableButton").addEventListener("click", function () {
    const columns = Math.floor(Number(document.getElementById("tableColumnsField").value));
    const rows = Math.floor(Number(document.getElementById("tableRowsField").value));
    if (!Number.isFinite(columns) || !Number.isFinite(rows) || columns < 1 || rows < 1) {
      showToast("Укажите положительное число строк и столбцов");
      return;
    }
    if (columns * rows > 25000) {
      showToast("Разделите таблицу: за один раз можно создать до 25 000 ячеек");
      return;
    }
    const withHeader = document.getElementById("tableHeaderField").checked;
    tableDialog.close();
    insertHtmlWithCaret(buildTable(columns, rows, withHeader));
    showToast("Таблица добавлена — заполните ячейки");
  });

  document.getElementById("insertVideoButton").addEventListener("click", async function () {
    const fileField = document.getElementById("videoFileField");
    const urlField = document.getElementById("videoUrlField");
    const captionField = document.getElementById("videoCaptionField");
    const file = fileField.files && fileField.files[0];
    let markup = "";
    if (file) {
      if (!/^(video\/mp4|video\/webm|video\/ogg)$/i.test(file.type) && !/\.(mp4|webm|ogg)$/i.test(file.name)) {
        showToast("Выберите видеофайл MP4, WebM или OGG");
        return;
      }
      try {
        const record = await storeAsset(file, "video");
        markup = videoFileMarkup(record, captionField.value.trim());
      } catch (error) {
        showToast("Не удалось сохранить видео в браузере");
        return;
      }
    } else {
      markup = videoMarkup(urlField.value.trim(), captionField.value.trim());
    }
    if (!markup) {
      fileField.focus();
      showToast("Выберите видеофайл или укажите корректную ссылку");
      return;
    }
    videoDialog.close();
    insertHtmlWithCaret(markup);
    hydrateAssets(editor);
    fileField.value = "";
    urlField.value = "";
    captionField.value = "";
    showToast("Видео добавлено в статью");
  });

  document.getElementById("insertImageButton").addEventListener("click", async function () {
    const fileField = document.getElementById("imageFileField");
    const file = fileField.files && fileField.files[0];
    if (!file) {
      fileField.focus();
      showToast("Выберите изображение");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      showToast("Выберите изображение PNG, JPG, WebP или GIF до 20 МБ");
      return;
    }
    try {
      const record = await storeAsset(file, "image");
      const caption = document.getElementById("imageCaptionField").value.trim();
      const position = document.getElementById("imagePositionField").value;
      imageDialog.close();
      insertHtmlWithCaret(imageFileMarkup(record, caption, position));
      hydrateAssets(editor);
      fileField.value = "";
      document.getElementById("imageCaptionField").value = "";
      showToast(position === "full" ? "Изображение добавлено" : "Изображение добавлено сбоку от текста");
    } catch (error) {
      showToast("Не удалось сохранить изображение в браузере");
    }
  });

  document.getElementById("insertAttachmentButton").addEventListener("click", async function () {
    const fileField = document.getElementById("attachmentFileField");
    const file = fileField.files && fileField.files[0];
    if (!file) {
      fileField.focus();
      showToast("Выберите документ");
      return;
    }
    if (!/\.(doc|docx|pdf|xls|xlsx|html|htm)$/i.test(file.name)) {
      showToast("Поддерживаются Word, PDF, Excel и HTML");
      return;
    }
    try {
      const record = await storeAsset(file, "document");
      const label = document.getElementById("attachmentLabelField").value.trim();
      attachmentDialog.close();
      insertHtmlWithCaret(attachmentMarkup(record, label));
      hydrateAssets(editor);
      fileField.value = "";
      document.getElementById("attachmentLabelField").value = "";
      showToast("Документ добавлен в статью");
    } catch (error) {
      showToast("Не удалось сохранить документ в браузере");
    }
  });

  document.getElementById("insertLinkButton").addEventListener("click", function () {
    const urlField = document.getElementById("linkUrlField");
    const labelField = document.getElementById("linkLabelField");
    let parsed;
    try { parsed = new URL(urlField.value.trim()); } catch (error) { parsed = null; }
    if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      urlField.focus();
      showToast("Укажите корректную ссылку с http:// или https://");
      return;
    }
    const label = labelField.value.trim() || pendingLinkText || parsed.href;
    linkDialog.close();
    insertHtml("<a href=\"" + escapeHtml(parsed.href) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHtml(label) + "</a>");
    urlField.value = "";
    labelField.value = "";
    pendingLinkText = "";
    showToast("Гиперссылка добавлена");
  });

  document.getElementById("chooseExpertPhotoButton").addEventListener("click", function () { document.getElementById("expertPhotoInput").click(); });
  document.getElementById("expertPhotoInput").addEventListener("change", async function () {
    const file = this.files && this.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      showToast("Выберите фото PNG, JPG или WebP до 5 МБ");
      this.value = "";
      return;
    }
    try {
      const record = await storeAsset(file, "expert");
      state.expertPhotoId = record.id;
      this.value = "";
      renderExpertAvatars();
      markDirty();
      showToast("Фото эксперта добавлено");
    } catch (error) {
      showToast("Не удалось сохранить фото эксперта");
    }
  });
  document.getElementById("removeExpertPhotoButton").addEventListener("click", function () {
    state.expertPhotoId = "";
    renderExpertAvatars();
    markDirty();
  });

  document.getElementById("helpfulYesButton").addEventListener("click", function () { setFeedback("yes"); });
  document.getElementById("helpfulNoButton").addEventListener("click", function () { setFeedback("no"); });
  document.getElementById("addCommentButton").addEventListener("click", addComment);

  document.getElementById("saveButton").addEventListener("click", function () { saveDraft(false); });
  document.getElementById("publishButton").addEventListener("click", publishArticle);
  modeButton.addEventListener("click", function () { toggleMode(); });

  document.getElementById("desktopPreviewButton").addEventListener("click", function () {
    document.getElementById("articlePreview").classList.remove("mobile");
    this.classList.add("active");
    this.setAttribute("aria-pressed", "true");
    document.getElementById("mobilePreviewButton").classList.remove("active");
    document.getElementById("mobilePreviewButton").setAttribute("aria-pressed", "false");
  });
  document.getElementById("mobilePreviewButton").addEventListener("click", function () {
    document.getElementById("articlePreview").classList.add("mobile");
    this.classList.add("active");
    this.setAttribute("aria-pressed", "true");
    document.getElementById("desktopPreviewButton").classList.remove("active");
    document.getElementById("desktopPreviewButton").setAttribute("aria-pressed", "false");
  });

  document.getElementById("articleSearch").addEventListener("input", function () {
    const query = this.value.trim().toLocaleLowerCase("ru");
    let visibleCount = 0;
    document.querySelectorAll(".tree-section").forEach(function (section) {
      const matchesSection = !query || section.dataset.searchable.includes(query);
      let matchesChild = false;
      section.querySelectorAll(".tree-article").forEach(function (article) {
        const matches = !query || article.textContent.toLocaleLowerCase("ru").includes(query);
        article.hidden = !matches;
        if (matches) matchesChild = true;
      });
      const visible = matchesSection || matchesChild;
      section.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    document.getElementById("searchEmpty").hidden = visibleCount !== 0;
  });

  document.getElementById("menuButton").addEventListener("click", function () {
    const opened = sidebar.classList.toggle("open");
    this.setAttribute("aria-expanded", String(opened));
  });
  document.getElementById("newArticleButton").addEventListener("click", newArticle);

  document.getElementById("moreButton").addEventListener("click", function () {
    const opened = moreMenu.hidden;
    moreMenu.hidden = !opened;
    this.setAttribute("aria-expanded", String(opened));
  });
  document.addEventListener("click", function (event) {
    if (!moreMenu.hidden && !moreMenu.contains(event.target) && event.target.id !== "moreButton") {
      moreMenu.hidden = true;
      document.getElementById("moreButton").setAttribute("aria-expanded", "false");
    }
    if (!colorPopover.hidden && !colorPopover.contains(event.target) && !event.target.closest("[data-color-mode]")) {
      closeColorPopover();
    }
  });

  document.getElementById("fillSampleButton").addEventListener("click", function () {
    applyData(Object.assign({}, samples.delivery, {articleId: makeId("article"), section: (bootstrapData.sections[0] && bootstrapData.sections[0].name) || "", parent: "", editAccess: "all_editors", expertPhotoId: "", status: "draft", updatedAt: "", publishedAt: ""}), true);
    moreMenu.hidden = true;
    showToast("Пример заполнен, но ещё не сохранён");
  });
  document.getElementById("copyLinkButton").addEventListener("click", function () {
    const url = window.location.origin + "/kb?article=" + encodeURIComponent(state.articleId);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { showToast("Тестовая ссылка скопирована"); }, function () { showToast(url); });
    } else {
      showToast(url);
    }
    moreMenu.hidden = true;
  });
  document.getElementById("clearDraftButton").addEventListener("click", function () {
    if (!window.confirm("Очистить поля новой статьи? Сохранённые статьи не удалятся.")) return;
    moreMenu.hidden = true;
    newArticle();
    showToast("Открыта новая статья");
  });

  window.addEventListener("beforeunload", function (event) {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  document.getElementById("currentUserName").readOnly = true;
  document.getElementById("viewerRole").closest("label").hidden = true;
  if (!canEdit) {
    document.body.classList.add("kb-reader-only");
    ["settingsButton", "saveButton", "publishButton", "newArticleButton", "moreButton", "inlineSettingsButton", "modeButton"].forEach(function (id) {
      const element = document.getElementById(id);
      if (element) element.hidden = true;
    });
  }
  loadInitialData();
  updateLabels();
})();
