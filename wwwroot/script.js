const quizContainer = document.getElementById("quiz-container");
const resultContainer = document.getElementById("result");
const correctAnswersContainer = document.getElementById("correct-answers");
const submitButton = document.getElementById("submit");
const showAnswersButton = document.getElementById("show-answers");
const generateQuestionsButton = document.getElementById("generateQuestions");
const usernameInput = document.getElementById("username");
const restartButton = document.getElementById("restart");
const loginButton = document.getElementById("loginButton");
const helpButton = document.getElementById("helpButton");
const timer = document.getElementById("timer");
const scoreButton = document.getElementById("scoreButton");
const backButton = document.getElementById("backButton"); 
const clearButton = document.getElementById("clearButton");
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

    function refreshUI() {
        setTimeout(() => {
            location.reload();
        }, 500);
    }

    loadQuestionsFromDB();

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

        document.getElementById("help-container").style.display = "none";
    }).fail(function (jqxhr, textStatus, error) {
        console.error("❌ Hiba történt a kategóriák betöltésekor:", textStatus, error);
    });

    document.getElementById("help-category").addEventListener("change", function () {
        showHelp(false);
    });

    document.getElementById("help-button").addEventListener("click", function () {
        showHelp(true);
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

        // Kérdések szűrése a kiválasztott kategória alapján
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

        // Elindítjuk a tesztet a szűrt kérdésekkel
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

    // Először minden kategóriából választunk egy kérdést
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

    // A maradék helyek kitöltése úgy, hogy az összpontszám 55 legyen
    while (selectedQuestions.length < count && remainingQuestions.length > 0) {
        shuffleArray(remainingQuestions);
        let selected = remainingQuestions[0];

        if (currentPoints + selected.points <= targetPoints) {
            selectedQuestions.push(selected);
            currentPoints += selected.points;
        }
        remainingQuestions.shift();
    }

    console.log("Összpontszám:", currentPoints);
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

        // Ellenőrizzük, hogy a kérdésben már szerepel-e a pontszám
        let questionText = `${index + 1}. ${q.questionText}`;
        if (!questionText.includes(`[${q.points} pont]`)) {
            questionText += ` [${q.points} pont]`;
        }

        // Ha van kép, hozzáadjuk
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
            console.log("Eredmény mentve:", response);
            alert("Eredmény sikeresen mentve!");
        },
        error: function (xhr, status, error) {
            console.error("Hiba történt:", error);
            alert("Hiba történt az eredmény mentése közben. Kérlek, próbáld újra.");
        }
    });
}

function deleteAllScores() {
    if (!confirm("Biztosan törölni szeretnéd az ÖSSZES eredményt?")) return;

    $.post("/Score/PostDeleteScore", function (response) {
        alert(response.message);
        if (response.success) {
            $("#scoreContainer").empty().hide();
            $("#scoreButton").text("Eredmények kilistázása");
        }
    }).fail(function () {
        alert("Hiba történt az összes eredmény törlése közben.");
    });
}

$(document).on("click", "#clearButton", deleteAllScores);

function deleteScoreByUser(username) {
    if (!confirm(`Biztosan törölni szeretnéd a(z) ${username} eredményeit?`)) return;

    $.post("/Score/PostDeleteScoreByUser", { username: username }, function (response) {
        alert(response.message);
        if (response.success) {
            $(`.score-item[data-username='${username}']`).remove();
            if ($("#scoreContainer").children().length === 0) {
                $("#scoreContainer").hide();
                $("#scoreButton").text("Eredmények kilistázása");
            }
        }
    }).fail(function () {
        alert(`Hiba történt ${username} eredményeinek törlése közben.`);
    });
}
$(document).on("click", ".delete-score-btn", function () {
    let username = $(this).data("username");
    deleteScoreByUser(username);
});

