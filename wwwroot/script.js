const quizContainer = document.getElementById("quiz-container");
const resultContainer = document.getElementById("result");
const correctAnswersContainer = document.getElementById("correct-answers");
const submitButton = document.getElementById("submit");
const showAnswersButton = document.getElementById("show-answers");
const generateQuestionsButton = document.getElementById("generateQuestions");
const usernameInput = document.getElementById("username");
const restartButton = document.getElementById("restart");
const loginButton = document.getElementById("loginButton");
const helpButton = document.getElementById("help-button");
const timer = document.getElementById("timer");
const scoreButton = document.getElementById("scoreButton");
const backButton = document.getElementById("backButton"); 
const clearButton = document.getElementById("clearButton");
const helpContainer = document.getElementById("help-container");
const spacer = document.createElement("div");
const originalBackground = timer.style.background;
let timeLeft = 300;
let startTime = Date.now();
let timerInterval;
let mistakeTracker = {};
let questions = [];
let selectedQuestions = [];
let categories = [];
let isHelpVisible = false;
let answersVisible = false;
let questionsLoaded = false;
let questionsUploaded = false;
let categoriesLoaded = false;
let screenRefreshed = false;

$(document).ready(function () {
    let screenRefreshed = false;

    function loadQuestionsFromDB(callback) {
        $.getJSON("/Question/GetQuestions", function (data) {
            questions = data;
            questionsLoaded = true;

            if (questions.length >= 75) {
                questionsUploaded = true;
            } else {
                questionsUploaded = false;
            }

            if (callback) callback();

            if (!screenRefreshed && !questionsUploaded) {
                screenRefreshed = true;
                refreshUI();
            }
        }).fail(function (jqxhr, textStatus, error) {
            console.error("❌ Hiba történt a kérdések betöltésekor:", textStatus, error);
        });
    }

    function loadHelpContent(category) {
        const helpContainer = document.getElementById("help-container");
        const helpContentElement = document.getElementById("help-content");

        if (!helpContainer) {
            console.error("⚠️ A 'help-container' nem található!");
            return;
        }

        if (category !== "alapfogalmak") {
            helpContentElement.innerHTML = "<p>Nincs elérhető kérdés az 'Alapfogalmak' kategóriában.</p>";
            helpContainer.style.display = "none";
            return;
        }

        $.getJSON("/Question/GetHelpContent", function (data) {
            helpContentElement.innerHTML = "";

            data.forEach(item => {
                const title = item.title || "N/A";
                const description = item.description || "N/A";

                const contentContainer = document.createElement("div");
                contentContainer.classList.add("question-block");

                contentContainer.style.border = "2px solid #ccc";
                contentContainer.style.padding = "15px";
                contentContainer.style.margin = "10px 0";
                contentContainer.style.borderRadius = "10px";
                contentContainer.style.backgroundColor = "#f9f9f9";
                contentContainer.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.1)";
                contentContainer.style.position = "relative";

                const question = document.createElement("p");
                question.innerHTML = `<strong>${title}</strong>`;
                question.style.margin = "0";
                question.style.padding = "5px";
                question.style.cursor = "pointer";

                const descriptionElement = document.createElement("p");
                descriptionElement.innerHTML = description;
                descriptionElement.style.display = "none";
                descriptionElement.style.marginTop = "5px";
                descriptionElement.style.padding = "10px";
                descriptionElement.style.backgroundColor = "#e6f7ff";
                descriptionElement.style.borderLeft = "4px solid #007bff";
                descriptionElement.style.borderRadius = "5px";
                descriptionElement.style.boxShadow = "0px 0px 5px rgba(0, 0, 0, 0.1)";
                descriptionElement.style.cursor = "pointer";

                const closeButton = document.createElement("span");
                closeButton.innerHTML = "&#10005;";
                closeButton.style.fontSize = "20px";
                closeButton.style.cursor = "pointer";
                closeButton.style.position = "absolute";
                closeButton.style.top = "10px";
                closeButton.style.right = "10px";
                closeButton.style.color = "#ff0000";
                closeButton.style.display = "none";

                question.addEventListener("click", function () {
                    const currentDisplay = descriptionElement.style.display;
                    descriptionElement.style.display = currentDisplay === "none" ? "block" : "none";
                    closeButton.style.display = descriptionElement.style.display === "block" ? "block" : "none";
                });

                closeButton.addEventListener("click", function () {
                    descriptionElement.style.display = "none";
                    closeButton.style.display = "none";
                });

                contentContainer.appendChild(question);
                contentContainer.appendChild(descriptionElement);
                contentContainer.appendChild(closeButton);

                helpContentElement.appendChild(contentContainer);
            });

            if (helpContentElement.children.length === 0) {
                helpContainer.style.display = "none";
            } else {
                helpContainer.style.display = "block";
            }
        }).fail(function (jqxhr, textStatus, error) {
            console.error("❌ Hiba történt a segítség betöltésekor:", textStatus, error);
        });
    }

    document.getElementById("help-category").addEventListener("change", function () {
        const selectedCategory = this.value;
        loadHelpContent(selectedCategory);
    });

    function refreshUI() {
        setTimeout(() => {
            location.reload();
        }, 500);
    }

    loadQuestionsFromDB();
    loadHelpContent();

    $.getJSON("/Question/GetCategories", function (data) {
    categories = data;

    const categoryDropdown = document.getElementById("help-category");
    categoryDropdown.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "Minden";
    allOption.textContent = "Minden";
    categoryDropdown.appendChild(allOption);

    data.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryDropdown.appendChild(option);
    });

    const alapfogalmakOption = document.createElement("option");
    alapfogalmakOption.value = "alapfogalmak";
    alapfogalmakOption.textContent = "Alapfogalmak";
    categoryDropdown.appendChild(alapfogalmakOption);

    document.getElementById("help-container").style.display = "none";
    document.getElementById("help-button").addEventListener("click", function () {
        showHelp(true);
    });
    document.getElementById("help-category").addEventListener("change", function () {
        showHelp(false);
    });
});

    loadQuestionsFromDB(() => {
        if (!questionsUploaded) {
            $.getJSON("questions.json", function (questions) {

                function uploadQuestion(index) {
                    if (index >= questions.length) {
                        loadQuestionsFromDB();
                        return;
                    }

                    const question = questions[index];

                    const formData = new FormData();
                    formData.append("questionText", question.question);
                    formData.append("option1", question.options[0]);
                    formData.append("option2", question.options[1]);
                    formData.append("option3", question.options[2]);
                    formData.append("answer", question.answer);
                    formData.append("points", question.points);
                    formData.append("image", question.image || "");
                    formData.append("category", question.category);

                    fetch("/Question/AddQuestion", {
                        method: "POST",
                        body: formData
                    })
                        .then(response => {
                            return response.text();
                        })
                        .then(result => {
                            uploadQuestion(index + 1);
                        })
                        .catch(error => {
                            console.error(`❌ (${index + 1}) Hiba történt a kérdés küldésekor:`, error);
                        });
                }

                uploadQuestion(0);
            }).fail(function (jqxhr, textStatus, error) {
                console.error("❌ Hiba a questions.json betöltésekor:", textStatus, error);
            });
        }
    });

    document.getElementById("startQuizButton").addEventListener("click", () => {
        let selectedCategory = document.getElementById("quiz-category").value;

        let filteredQuestions = questions.filter(q => selectedCategory === "Minden" || q.category === selectedCategory);

        if (usernameInput.value.trim() === "") {
            alert("Kérlek, add meg a neved!");
            console.warn("⚠ Nincs megadva felhasználónév!");
            return;
        }

        if (filteredQuestions.length === 0) {
            alert("Nincsenek elérhető kérdések ebben a kategóriában!");
            return;
        }
        startQuiz(filteredQuestions);
    });

    function startQuiz(filteredQuestions) {
        selectedQuestions = filteredQuestions;
        document.getElementById("quiz-category-container").style.display = "none";
        usernameInput.style.display = "none";
        $("#timer").css("display", "block");
        $("#scoreButton").css("display", "none");
        $("#help-button").css("display", "none");
        $("#backButton").css("display", "block");
        $("#clearScores").css("display", "none");
        $("#clearButton").css("display", "none");

        loadQuiz(filteredQuestions);
    }

    spacer.style.height = timer.offsetHeight + "px";
    timer.parentNode.insertBefore(spacer, timer);

    window.addEventListener("scroll", function () {
        if (window.scrollY > spacer.offsetTop) {
            timer.style.position = "fixed";
            timer.style.top = "10px";
            timer.style.right = "100px";
            timer.style.left = "auto";
            timer.style.transform = "none";
            timer.style.zIndex = "1000";
            timer.style.background = "white";
            timer.style.padding = "10px";
            timer.style.boxShadow = "0px 2px 10px rgba(0,0,0,0.2)";
        } else {
            timer.style.position = "static";
            timer.style.boxShadow = "none";
            timer.style.background = originalBackground;
        }
    });
});

