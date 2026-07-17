const appState = {
    user: null,
    db: null,
    goals: []
};

const subjectColors = {
    Physics: "#38bdf8",
    Chemistry: "#34d399",
    Mathematics: "#c084fc",
    Exams: "#f59e0b"
};

function byId(id) {
    return document.getElementById(id);
}

function todayIso() {
    return new Date().toISOString().split("T")[0];
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function showMessage(message, isError = true) {
    const messageElement = byId("message");
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = isError ? "message show error" : "message show success";
    messageElement.style.display = "block";

    window.clearTimeout(messageElement.hideTimer);
    messageElement.hideTimer = window.setTimeout(() => {
        messageElement.classList.remove("show");
        messageElement.style.display = "none";
    }, 4500);
}

function setModalOpen(modal, isOpen) {
    if (!modal) return;

    modal.classList.toggle("show", isOpen);
    modal.style.display = isOpen ? "flex" : "none";
    document.body.style.overflow = isOpen ? "hidden" : "";
}

function setButtonLoading(button, label) {
    if (!button) return () => {};

    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${label}`;

    return () => {
        button.disabled = false;
        button.innerHTML = originalHtml;
    };
}

function ensureSignedIn() {
    if (!appState.user || !appState.db) {
        showMessage("Please sign in again to continue.", true);
        return false;
    }

    return true;
}

function updateUserUi(user) {
    const userName = byId("userName");
    const dropdownUserName = byId("dropdownUserName");
    const userEmail = byId("userEmail");

    const name = user.displayName || user.email?.split("@")[0] || "Student";

    if (userName) {
        userName.textContent = name;
    }

    if (dropdownUserName) {
        dropdownUserName.textContent = name;
    }

    if (userEmail) {
        userEmail.textContent = user.email || "";
    }
}

async function getUserGoals() {
    const snapshot = await appState.db
        .collection("goals")
        .where("userId", "==", appState.user.uid)
        .get();

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));
}

async function loadGoals(date = todayIso()) {
    if (!ensureSignedIn()) return [];

    const isToday = date === todayIso();
    const container = isToday ? byId("todayGoals") : byId("historyGoals");
    if (!container) return [];

    container.innerHTML = '<p class="no-goals">Loading goals...</p>';

    try {
        const goals = (await getUserGoals())
            .filter((goal) => goalDate(goal) === date)
            .sort((a, b) => Number(a.completed) - Number(b.completed) || goalTimestamp(b) - goalTimestamp(a));

        appState.goals = goals;
        renderGoals(goals, container, isToday);

        if (isToday) {
            updateProgress(goals);
            updateSubjectChart(goals);
        }

        return goals;
    } catch (error) {
        console.error("Unable to load goals:", error);
        container.innerHTML = '<p class="no-goals">Unable to load goals right now.</p>';
        showMessage("Could not load your goals. Please refresh and try again.", true);
        return [];
    }
}

function renderGoals(goals, container, isTodayView) {
    container.innerHTML = "";

    if (!goals.length) {
        container.innerHTML = isTodayView
            ? '<p class="no-goals">No goals for today. Add your first target to begin.</p>'
            : '<p class="no-goals">No goals found for this date.</p>';
        return;
    }

    goals.forEach((goal) => {
        container.appendChild(createGoalElement(goal, isTodayView));
    });
}

function createGoalElement(goal, isTodayView) {
    const card = document.createElement("article");
    card.className = `goal-item ${goal.completed ? "completed" : ""}`;
    card.dataset.id = goal.id;

    const subject = escapeHtml(goal.subject);
    const topic = escapeHtml(goal.topic);
    const target = escapeHtml(goal.target);
    const time = Number(goal.time || goal.timeSpent || 0);
    const status = goal.completed ? "Completed" : "Pending";

    card.innerHTML = `
        <div class="goal-header">
            <span class="goal-subject" style="--subject-color: ${subjectColors[goal.subject] || "#ffffff"}">${subject}</span>
            <span class="goal-status ${goal.completed ? "completed" : "pending"}">${status}</span>
        </div>
        <div class="goal-topic">${topic}</div>
        <div class="goal-target">${target}</div>
        <div class="goal-meta">
            <span><i class="fas fa-clock"></i> ${Number.isInteger(time) ? time : time.toFixed(1)} hours</span>
            <span><i class="fas fa-calendar-day"></i> ${formatDate(goalDate(goal))}</span>
        </div>
        <div class="goal-actions">
            <button class="complete-btn" type="button" data-action="toggle" data-id="${goal.id}">
                <i class="fas fa-${goal.completed ? "rotate-left" : "check"}"></i>
                ${goal.completed ? "Reopen" : "Complete"}
            </button>
            <button class="edit-btn" type="button" data-action="edit" data-id="${goal.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" type="button" data-action="delete" data-id="${goal.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    if (!isTodayView) {
        card.querySelector('[data-action="toggle"]')?.remove();
    }

    return card;
}

