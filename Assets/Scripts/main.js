var MainPage = function() {
    var taskViewer = {
        mainContainer: null,
        newTaskContainer: null,
        addBtn: null,
        taskTable,
        allTasks: [],

        init: function() {
            this.mainContainer = document.getElementById('mainContainer');
            this.newTaskContainer = document.getElementById('newTaskContainer');
            this.taskTable = document.getElementById('taskTable');
            this.addBtn = document.getElementById('addBtn');
            this.addBtn.addEventListener('click', this.openAddWindow);

            this.getAllTasks(this.displayAllTasks);
        },
        openAddWindow: function() {
            taskViewer.mainContainer.className = 'hidden';
            taskViewer.newTaskContainer.className = 'visible';
            newTaskWindow.init();
        },
        closeAddWindow: function() {
            taskViewer.mainContainer.className = 'visible';
            taskViewer.newTaskContainer.className = 'hidden';
        },
        saveTasks: function() {
            chrome.storage.sync.set({'Tasks': taskViewer.allTasks});
        },
        getAllTasks: function(next) {
            chrome.storage.sync.get('Tasks', function(result) {
                if (chrome.runtime.lastError) {
                    console.error("Unable to retrieve tasks!");
                    return;
                }

                taskViewer.allTasks = result['Tasks'] || [];
                next(taskViewer.allTasks);
            });
        },
        completeTask: function(index) {
            var currentClass = taskViewer.taskTable.rows[index + 1].className;

            currentClass = (currentClass === 'strikeout') ? '' : 'strikeout';
            taskViewer.taskTable.rows[index + 1].className = currentClass;
        },
        deleteTask: function(index) {
            taskViewer.allTasks.splice(index, 1);
            taskViewer.taskTable.deleteRow(index + 1);
            this.saveTasks();
        },
        displayAllTasks: function(tasks) {
            for(var i = 0; i < tasks.length; i++) {
                taskViewer.createTaskDisplay(tasks[i], i);
            }
        },
        createTaskDisplay: function(task, index) {
            var newRow = taskViewer.taskTable.insertRow(taskViewer.taskTable.length);

            var taskCompleteCell = newRow.insertCell(0);
            var completeCheckBox = document.createElement('input');
            completeCheckBox.type = 'checkbox';
            completeCheckBox.addEventListener('click', function() {
               taskViewer.completeTask(index);
            });
            taskCompleteCell.appendChild(completeCheckBox);

            var taskNameCell = newRow.insertCell(1);
            taskNameCell.innerHTML = task.name;

            var taskDescCell = newRow.insertCell(2);
            taskDescCell.innerHTML = task.desc;

            var taskDueDateCell = newRow.insertCell(3);
            taskDueDateCell.innerHTML = task.dueDate;

            var deleteIcon = newRow.insertCell(4);
            var buttonElem = document.createElement('button');
            buttonElem.className = 'close pull-left';
            buttonElem.innerHTML = "<span aria-hidden='true'>&times;</span>";
            buttonElem.addEventListener('click', function() {
                taskViewer.deleteTask(index);
            });
            deleteIcon.appendChild(buttonElem);
        },
        deleteAllTasks: function() {
            chrome.storage.sync.clear(function() {
                console.log("All tasks cleared!");
            });
        }
    };

    var newTaskWindow = {
        newTaskForm: null,
        createBtn: null,
        cancelBtn: null,
        addNewTask: function() {
            var taskName = document.getElementById('taskName').value,
                taskDec = document.getElementById('taskDesc').value,
                taskDueDate = document.getElementById('taskDueDate').value,
                taskReoccurring = document.getElementById('taskReoccurring').checked;

            var task = newTaskWindow.createTask(taskName, taskDec, taskDueDate, taskReoccurring);
            newTaskWindow.saveTask(task);
        },
        createTask: function(taskName, taskDesc, taskDueDate, reoccurring) {
            if(!taskName || taskName === '') {
                window.alert('You must have a name for a new task!');
                return;
            }

            var newTask = {
                name: taskName,
                desc: taskDesc,
                dueDate: taskDueDate,
                reoccurring: reoccurring
            };

            return newTask;
        },
        saveTask: function(task) {
            var taskIndex = taskViewer.allTasks.push(task);
            taskViewer.closeAddWindow();
            taskViewer.createTaskDisplay(taskViewer.allTasks[taskIndex - 1], taskIndex - 1);
            taskViewer.saveTasks();
        },
        cancelTask: function() {
            newTaskWindow.newTaskForm.reset();
            taskViewer.closeAddWindow();
        },
        init: function() {
            this.newTaskForm = document.getElementById('newTaskForm');
            this.createBtn = document.getElementById('createBtn');
            this.cancelBtn = document.getElementById('cancelBtn');

            //Listeners
            this.createBtn.addEventListener('click', this.addNewTask);
            this.cancelBtn.addEventListener('click', this.cancelTask);
        }
    };

    taskViewer.init();
}();