function BackToHomePage() {
    window.location.href = "index.html";
}
function Redirect() {
    window.location.href = "register.html";
}
function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Lejárt az idő! A teszt automatikusan kiértékelődik.");
            checkAnswers();
            return;
        }

        timeLeft--;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent = `Idő: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomQuestions(allQuestions, count, targetPoints) {
    if (!allQuestions || allQuestions.length === 0) {
        console.error("Hiba: Az allQuestions tömb üres vagy nincs megfelelően inicializálva!");
        return [];
    }

    let categories = [...new Set(allQuestions.map(q => q.category))];
    let selectedQuestions = [];
    let remainingQuestions = [...allQuestions];
    let currentPoints = 0;

    categories.forEach(category => {
        let categoryQuestions = remainingQuestions.filter(q => q.category === category);
        if (categoryQuestions.length > 0) {
            shuffleArray(categoryQuestions);
            let selected = categoryQuestions[0];
            selectedQuestions.push(selected);
            remainingQuestions = remainingQuestions.filter(q => q !== selected);
            currentPoints += selected.points;
        }
    });

    while (selectedQuestions.length < count && remainingQuestions.length > 0) {
        shuffleArray(remainingQuestions);
        let selected = remainingQuestions[0];

        if (currentPoints + selected.points <= targetPoints) {
            selectedQuestions.push(selected);
            currentPoints += selected.points;
        }
        remainingQuestions.shift();
    }
    return selectedQuestions;
}

function loadQuiz(selectedQuestions) {
    if (!selectedQuestions || selectedQuestions.length === 0) {
        console.error("Hiba: A selectedQuestions tömb üres vagy nincs megfelelően betöltve!");
        return;
    }

    quizContainer.innerHTML = "";
    mistakeTracker = {};

    shuffledQuestions = getRandomQuestions(selectedQuestions, 27, 55);

    if (shuffledQuestions.length === 0) {
        console.error("Hiba: Nem sikerült kérdéseket kiválasztani!");
        return;
    }

    shuffledQuestions.forEach((q, index) => {
        if (!q) {
            console.error('⚠ Hiba: Undefined kérdés a shuffledQuestions listában!', index);
            return;
        }

        const questionElem = document.createElement("div");
        questionElem.classList.add("question-block");
        questionElem.setAttribute("data-index", index);

        questionElem.style.border = "2px solid #ccc";
        questionElem.style.padding = "15px";
        questionElem.style.margin = "10px 0";
        questionElem.style.borderRadius = "10px";
        questionElem.style.backgroundColor = "#f9f9f9";
        questionElem.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.1)";

        let questionText = `${index + 1}. ${q.questionText}`;
        if (!questionText.includes(`[${q.points} pont]`)) {
            questionText += ` [${q.points} pont]`;
        }

        if (q.image) {
            questionText += `<br><img src="images/${q.image}" alt="Kép a kérdéshez" class="question-image" style="margin-top: 10px;">`;
        }

        questionElem.innerHTML = `<p>${questionText}</p>`;

        let optionLabels = ['A', 'B', 'C'];

        q.options.forEach((option, i) => {
            const optionContainer = document.createElement("div");
            optionContainer.classList.add("option");

            const inputElem = document.createElement("input");
            inputElem.type = "radio";
            inputElem.name = `question_${index}`;
            inputElem.value = i;
            inputElem.id = `question_${index}_option_${i}`;
            inputElem.setAttribute("data-index", index);

            const labelElem = document.createElement("label");
            labelElem.textContent = `${optionLabels[i]}. ${option}`;
            labelElem.setAttribute("for", inputElem.id);

            optionContainer.appendChild(inputElem);
            optionContainer.appendChild(labelElem);
            questionElem.appendChild(optionContainer);
        });

        quizContainer.appendChild(questionElem);
    });

    quizContainer.style.display = "block";
    submitButton.style.display = "inline-block";
    showAnswersButton.style.display = "inline-block";
    restartButton.style.display = "inline-block";
    backButton.style.display = "inline-block";

    timeLeft = 300;
    updateTimerDisplay();
    startTimer();
}

function saveScore(username, score, totalPoints, percentage, category) {
    let endTime = Date.now();
    let actualDuration = 300 - timeLeft;
    let duration = Math.floor((endTime - startTime) / 1000);
    let dataToSend = new FormData();
    dataToSend.append("username", username);
    dataToSend.append("scoreValue", score);
    dataToSend.append("totalPoints", totalPoints);
    dataToSend.append("percentage", percentage);
    dataToSend.append("category", category);
    dataToSend.append("duration", actualDuration);

    $.post({
        url: "/Score/PostScore",
        data: dataToSend,
        processData: false,
        contentType: false,
        success: function (response) {
            alert("Eredmény sikeresen mentve!");
        },
        error: function (xhr, status, error) {
            console.error("Hiba történt:", error);
            alert("Hiba történt az eredmény mentése közben. Kérlek, próbáld újra.");
        }
    });
}

function deleteAllScores() {
    const scores = JSON.parse(localStorage.getItem("scores"));
    if (!scores || scores.length === 0) {
        alert("Nincsenek törölhető eredmények.");
        return;
    }
    if (!confirm("Biztosan törölni szeretnéd az ÖSSZES eredményt?")) return;

    $.post("/Score/PostDeleteScore", function (response) {
        console.log("Szerver válasz:", response);

        alert(response.message);

        if (response.success) {
            localStorage.removeItem("scores");
            $("#scoreContainer").fadeOut(300, function () {
                $(this).empty();
            });
            $("#scoreButton").text("Eredmények kilistázása");
        }
    }).fail(function () {
        alert("Hiba történt az összes eredmény törlése közben.");
    });
}

$(document).on("click", "#clearButton", deleteAllScores);

function deleteScoreByUser(username) {
    let scoreElements = $(`.score-item[data-username='${username}']`);
    if (scoreElements.length === 0) {
        alert(`Nincs mit törölni a(z) ${username} esetében.`);
        return;
    }
    if (!confirm(`Biztosan törölni szeretnéd a(z) ${username} eredményeit?`)) return;

    $.post("/Score/PostDeleteScoreByUser", { username: username }, function (response) {
        console.log("Szerver válasz:", response);

        alert(response.message);

        if (response.success) {
            let scoreElements = $(`.score-item[data-username='${username}']`);
            console.log("Törlendő elemek:", scoreElements);

            if (scoreElements.length > 0) {
                scoreElements.fadeOut(300, function () {
                    $(this).remove();
                });
            } else {
                console.warn(`Nem található .score-item[data-username='${username}']`);
            }

            setTimeout(function () {
                if ($("#scoreContainer").children().length === 0) {
                    $("#scoreContainer").hide();
                    $("#scoreButton").text("Eredmények kilistázása");
                }
            }, 350);
        }
    }).fail(function () {
        alert(`Hiba történt ${username} eredményeinek törlése közben.`);
    });
}

$(document).on("click", ".delete-score-btn", function () {
    let username = $(this).data("username");
    console.log("Törlés gomb megnyomva:", username);
    deleteScoreByUser(username);
});

function listScore() {
    let scoreContainer = $("#scoreContainer");
    let scoreButton = $("#scoreButton");
    let scoreFilterContainer = $("#score-filter-container");
    let selectedCategory = $("#score-category").val();

    $("#maintitle").hide();
    $("#username").hide();
    $("#secondarytitle").hide();
    $("#quiz-category").hide();
    $("#startQuizButton").hide();
    $("#help-button").hide();
    $("#backButton").show();

    scoreFilterContainer.show();

    if (scoreContainer.is(":visible")) {
        scoreContainer.hide();
        scoreButton.text("Eredmények kilistázása");
        return;
    }

    $.get("/Score/GetScore", function (response) {
        let scores = response.scores || [];

        if (scores.length > 0) {
            localStorage.setItem("scores", JSON.stringify(scores));

            scores.sort((a, b) => b.scoreValue - a.scoreValue);

            if (selectedCategory !== "") {
                scores = scores.filter(score => score.category === selectedCategory);
            }

            if (scores.length > 0) {
                let scoresHtml = "";
                scores.forEach(score => {
                    let percentage = ((score.scoreValue / score.totalPoints) * 100).toFixed(2);
                    let timestamp = score.timestamp
                        ? new Date(score.timestamp).toLocaleString("hu-HU", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        }).replace(/(\s)(\d{2})\.(\d{2})\./, "$1$2$3")
                        : "N/A";

                    let duration = score.duration || 0;
                    let minutes = Math.floor(duration / 60);
                    let seconds = duration % 60;
                    let formattedDuration = `${minutes.toString().padStart(2, "0")}:${seconds
                        .toString()
                        .padStart(2, "0")}`;

                    scoresHtml += `
                        <div class="score-item" data-username="${score.username}" data-timestamp="${score.timestamp}" style="
                            border: 2px solid #3498db;
                            background-color: #ecf0f1;
                            padding: 15px;
                            margin: 10px 0;
                            border-radius: 10px;
                            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
                            position: relative;
                        ">
                            <p><strong>Felhasználónév:</strong> ${score.username}</p>
                            <p><strong>Pontszám:</strong> ${score.scoreValue}</p>
                            <p><strong>Összpont:</strong> ${score.totalPoints}</p>
                            <p><strong>Százalék:</strong> ${percentage}%</p>
                            <p><strong>Kategória:</strong> ${score.category}</p>
                            <p><strong>Időbélyeg:</strong> ${timestamp}</p>
                            <p><strong>Teljesítési idő</strong> ${formattedDuration}</p>
                            <button class="delete-score-btn" data-username="${score.username}" style="
                                background-color: #e74c3c;
                                color: white;
                                border: none;
                                padding: 8px 12px;
                                border-radius: 5px;
                                cursor: pointer;
                                position: absolute;
                                top: 10px;
                                right: 10px;
                            ">Törlés</button>
                        </div>
                    `;
                });
                scoreContainer.html(scoresHtml).show();
                scoreButton.text("Eredmények elrejtése");
            } else {
                scoreContainer.html("<p>Nincs elérhető adat a kiválasztott kategóriában.</p>").show();
                scoreButton.text("Eredmények elrejtése");
            }
        } else {
            scoreContainer.html("<p>Nincs elérhető adat.</p>").show();
            scoreButton.text("Eredmények elrejtése");
        }
    }).fail(function () {
        scoreContainer.html("<p>Hiba történt a pontszámok lekérése közben.</p>").show();
        scoreButton.text("Eredmények elrejtése");
    });
}

function checkAnswers() {
    if (resultContainer.style.display === "block") {
        resultContainer.style.display = "none";
    } else {
        resultContainer.style.display = "block";
    }

    if (timeLeft > 0 && !confirm("Biztosan be akarod fejezni a tesztet?")) {
        return;
    }

    let score = 0;
    let totalPoints = 55;
    mistakeTracker = {};
    let unanswered = false;

    const selectedCategory = $("#quiz-category").val();

    /*totalPoints = selectedCategory === "Szituációk" ? 12 :
        selectedCategory === "Táblák" ? 16 :
            selectedCategory === "Paragrafusok" ? 27 : 55;*/

    if (!selectedQuestions || selectedQuestions.length === 0) {
        console.error("❌ Hiba: A selectedQuestions tömb üres vagy nincs megfelelően inicializálva!");
        return;
    }

    $("input[type='radio']:checked").each(function () {
        let questionIndex = $(this).data("index");

        if (questionIndex === undefined) {
            console.error("❌ Hiba: Az input elemnek nincs 'data-index' attribútuma!");
            return;
        }

        if (questionIndex >= shuffledQuestions.length) {
            console.error(`❌ Hiba: A questionIndex (${questionIndex}) túl nagy! A tömb hossza: ${shuffledQuestions.length}`);
            return;
        }

        let q = shuffledQuestions[questionIndex];
        let selectedOption = $(this).val();
        const optionsContainer = $(`input[name='question_${questionIndex}']`).parent();

        if (!q) {
            console.error(`❌ Hiba: A kérdés undefined (index: ${questionIndex})`);
            return;
        }

        if (selectedOption !== undefined) {
            optionsContainer.css("border", "");
            const selectedAnswer = q.options[selectedOption];

            if (selectedAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
                score += q.points;
            } else {
                mistakeTracker[q.category] = (mistakeTracker[q.category] || 0) + 1;
            }
        } else {
            optionsContainer.css("border", "2px solid red");
            mistakeTracker[q.category] = (mistakeTracker[q.category] || 0) + 1;
            unanswered = true;
        }
    });

    if (unanswered && !confirm("Nem válaszoltál minden kérdésre. Biztosan ki akarod értékelni és menteni az eredményt?")) {
        return;
    }

    clearInterval(timerInterval);

    let percentage = ((score / totalPoints) * 100).toFixed(2);
    let message = percentage >= 60 ? `Gratulálok, sikerült a ${selectedCategory} teszt!` : "Sajnálom, nem sikerült! Próbáld meg újra.";

    const previousStatus = localStorage.getItem("userTestStatus");
    if (percentage < 60) {
        localStorage.setItem("userTestStatus", "incomplete");
    } else {
        localStorage.setItem("userTestStatus", "completed");
    }
    let filteredQuestions = questions.filter(q => selectedCategory === "Minden" || q.category === selectedCategory);
    let questionCount = filteredQuestions.length;
    if (previousStatus === "incomplete") {
        let totalPoints = 0;
        let halfPointsQuestions = [];
        for (let i = 0; i < filteredQuestions.length; i++) {
            totalPoints += filteredQuestions[i].points;
            halfPointsQuestions.push(filteredQuestions[i]);
            if (totalPoints >= 55 / 2) {
                break;
            }
        }
        filteredQuestions = halfPointsQuestions;
        questionCount = filteredQuestions.length;
    }
    shuffledQuestions = getRandomQuestions(filteredQuestions, questionCount, 55);
    localStorage.setItem("userTestStatus", "incomplete");

    resultContainer.innerHTML = `Eredmény: ${score} / ${totalPoints} pont (${percentage}%) <br> ${message}`;
    resultContainer.style.display = "block";

    let username = $("#username").val().trim();
    if (username) {
        saveScore(username, score, totalPoints, percentage, selectedCategory);
    } else {
        console.warn("⚠ A pontszám mentése sikertelen: nincs megadva felhasználónév.");
    }
}

function toggleCorrectAnswers() {
    if (answersVisible) {
        hideAnswers();
        showAnswersButton.textContent = "Helyes Válaszok";
    } else {
        showCorrectAnswers();
        showAnswersButton.textContent = "Elrejtés";
    }
    answersVisible = !answersVisible;
}

function showCorrectAnswers() {
    markAnswersInQuiz(true);
    clearInterval(timerInterval);
}

function clearSelections() {
    selectedQuestions.forEach((q, index) => {
        let selectedOption = document.querySelector(`input[name='question_${index}']:checked`);
        if (selectedOption) {
            selectedOption.checked = false;
        }
    });
}

function hideAnswers() {
    markAnswersInQuiz(false);
    clearSelections();
}

function markAnswersInQuiz(show) {
    shuffledQuestions.forEach((q, index) => {
        const correctIndex = q.options.indexOf(q.answer);
        const selectedOption = document.querySelector(`input[name='question_${index}']:checked`);
        let selectedValue = selectedOption ? parseInt(selectedOption.value) : null;

        q.options.forEach((option, i) => {
            let optionInput = document.querySelector(`input[name='question_${index}'][value='${i}']`);
            let optionLabel = document.querySelector(`label[for='${optionInput.id}']`);

            if (show) {
                let symbol = "";
                if (i === correctIndex) {
                    symbol = " ✔";
                    optionLabel.style.color = "green";
                }
                if (selectedValue !== null && i === selectedValue && i !== correctIndex) {
                    symbol = " ❌";
                    optionLabel.style.color = "red";
                }
                optionLabel.textContent = option + symbol;
                optionInput.disabled = true;
            } else {
                optionLabel.textContent = option;
                optionLabel.style.color = "";
                optionInput.disabled = false;
            }
        });
    });
}

function showHelp(fromButton = false) {
    const categorySelect = document.getElementById("help-category");
    const category = categorySelect.value;
    const helpContentElement = document.getElementById("help-content");
    const helpContainer = document.getElementById("help-container");
    const helpButton = document.getElementById("help-button");

    if (fromButton) {
        if (helpContainer.style.display === "block") {
            helpContainer.style.display = "none";
            helpButton.textContent = "Segítség megjelenítése";
            categorySelect.selectedIndex = 0;
            return;
        } else {
            helpContainer.style.display = "block";
            helpButton.textContent = "Segítség elrejtése";
        }
    }

    helpContentElement.innerHTML = "";

    if (category === "Alapfogalmak") {
        if (helpContent.length === 0) {
            helpContentElement.innerHTML = "<p>Nincs elérhető kérdés az 'Alapfogalmak' kategóriában.</p>";
        } else {
            helpContent.forEach(item => {
                const title = item.title || "N/A";
                const description = item.description || "N/A";

                const contentContainer = document.createElement("div");
                contentContainer.classList.add("question-block");

                contentContainer.style.border = "2px solid #ccc";
                contentContainer.style.padding = "15px";
                contentContainer.style.margin = "10px 0";
                contentContainer.style.borderRadius = "10px";
                contentContainer.style.backgroundColor = "#f9f9f9";
                contentContainer.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.1)";
                contentContainer.style.position = "relative";

                const question = document.createElement("p");
                question.innerHTML = `<strong>${title}</strong>`;
                question.style.margin = "0";
                question.style.padding = "5px";
                question.style.cursor = "pointer";

                const descriptionElement = document.createElement("p");
                descriptionElement.innerHTML = description;
                descriptionElement.style.display = "none";
                descriptionElement.style.marginTop = "5px";
                descriptionElement.style.padding = "10px";
                descriptionElement.style.background = "#e6f7ff";
                descriptionElement.style.borderLeft = "4px solid #007bff";
                descriptionElement.style.borderRadius = "5px";
                descriptionElement.style.boxShadow = "0px 0px 5px rgba(0, 0, 0, 0.1)";
                descriptionElement.style.cursor = "pointer";

                const closeButton = document.createElement("span");
                closeButton.innerHTML = "&#10005;";
                closeButton.style.fontSize = "20px";
                closeButton.style.cursor = "pointer";
                closeButton.style.position = "absolute";
                closeButton.style.top = "10px";
                closeButton.style.right = "10px";
                closeButton.style.color = "#ff0000";
                closeButton.style.display = "none";

                question.addEventListener("click", function () {
                    const currentDisplay = descriptionElement.style.display;
                    descriptionElement.style.display = currentDisplay === "none" ? "block" : "none";

                    closeButton.style.display = descriptionElement.style.display === "block" ? "block" : "none";
                });

                closeButton.addEventListener("click", function () {
                    /*helpContainer.style.display = "none";
                    helpButton.textContent = "Segítség megjelenítése";
                    categorySelect.selectedIndex = 0;*/

                    descriptionElement.style.display = "none";
                    closeButton.style.display = "none";
                });

                contentContainer.appendChild(question);
                contentContainer.appendChild(descriptionElement);
                contentContainer.appendChild(closeButton);
                helpContentElement.appendChild(contentContainer);
            });
        }
    } else {
        const filteredQuestions = category === "Minden"
            ? questions
            : questions.filter(q => (q.Category || q.category || "").trim().toLowerCase() === category.trim().toLowerCase());

        if (filteredQuestions.length === 0) {
            helpContentElement.innerHTML = "<p>Nincs elérhető kérdés ebben a kategóriában.</p>";
        } else {
            filteredQuestions.forEach(item => {
                const questionText = item.questionText || "N/A";
                const answer = item.answer || "N/A";
                const imagePath = item.image || "";
                const itemCategory = (item.Category || item.category || "").trim().toLowerCase();

                const questionContainer = document.createElement("div");
                questionContainer.classList.add("question-block");

                questionContainer.style.border = "2px solid #ccc";
                questionContainer.style.padding = "15px";
                questionContainer.style.margin = "10px 0";
                questionContainer.style.borderRadius = "10px";
                questionContainer.style.backgroundColor = "#f9f9f9";
                questionContainer.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.1)";
                questionContainer.style.position = "relative";

                const question = document.createElement("p");
                question.innerHTML = `<strong>Kérdés:</strong> ${questionText}`;
                question.style.margin = "0";
                question.style.padding = "5px";
                question.style.cursor = imagePath.trim() !== "" ? "default" : "pointer";

                let image = null;
                if (imagePath.trim() !== "") {
                    image = document.createElement("img");
                    image.src = `images/${imagePath}`;
                    image.alt = "Kép a kérdéshez";
                    image.style.maxWidth = "100%";
                    image.style.height = "auto";
                    image.style.margin = "10px 0";
                    image.style.borderRadius = "5px";
                    image.style.boxShadow = "0px 0px 5px rgba(0, 0, 0, 0.2)";
                    image.style.cursor = "pointer";
                }

                const answerElement = document.createElement("p");
                answerElement.innerHTML = `<strong>Válasz:</strong> ${answer}`;
                answerElement.style.display = "none";
                answerElement.style.marginTop = "5px";
                answerElement.style.padding = "10px";
                answerElement.style.background = "#e6f7ff";
                answerElement.style.borderLeft = "4px solid #007bff";
                answerElement.style.borderRadius = "5px";
                answerElement.style.boxShadow = "0px 0px 5px rgba(0, 0, 0, 0.1)";
                answerElement.style.cursor = "default";

                const closeButton = document.createElement("span");
                closeButton.innerHTML = "&#10005;";
                closeButton.style.fontSize = "12px";
                closeButton.style.cursor = "pointer";
                closeButton.style.position = "absolute";
                closeButton.style.top = "10px";
                closeButton.style.right = "10px";
                closeButton.style.color = "#ff0000";
                closeButton.style.display = "none";

                if (image) {
                    image.addEventListener("click", function () {
                        const currentDisplay = answerElement.style.display;
                        answerElement.style.display = currentDisplay === "none" ? "block" : "none";

                        closeButton.style.display = answerElement.style.display === "block" ? "block" : "none";
                    });
                }

                if (imagePath.trim() === "") {
                    question.addEventListener("click", function () {
                        const currentDisplay = answerElement.style.display;
                        answerElement.style.display = currentDisplay === "none" ? "block" : "none";

                        closeButton.style.display = answerElement.style.display === "block" ? "block" : "none";
                    });
                }

                closeButton.addEventListener("click", function () {
                    /*helpContainer.style.display = "none";
                    helpButton.textContent = "Segítség megjelenítése";
                    categorySelect.selectedIndex = 0;*/

                    answerElement.style.display = "none";
                    closeButton.style.display = "none";
                });

                questionContainer.appendChild(question);
                if (image) questionContainer.appendChild(image);
                questionContainer.appendChild(answerElement);
                questionContainer.appendChild(closeButton);
                helpContentElement.appendChild(questionContainer);
            });
        }
    }

    helpContainer.style.display = "block";
}

function smoothScrollToTop() {
    const startPosition = window.scrollY;
    const duration = 600;
    const startTime = performance.now();

    function scrollStep(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);

        window.scrollTo(0, startPosition * (1 - easeOutQuad));

        if (elapsedTime < duration) {
            requestAnimationFrame(scrollStep);
        }
    }

    requestAnimationFrame(scrollStep);
}

function restartQuiz() {
    quizContainer.innerHTML = "";
    resultContainer.innerHTML = "";
    correctAnswersContainer.innerHTML = "";
    let categorySelect = document.getElementById("quiz-category");
    if (!categorySelect) {
        console.warn("⚠ Hiba: A kérdéskategória kiválasztó ('quiz-category') nem található!");
        return;
    }
    loadQuiz(shuffledQuestions);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

submitButton.addEventListener("click", checkAnswers);
showAnswersButton.addEventListener("click", showCorrectAnswers);
restartButton.addEventListener("click", restartQuiz);
showAnswersButton.addEventListener("click", toggleCorrectAnswers);