function updateProgress(goals) {
    const completed = goals.filter((goal) => goal.completed).length;
    const total = goals.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    if (byId("completedGoals")) byId("completedGoals").textContent = completed;
    if (byId("totalGoals")) byId("totalGoals").textContent = total;
    if (byId("progressFill")) byId("progressFill").style.width = `${percent}%`;
}

function updateSubjectChart(goals) {
    if (!window.subjectChart?.update) return;

    const chartGoals = goals.map((goal) => ({
        subject: goal.subject,
        completed: goal.completed,
        timeSpent: Number(goal.time || goal.timeSpent || 0)
    }));

    window.subjectChart.update(chartGoals);
    renderChartLegend(chartGoals);
}

function renderChartLegend(goals) {
    const legend = byId("chartLegend");
    if (!legend) return;

    const totals = goals.reduce((acc, goal) => {
        if (!goal.completed) return acc;
        acc[goal.subject] = (acc[goal.subject] || 0) + Number(goal.timeSpent || 0);
        return acc;
    }, {});

    const entries = Object.entries(totals).filter(([, hours]) => hours > 0);
    legend.innerHTML = "";

    if (!entries.length) {
        legend.innerHTML = '<div class="legend-item muted">Complete a goal to build your priority chart.</div>';
        return;
    }

    entries
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, hours]) => {
            const item = document.createElement("div");
            item.className = "legend-item";
            item.innerHTML = `
                <span class="legend-color" style="background:${subjectColors[subject] || "#ffffff"}"></span>
                <span class="legend-subject">${escapeHtml(subject)}</span>
                <span class="legend-time">${hours.toFixed(hours % 1 ? 1 : 0)}h</span>
            `;
            legend.appendChild(item);
        });
}

