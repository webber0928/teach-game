var socket = io();
var questionNum = 1; //Starts at two because question 1 is already present

function updateDatabase(){
    let questions = [];
    let name = document.getElementById('name').value;
    for(let i = 1; i <= questionNum; i++){
        let question = document.getElementById('q' + i).value;
        let answer1 = document.getElementById(i + 'a1').value;
        let answer2 = document.getElementById(i + 'a2').value;
        let answer3 = document.getElementById(i + 'a3').value;
        let answer4 = document.getElementById(i + 'a4').value;
        let correct = document.getElementById('correct' + i).value;
        let answers = [answer1, answer2, answer3, answer4];
        questions.push({"question": question, "answers": answers, "correct": correct})
    }
    
    let quiz = {id: 0, "name": name, "questions": questions};
    console.log('L5555', quiz)
    socket.emit('newQuiz', quiz);
}

function addQuestion(){
    questionNum += 1;
    
    let questionsDiv = document.getElementById('allQuestions');
    
    let newQuestionDiv = document.createElement("div");
    
    let questionLabel = document.createElement('label');
    let questionField = document.createElement('input');
    
    let answer1Label = document.createElement('label');
    let answer1Field = document.createElement('input');
    
    let answer2Label = document.createElement('label');
    let answer2Field = document.createElement('input');
    
    let answer3Label = document.createElement('label');
    let answer3Field = document.createElement('input');
    
    let answer4Label = document.createElement('label');
    let answer4Field = document.createElement('input');
    
    let correctLabel = document.createElement('label');
    let correctField = document.createElement('input');
    
    questionLabel.innerHTML = "Question " + String(questionNum) + ": ";
    questionField.setAttribute('class', 'question');
    questionField.setAttribute('id', 'q' + String(questionNum));
    questionField.setAttribute('type', 'text');
    
    answer1Label.innerHTML = "Answer 1: ";
    answer2Label.innerHTML = " Answer 2: ";
    answer3Label.innerHTML = "Answer 3: ";
    answer4Label.innerHTML = " Answer 4: ";
    correctLabel.innerHTML = "Correct Answer (1-4): ";
    
    answer1Field.setAttribute('id', String(questionNum) + "a1");
    answer1Field.setAttribute('type', 'text');
    answer2Field.setAttribute('id', String(questionNum) + "a2");
    answer2Field.setAttribute('type', 'text');
    answer3Field.setAttribute('id', String(questionNum) + "a3");
    answer3Field.setAttribute('type', 'text');
    answer4Field.setAttribute('id', String(questionNum) + "a4");
    answer4Field.setAttribute('type', 'text');
    correctField.setAttribute('id', 'correct' + String(questionNum));
    correctField.setAttribute('type', 'number');
    
    newQuestionDiv.setAttribute('id', 'question-field');//Sets class of div
    
    newQuestionDiv.appendChild(questionLabel);
    newQuestionDiv.appendChild(questionField);
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(answer1Label);
    newQuestionDiv.appendChild(answer1Field);
    newQuestionDiv.appendChild(answer2Label);
    newQuestionDiv.appendChild(answer2Field);
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(answer3Label);
    newQuestionDiv.appendChild(answer3Field);
    newQuestionDiv.appendChild(answer4Label);
    newQuestionDiv.appendChild(answer4Field);
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(document.createElement('br'));
    newQuestionDiv.appendChild(correctLabel);
    newQuestionDiv.appendChild(correctField);
    
    questionsDiv.appendChild(document.createElement('br'));//Creates a break between each question
    questionsDiv.appendChild(newQuestionDiv);//Adds the question div to the screen
    
    newQuestionDiv.style.backgroundColor = randomColor();
}

//Called when user wants to exit quiz creator
function cancelQuiz(){
    if (confirm("Are you sure you want to exit? All work will be DELETED!")) {
        window.location.href = "../";
    }
}

socket.on('startGameFromCreator', function(data){
    window.location.href = "../../host/?id=" + data;
});

function randomColor(){
    
    let colors = ['#4CAF50', '#f94a1e', '#3399ff', '#ff9933'];
    let randomNum = Math.floor(Math.random() * 4);
    return colors[randomNum];
}

function setBGColor(){
    let randColor = randomColor();
    document.getElementById('question-field').style.backgroundColor = randColor;
}