function listScore() {
    let scoreContainer = $("#scoreContainer");
    let scoreButton = $("#scoreButton");

    if (scoreContainer.children().length > 0) {
        scoreContainer.toggle();
        scoreButton.text(scoreContainer.is(":visible") ? "Eredmények elrejtése" : "Eredmények kilistázása");
        return;
    }

    $.get("/Score/GetScore", function (response) {
        if (response.scores && response.scores.length > 0) {
            let scoresHtml = response.scores.map(score => {
                let percentage = ((score.ScoreValue / score.TotalPoints) * 100).toFixed(2);
                let timestamp = score.timestamp
                    ? new Date(score.timestamp).toLocaleString("hu-HU", {
                        year: "numeric",
                        month: "long",  // 2-digit
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }).replace(/\./g, "").replace(/\s/g, ". ")
                    : "N/A";

                let duration = score.duration || 0;
                let minutes = Math.floor(duration / 60);
                let seconds = duration % 60;
                let formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                return `
                    <div id="score-${score.ScoreID}" class="score-item" data-username="${score.username}" style="
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
                        <p><strong>Százalék:</strong> ${score.percentage}%</p>
                        <p><strong>Kategória:</strong> ${score.category}</p>
                        <p><strong>Időbélyeg:</strong> ${timestamp}</p>
                        <p><strong>Teljesítési idő</strong> ${formattedDuration}</p>
                        <button onclick="deleteScoreByUser('${score.username}')" style="
                            background-color: #e74c3c;
                            color: white;
                            border: none;
                            padding: 5px 10px;
                            border-radius: 5px;
                            cursor: pointer;
                            position: absolute;
                            right: 10px;
                            top: 10px;
                        ">Törlés</button>
                    </div>
                `;
            })

            scoreContainer.html(scoresHtml).show();
            scoreButton.text("Eredmények elrejtése");

        } else {
            scoreContainer.html("<p>Nincs elérhető adat.</p>").show();
            scoreButton.text("Eredmények elrejtése");
        }
    }).fail(function () {
        scoreContainer.html("<p>Hiba történt a pontszámok lekérése közben.</p>").show();
        scoreButton.text("Eredmények elrejtése");
    });

    $("#maintitle").hide();
    $("#username").hide();
    $("#secondarytitle").hide();
    $("#quiz-category").hide()
    $("#startQuizButton").hide();
    $("#help-button").hide();
    $("#backButton").show();
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

        let q = shuffledQuestions[questionIndex];  // 🔹 Most már a kevert kérdésekből nézzük!
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
                console.log(`🎯 Helyes válasz! +${q.points} pont`);
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
                    symbol = " ✔"; // Helyes válasz
                    optionLabel.style.color = "green";
                }
                if (selectedValue !== null && i === selectedValue && i !== correctIndex) {
                    symbol = " ❌"; // Rossz válasz
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
    const helpContent = document.getElementById("help-content");
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

    const filteredQuestions = category === "Minden"
        ? questions
        : questions.filter(q => (q.Category || q.category || "").trim().toLowerCase() === category.trim().toLowerCase());

    helpContent.innerHTML = "";

    if (filteredQuestions.length === 0) {
        helpContent.innerHTML = "<p>Nincs elérhető kérdés ebben a kategóriában.</p>";
    } else {
        filteredQuestions.forEach(item => {
            const questionText = item.QuestionText || item.questionText || "N/A";
            const answer = item.Answer || item.answer || "N/A";
            const imagePath = item.Image || item.image || "";
            const itemCategory = (item.Category || item.category || "").trim().toLowerCase();

            const questionContainer = document.createElement("div");
            questionContainer.classList.add("question-block");

            questionContainer.style.border = "2px solid #ccc";
            questionContainer.style.padding = "15px";
            questionContainer.style.margin = "10px 0";
            questionContainer.style.borderRadius = "10px";
            questionContainer.style.backgroundColor = "#f9f9f9";
            questionContainer.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.1)";

            const question = document.createElement("p");
            question.innerHTML = `<strong>Kérdés:</strong> ${questionText}`;
            question.style.margin = "0";
            question.style.padding = "5px";

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
            }

            const answerElement = document.createElement("p");
            answerElement.innerHTML = `<strong>Válasz:</strong> ${answer}`;
            answerElement.style.display = "none";
            answerElement.style.marginTop = "5px";
            answerElement.style.padding = "10px";
            answerElement.style.background = "#e6f7ff"; // Világoskék háttér
            answerElement.style.borderLeft = "4px solid #007bff"; // Kiemelés
            answerElement.style.borderRadius = "5px";
            answerElement.style.boxShadow = "0px 0px 5px rgba(0, 0, 0, 0.1)";
            answerElement.style.cursor = "default";

            if (itemCategory === "táblák" || itemCategory === "szituációk") {
                if (image) {
                    image.style.cursor = "pointer";
                    image.addEventListener("click", function () {
                        answerElement.style.display = answerElement.style.display === "none" ? "block" : "none";
                    });
                }
            }
            else if (itemCategory === "paragrafusok") {
                questionContainer.style.cursor = "pointer";
                questionContainer.addEventListener("click", function (event) {
                    if (!answerElement.contains(event.target)) {
                        answerElement.style.display = answerElement.style.display === "none" ? "block" : "none";
                    }
                });
            }

            questionContainer.appendChild(question);
            if (image) questionContainer.appendChild(image);
            questionContainer.appendChild(answerElement);
            helpContent.appendChild(questionContainer);
        });
    }
    helpContainer.style.display = "block";
}

function smoothScrollToTop() {
    const startPosition = window.scrollY;
    const duration = 600; // Az animáció időtartama (ms)
    const startTime = performance.now();

    function scrollStep(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeOutQuad = 1 - (1 - progress) * (1 - progress); // Egy kis easing hatás

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
    loadQuiz();
    window.scrollTo({ top: 0, behavior: "smooth" });
    //smoothScrollToTop();
}

submitButton.addEventListener("click", checkAnswers);
showAnswersButton.addEventListener("click", showCorrectAnswers);
restartButton.addEventListener("click", restartQuiz);
showAnswersButton.addEventListener("click", toggleCorrectAnswers);