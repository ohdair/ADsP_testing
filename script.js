let currentQuestionIndex = 0;
let selectedExamQuestions = [];

const examContainer = document.getElementById("exam-container");
const examButtonsContainer = document.getElementById("exam-buttons");
const quizContainer = document.getElementById("quiz-container");
const questionContainer = document.getElementById("question-container");
const questionElement = document.getElementById("question");
const passageElement = document.getElementById("passage");
const answerButtonsElement = document.getElementById("answer-buttons");
const subjectiveAnswerElement = document.getElementById("subjective-answer");
const navigationButtonsElement = document.getElementById("navigation-buttons");
const nextQuestionButton = document.getElementById("next-question");

document.addEventListener("DOMContentLoaded", () => {
  fetchExams();
});

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const progressPercentage =
    ((currentQuestionIndex + 1) / selectedExamQuestions.length) * 100;
  progressBar.style.width = progressPercentage + "%";
}

async function fetchExams() {
  try {
    const response = await fetch("exams.json");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const exams = await response.json();
    exams.forEach((exam) => {
      const button = document.createElement("button");
      button.classList.add("btn");
      button.innerText = exam.title;
      button.addEventListener("click", () =>
        loadExam(`exams/${exam.filename}`)
      );
      examButtonsContainer.appendChild(button);
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
  }
}

async function loadExam(examFilename) {
  try {
    const response = await fetch(examFilename);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const examData = await response.json();
    selectedExamQuestions = shuffleArray(examData.questions);
    currentQuestionIndex = 0;
    examContainer.classList.add("hide");
    quizContainer.classList.remove("hide");
    setNextQuestion();
  } catch (error) {
    console.error("Error loading exam:", error);
  }
}

function setNextQuestion() {
  resetState();
  showQuestion(selectedExamQuestions[currentQuestionIndex]);
}

function showQuestion(question) {
  updateProgressBar();

  questionElement.innerText = `${question.question}`;

  if (question.passage) {
    if (/\.(png|jpg|jpeg|gif)$/i.test(question.passage)) {
      const imgElement = document.createElement("img");
      imgElement.src = question.passage;
      passageElement.innerHTML = "";
      passageElement.appendChild(imgElement);
    } else {
      passageElement.innerText = question.passage;
    }
    passageElement.classList.remove("hide");
  } else {
    passageElement.classList.add("hide");
  }

  if (question.options && question.options.length > 0) {
    subjectiveAnswerElement.classList.add("hide");
    answerButtonsElement.classList.remove("hide");
    const shuffledOptions = shuffleArray([...question.options]);
    shuffledOptions.forEach((option, index) => {
      const button = document.createElement("button");
      button.innerHTML = option;
      button.classList.add("btn");
      button.dataset.correct = option === question.options[parseInt(question.answer) - 1];
      button.dataset.originalIndex = question.options.indexOf(option);
      button.addEventListener("click", () => selectAnswer(button, question));
      answerButtonsElement.appendChild(button);
    });
    MathJax.typeset();
  } else {
    answerButtonsElement.classList.add("hide");
    subjectiveAnswerElement.classList.remove("hide");
    subjectiveAnswerElement.focus();
    subjectiveAnswerElement.onkeydown = (event) => {
      if (event.key === "Enter") {
        selectSubjectiveAnswer(question);
      }
    };
    nextQuestionButton.onclick = () => selectSubjectiveAnswer(question);
  }
  navigationButtonsElement.classList.add("hide");
}

function resetState() {
  while (answerButtonsElement.firstChild) {
    answerButtonsElement.removeChild(answerButtonsElement.firstChild);
  }
  subjectiveAnswerElement.value = "";
  subjectiveAnswerElement.onkeydown = null;
  navigationButtonsElement.classList.add("hide");

  const explanationElement = document.querySelector('.explanation');
  if (explanationElement) {
    explanationElement.remove();
  }
}

function selectAnswer(selectedButton, question) {
  Array.from(answerButtonsElement.children).forEach((button) => {
    setStatusClass(button, button.dataset.correct === "true");
  });
  if (selectedButton.dataset.correct === "true") {
    selectedButton.classList.add("correct");
  } else {
    selectedButton.classList.add("wrong");
  }
  showExplanation(question);
  navigationButtonsElement.classList.remove("hide");
  nextQuestionButton.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < selectedExamQuestions.length) {
      setNextQuestion();
    } else {
      showExamSelection();
    }
  };
}

function selectSubjectiveAnswer(question) {
  const userAnswer = subjectiveAnswerElement.value.trim();
  const correctAnswer = question.answer;
  const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

  showExplanation(question);

  navigationButtonsElement.classList.remove("hide");
  nextQuestionButton.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < selectedExamQuestions.length) {
      setNextQuestion();
    } else {
      showExamSelection();
    }
  };
}

function showExplanation(question) {
  const explanationElement = document.createElement("div");
  explanationElement.classList.add("explanation");
  
  let correctAnswer;
  let explanationHtml = ``;
  if (question.options.length == 0) {
    correctAnswer = question.answer;
    explanationHtml = `<p><strong>${correctAnswer}</strong></p>`;
    explanationElement.innerHTML = explanationHtml;
  }
  
  if (question.explanation) {
    explanationHtml += `<p>${question.explanation}</p>`;
    explanationElement.innerHTML = explanationHtml;
  }
  
  const oldExplanation = document.querySelector('.explanation');
  if (oldExplanation) {
    oldExplanation.remove();
  }
  
  if (question.options && question.options.length > 0) {
    const correctButton = Array.from(answerButtonsElement.children).find(
      button => button.dataset.correct === "true"
    );
    
    if (correctButton) {
      correctButton.insertAdjacentElement('afterend', explanationElement);
    }
  } else {
    subjectiveAnswerElement.insertAdjacentElement('afterend', explanationElement);
  }
}

function setStatusClass(element, correct) {
  clearStatusClass(element);
  if (correct) {
    element.classList.add("correct");
  } else {
    element.classList.add("wrong");
  }
}

function clearStatusClass(element) {
  element.classList.remove("correct");
  element.classList.remove("wrong");
}

function showExamSelection() {
  quizContainer.classList.add("hide");
  examContainer.classList.remove("hide");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}