async function addGoal(event) {
    event.preventDefault();
    if (!ensureSignedIn()) return;

    const form = event.currentTarget;
    const subject = byId("subject")?.value || "";
    const topic = byId("topic")?.value.trim() || "";
    const target = byId("target")?.value.trim() || "";
    const time = Number(byId("time")?.value || 0);

    if (!subject || !topic || !target || time <= 0) {
        showMessage("Fill in subject, topic, target, and a valid time.", true);
        return;
    }

    const button = form.querySelector('button[type="submit"]');
    const restoreButton = setButtonLoading(button, "Adding...");

    try {
        await appState.db.collection("goals").add({
            userId: appState.user.uid,
            subject,
            topic,
            target,
            time,
            date: todayIso(),
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        form.reset();
        setModalOpen(byId("addGoalModal"), false);
        showMessage("Goal added successfully.", false);
        await loadGoals(todayIso());
        await loadHistorySummary();
    } catch (error) {
        console.error("Unable to add goal:", error);
        showMessage(error.code === "permission-denied"
            ? "Firebase rules blocked this action. Deploy the updated rules."
            : "Unable to add goal. Please try again.", true);
    } finally {
        restoreButton();
    }
}

function openEditModal(goal) {
    byId("editGoalId").value = goal.id;
    byId("editSubject").value = goal.subject || "";
    byId("editTopic").value = goal.topic || "";
    byId("editTarget").value = goal.target || "";
    byId("editTime").value = Number(goal.time || goal.timeSpent || 0);
    setModalOpen(byId("editGoalModal"), true);
}

async function saveEditedGoal(event) {
    event.preventDefault();
    if (!ensureSignedIn()) return;

    const goalId = byId("editGoalId")?.value;
    if (!goalId) return;

    const button = event.currentTarget.querySelector('button[type="submit"]');
    const restoreButton = setButtonLoading(button, "Saving...");

    try {
        await appState.db.collection("goals").doc(goalId).update({
            subject: byId("editSubject").value,
            topic: byId("editTopic").value.trim(),
            target: byId("editTarget").value.trim(),
            time: Number(byId("editTime").value),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        setModalOpen(byId("editGoalModal"), false);
        showMessage("Goal updated.", false);
        await refreshActiveViews();
    } catch (error) {
        console.error("Unable to update goal:", error);
        showMessage("Unable to update this goal.", true);
    } finally {
        restoreButton();
    }
}

async function toggleGoal(goalId, button) {
    if (!ensureSignedIn()) return;

    const goal = appState.goals.find((item) => item.id === goalId);
    if (!goal) return;

    const restoreButton = setButtonLoading(button, goal.completed ? "Reopening..." : "Completing...");

    try {
        await appState.db.collection("goals").doc(goalId).update({
            completed: !goal.completed,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await loadGoals(todayIso());
        await loadHistorySummary();
    } catch (error) {
        console.error("Unable to toggle goal:", error);
        showMessage("Unable to update goal status.", true);
    } finally {
        restoreButton();
    }
}

async function deleteGoal(goalId) {
    if (!ensureSignedIn()) return;
    if (!window.confirm("Delete this goal permanently?")) return;

    try {
        await appState.db.collection("goals").doc(goalId).delete();
        showMessage("Goal deleted.", false);
        await refreshActiveViews();
    } catch (error) {
        console.error("Unable to delete goal:", error);
        showMessage("Unable to delete this goal.", true);
    }
}

async function refreshActiveViews() {
    await loadGoals(todayIso());

    const historyDate = byId("historyDate")?.value;
    if (historyDate && historyDate !== todayIso() && byId("historyContent")?.style.display !== "none") {
        await loadGoals(historyDate);
    }

    await loadHistorySummary();
}

async function loadHistorySummary() {
    if (!ensureSignedIn()) return;

    const summary = byId("historySummary");
    if (!summary) return;

    try {
        const goals = await getUserGoals();
        const grouped = goals.reduce((acc, goal) => {
            const date = goalDate(goal);
            if (!acc[date]) {
                acc[date] = { total: 0, completed: 0, hours: 0 };
            }

            acc[date].total += 1;
            acc[date].completed += goal.completed ? 1 : 0;
            acc[date].hours += Number(goal.time || goal.timeSpent || 0);
            return acc;
        }, {});

        const entries = Object.entries(grouped).sort(([a], [b]) => new Date(b) - new Date(a)).slice(0, 8);
        summary.innerHTML = "";

        if (!entries.length) {
            summary.innerHTML = '<p class="no-goals">Your study history will appear here.</p>';
            return;
        }

        entries.forEach(([date, stats]) => {
            const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
            const item = document.createElement("button");
            item.type = "button";
            item.className = "history-card";
            item.dataset.date = date;
            item.innerHTML = `
                <span class="history-date">${formatDate(date)}</span>
                <span class="history-stats">${stats.completed}/${stats.total} goals · ${stats.hours.toFixed(stats.hours % 1 ? 1 : 0)}h</span>
                <span class="history-mini-bar"><span style="width:${percent}%"></span></span>
            `;
            item.addEventListener("click", () => {
                byId("historyDate").value = date;
                loadGoals(date);
            });
            summary.appendChild(item);
        });
    } catch (error) {
        console.error("Unable to load history summary:", error);
        summary.innerHTML = '<p class="no-goals">Unable to load history.</p>';
    }
}

async function changePassword(event) {
    event.preventDefault();
    if (!ensureSignedIn()) return;

    const currentPassword = byId("currentPassword")?.value || "";
    const newPassword = byId("newPassword")?.value || "";
    const confirmPassword = byId("changePasswordConfirm")?.value || "";
    const message = byId("passwordChangeMessage");

    if (message) {
        message.className = "message";
        message.textContent = "";
        message.style.display = "none";
    }

    if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
        showInlineMessage(message, "Check your current password and matching new password.", "error");
        return;
    }

    const button = byId("submitPasswordChange");
    const restoreButton = setButtonLoading(button, "Updating...");

    try {
        const credential = firebase.auth.EmailAuthProvider.credential(appState.user.email, currentPassword);
        await appState.user.reauthenticateWithCredential(credential);
        await appState.user.updatePassword(newPassword);
        showInlineMessage(message, "Password updated successfully.", "success");
        byId("changePasswordForm").reset();
        window.setTimeout(() => setModalOpen(byId("changePasswordModal"), false), 1200);
    } catch (error) {
        console.error("Unable to change password:", error);
        showInlineMessage(message, error.code === "auth/wrong-password"
            ? "Current password is incorrect."
            : "Unable to update password.", "error");
    } finally {
        restoreButton();
    }
}

async function changeName(event) {
    event.preventDefault();
    if (!ensureSignedIn()) return;

    const newName = byId("newDisplayName")?.value.trim() || "";
    const message = byId("nameChangeMessage");

    if (newName.length < 2 || newName.length > 30) {
        showInlineMessage(message, "Name must be between 2 and 30 characters.", "error");
        return;
    }

    const button = byId("submitNameChange");
    const restoreButton = setButtonLoading(button, "Saving...");

    try {
        await appState.user.updateProfile({ displayName: newName });
        updateUserUi(appState.user);
        showInlineMessage(message, "Display name updated.", "success");
        window.setTimeout(() => setModalOpen(byId("changeNameModal"), false), 1000);
    } catch (error) {
        console.error("Unable to update name:", error);
        showInlineMessage(message, "Unable to update your name.", "error");
    } finally {
        restoreButton();
    }
}

function showInlineMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = `message show ${type}`;
    element.style.display = "block";
}

async function signOut() {
    try {
        await firebase.auth().signOut();
    } catch (error) {
        console.error("Unable to sign out:", error);
        showMessage("Unable to sign out. Please try again.", true);
    }
}

function setupEventListeners() {
    const accountInfo = byId("accountInfo");
    const accountDropdown = byId("accountDropdown");

    function setAccountDropdownOpen(isOpen) {
        if (!accountInfo || !accountDropdown) return;
        accountInfo.classList.toggle("dropdown-open", isOpen);
        accountInfo.classList.toggle("active", isOpen);
        accountInfo.setAttribute("aria-expanded", String(isOpen));
    }

    accountInfo?.addEventListener("click", (event) => {
        if (event.target.closest(".account-dropdown a")) return;
        event.preventDefault();
        setAccountDropdownOpen(!accountInfo.classList.contains("active"));
    });

    accountInfo?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setAccountDropdownOpen(!accountInfo.classList.contains("active"));
        }

        if (event.key === "Escape") {
            setAccountDropdownOpen(false);
        }
    });

    byId("goalForm")?.addEventListener("submit", addGoal);
    byId("editGoalForm")?.addEventListener("submit", saveEditedGoal);
    byId("changePasswordForm")?.addEventListener("submit", changePassword);
    byId("changeNameForm")?.addEventListener("submit", changeName);

    byId("addGoalBtn")?.addEventListener("click", () => setModalOpen(byId("addGoalModal"), true));
    byId("closeAddGoalModal")?.addEventListener("click", () => setModalOpen(byId("addGoalModal"), false));
    byId("cancelAddGoal")?.addEventListener("click", () => setModalOpen(byId("addGoalModal"), false));

    byId("closeEditModal")?.addEventListener("click", () => setModalOpen(byId("editGoalModal"), false));
    byId("cancelEdit")?.addEventListener("click", () => setModalOpen(byId("editGoalModal"), false));

    byId("changePasswordBtn")?.addEventListener("click", (event) => {
        event.preventDefault();
        setModalOpen(byId("changePasswordModal"), true);
    });
    byId("closePasswordModal")?.addEventListener("click", () => setModalOpen(byId("changePasswordModal"), false));
    byId("cancelPasswordChange")?.addEventListener("click", (event) => {
        event.preventDefault();
        setModalOpen(byId("changePasswordModal"), false);
    });

    byId("changeNameBtn")?.addEventListener("click", (event) => {
        event.preventDefault();
        byId("newDisplayName").value = appState.user?.displayName || "";
        setModalOpen(byId("changeNameModal"), true);
    });
    byId("closeNameModal")?.addEventListener("click", () => setModalOpen(byId("changeNameModal"), false));
    byId("cancelNameChange")?.addEventListener("click", () => setModalOpen(byId("changeNameModal"), false));

    byId("logoutBtn")?.addEventListener("click", (event) => {
        event.preventDefault();
        signOut();
    });

    byId("historyDate")?.addEventListener("change", (event) => loadGoals(event.target.value));

    byId("toggleHistory")?.addEventListener("click", async () => {
        const content = byId("historyContent");
        const chevron = byId("historyChevron");
        const isOpening = content.style.display === "none" || !content.style.display;

        content.style.display = isOpening ? "block" : "none";
        if (chevron) chevron.style.transform = isOpening ? "rotate(180deg)" : "rotate(0)";

        if (isOpening) {
            await loadHistorySummary();
            const selectedDate = byId("historyDate")?.value;
            if (selectedDate && selectedDate !== todayIso()) {
                await loadGoals(selectedDate);
            }
        }
    });

    document.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-action]");
        if (actionButton) {
            const goalId = actionButton.dataset.id;
            const goal = appState.goals.find((item) => item.id === goalId);

            if (actionButton.dataset.action === "toggle") toggleGoal(goalId, actionButton);
            if (actionButton.dataset.action === "edit" && goal) openEditModal(goal);
            if (actionButton.dataset.action === "delete") deleteGoal(goalId);
        }

        if (!event.target.closest(".account-menu")) {
            setAccountDropdownOpen(false);
        }

        document.querySelectorAll(".modal.show").forEach((modal) => {
            if (event.target === modal) setModalOpen(modal, false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setAccountDropdownOpen(false);
            document.querySelectorAll(".modal.show").forEach((modal) => setModalOpen(modal, false));
        }
    });
}

function setupAuthObserver() {
    if (typeof firebase === "undefined" || !firebase.auth) {
        console.error("Firebase Auth is unavailable.");
        return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        const authContainer = byId("authContainer");
        const mainContent = byId("mainContent");

        appState.user = user;
        appState.db = window.db || (firebase.firestore ? firebase.firestore() : null);

        if (!user) {
            if (authContainer) authContainer.style.display = "flex";
            if (mainContent) mainContent.style.display = "none";
            appState.goals = [];
            updateSubjectChart([]);
            return;
        }

        if (authContainer) authContainer.style.display = "none";
        if (mainContent) mainContent.style.display = "block";
        updateUserUi(user);

        const historyDate = byId("historyDate");
        if (historyDate) {
            historyDate.value = todayIso();
            historyDate.max = todayIso();
        }

        await loadGoals(todayIso());
        await loadHistorySummary();
    });
}

function initializeDashboard() {
    if (!byId("mainContent")) return;
    setupEventListeners();
    setupAuthObserver();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDashboard);
} else {
    initializeDashboard();
}
